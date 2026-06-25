"""
Endpoints de reportes.

Flujo:
  1. El orquestador llama POST /reports con el reporte terminado.
     - Se valida el X-Service-Token.
     - Si viene pdf_base64, se sube a Supabase Storage (gratuito).
     - El reporte se guarda en Firestore.
  2. El front pide GET /reports, GET /reports/{id}, GET /reports/{id}/pdf.
     - El PDF redirige a la URL pública de Supabase.
"""
import base64
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import RedirectResponse

from app.core.security import requiere_permiso
from app.core.firebase import get_firestore
from app.core.config import settings
from app.schemas.report import ReportSummary, ReportDetail, ReportIngest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reports", tags=["reports"])

ReadReports = Annotated[dict, Depends(requiere_permiso("read:reports"))]

# ── Inicialización de Supabase ────────────────────────────────────────────────
# Ahora usa settings.supabase_configured que lee correctamente el .env

supabase_client = None
supabase_ready = False

if settings.supabase_configured:
    try:
        from supabase import create_client
        supabase_client = create_client(settings.supabase_url, settings.supabase_key)
        supabase_ready = True
        logger.info(f"Supabase Storage inicializado: {settings.supabase_url}")
    except Exception as e:
        logger.error(f"Error inicializando Supabase: {e}")
else:
    logger.warning(
        "Supabase no configurado. Los PDFs no se guardarán. "
        "Agrega SUPABASE_URL y SUPABASE_KEY al .env para activarlo."
    )


def _verify_service_token(x_service_token: str | None = Header(default=None)):
    """Solo el orquestador puede llamar POST /reports."""
    if x_service_token != settings.orchestrator_service_token:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "INVALID_SERVICE_TOKEN",
                "message": "Acceso no autorizado. Solo el orquestador puede llamar este endpoint.",
            },
        )


# ── El orquestador empuja el reporte terminado ────────────────────────────────

@router.post("", status_code=201)
async def ingest_report(
    body: ReportIngest,
    _token=Depends(_verify_service_token),
) -> dict:
    """
    Recibe el reporte del orquestador y lo guarda en Firestore.
    Si viene pdf_base64 y Supabase está configurado, sube el PDF
    al bucket 'reportes' y guarda la URL pública en Firestore.
    Header requerido: X-Service-Token
    """
    db = get_firestore()
    doc_ref = db.collection("reports").document()
    report_id = doc_ref.id
    pdf_url: str | None = None

    if body.pdf_base64:
        if not supabase_ready:
            logger.warning("PDF recibido pero Supabase no está configurado.")
        else:
            try:
                pdf_bytes = base64.b64decode(body.pdf_base64)
                file_name = f"{report_id}.pdf"

                supabase_client.storage.from_("reportes").upload(
                    path=file_name,
                    file=pdf_bytes,
                    file_options={"content-type": "application/pdf"},
                )
                pdf_url = supabase_client.storage.from_("reportes").get_public_url(file_name)
                logger.info(f"PDF subido a Supabase: reportes/{file_name}")
            except Exception as e:
                logger.error(f"Error subiendo PDF a Supabase: {e}")
                # El reporte se guarda igual, solo sin PDF

    # Subir contenido Markdown a Supabase Storage si está disponible
    markdown_url: str | None = None
    md_content = body.summary.get("markdown") if isinstance(body.summary, dict) else None
    if md_content and supabase_ready:
        try:
            md_bytes = md_content.encode("utf-8")
            md_file  = f"{report_id}.md"
            supabase_client.storage.from_("reportes").upload(
                path=md_file,
                file=md_bytes,
                file_options={"content-type": "text/markdown; charset=utf-8"},
            )
            markdown_url = supabase_client.storage.from_("reportes").get_public_url(md_file)
            logger.info(f"Markdown subido a Supabase: reportes/{md_file}")
        except Exception as e:
            logger.error(f"Error subiendo Markdown a Supabase: {e}")

    doc_ref.set({
        "report_id": report_id,
        "campaign_id": body.campaign_id,
        "target": body.target,
        "type": body.type,
        "summary": body.summary,
        "findings": body.findings,
        "generated_at": body.generated_at,
        "pdf_url": pdf_url,
        "markdown_url": markdown_url,
    })

    return {
        "report_id": report_id,
        "message": "Reporte guardado correctamente",
        "pdf_stored": pdf_url is not None,
        "markdown_stored": markdown_url is not None,
    }


# ── El front pide reportes ────────────────────────────────────────────────────

@router.get("", response_model=list[ReportSummary])
async def list_reports(
    _: ReadReports,
    limit: int = 20,
    offset: int = 0,
) -> list[ReportSummary]:
    """Lista todos los reportes (requiere read:reports)."""
    db = get_firestore()
    docs = list(
        db.collection("reports")
        .order_by("generated_at", direction="DESCENDING")
        .stream()
    )
    page = docs[offset: offset + limit]
    return [
        ReportSummary(
            report_id=d.to_dict().get("report_id", d.id),
            campaign_id=d.to_dict().get("campaign_id", ""),
            target=d.to_dict().get("target", ""),
            type=d.to_dict().get("type", "technical"),
            generated_at=d.to_dict().get("generated_at", ""),
            pdf_url=d.to_dict().get("pdf_url"),
            markdown_url=d.to_dict().get("markdown_url"),
        )
        for d in page
    ]


@router.get("/{report_id}", response_model=ReportDetail)
async def get_report(report_id: str, _: ReadReports) -> ReportDetail:
    """Detalle completo de un reporte (requiere read:reports)."""
    db = get_firestore()
    doc = db.collection("reports").document(report_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    data = doc.to_dict()
    return ReportDetail(
        report_id=data.get("report_id", report_id),
        campaign_id=data.get("campaign_id", ""),
        target=data.get("target", ""),
        type=data.get("type", "technical"),
        summary=data.get("summary"),
        findings=data.get("findings", []),
        generated_at=data.get("generated_at", ""),
        pdf_url=data.get("pdf_url"),
        markdown_url=data.get("markdown_url"),
    )

from fastapi import UploadFile, File

@router.post("/{report_id}/pdf", status_code=200)
async def upload_report_pdf(
    report_id: str,
    file: UploadFile = File(...),
    _token=Depends(_verify_service_token),
) -> dict:
    """
    Recibe el PDF como archivo binario y lo sube a Supabase.
    
    El orquestador hace DOS llamadas:
      1. POST /reports       → manda los datos del reporte (JSON)
      2. POST /reports/{id}/pdf → manda el PDF como archivo binario
      
    Header requerido: X-Service-Token
    """
    db = get_firestore()

    # Verificar que el reporte existe
    doc = db.collection("reports").document(report_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    if not supabase_ready:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "SUPABASE_NOT_CONFIGURED",
                "message": "Supabase no configurado. Agrega SUPABASE_URL y SUPABASE_KEY al .env."
            }
        )

    try:
        pdf_bytes = await file.read()
        file_name = f"{report_id}.pdf"

        supabase_client.storage.from_("reportes").upload(
            path=file_name,
            file=pdf_bytes,
            file_options={"content-type": "application/pdf"},
        )
        pdf_url = supabase_client.storage.from_("reportes").get_public_url(file_name)

        # Guardar la URL pública en Firestore
        db.collection("reports").document(report_id).update({"pdf_url": pdf_url})
        logger.info(f"PDF subido a Supabase: reportes/{file_name}")

        return {
            "report_id": report_id,
            "pdf_url": pdf_url,
            "message": "PDF subido correctamente"
        }

    except Exception as e:
        logger.error(f"Error subiendo PDF a Supabase: {e}")
        raise HTTPException(status_code=500, detail=f"Error subiendo PDF: {str(e)}")

@router.get("/{report_id}/pdf")
async def get_report_pdf(report_id: str, _: ReadReports):
    """
    Descarga el PDF redirigiendo a la URL pública de Supabase.
    Si no hay PDF devuelve 404 con instrucción.
    """
    db = get_firestore()
    doc = db.collection("reports").document(report_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    pdf_url = doc.to_dict().get("pdf_url")
    if pdf_url:
        return RedirectResponse(url=pdf_url, status_code=302)

    raise HTTPException(
        status_code=404,
        detail={
            "error": "PDF_NOT_AVAILABLE",
            "message": "PDF no disponible. El orquestador debe incluir pdf_base64 en POST /reports.",
        },
    )