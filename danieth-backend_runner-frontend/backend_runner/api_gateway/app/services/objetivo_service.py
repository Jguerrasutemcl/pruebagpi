from sqlalchemy.ext.asyncio import AsyncSession

from api_gateway.app.repositories.objetivo_repository import ObjetivoRepository
from api_gateway.app.repositories.usuario_repository import UsuarioRepository

from api_gateway.app.core.exceptions import NotFoundException


class ObjetivoService:

    @staticmethod
    async def crear_objetivo(
        session: AsyncSession,
        usuario_id: int,
        url_objetivo: str
    ):

        usuario = await UsuarioRepository.obtener_por_id(
            session=session,
            usuario_id=usuario_id
        )

        if not usuario:
            raise NotFoundException(
                detail="Usuario no existe"
            )

        objetivo_id = await ObjetivoRepository.crear_objetivo(
            session=session,
            usuario_id=usuario_id,
            url_objetivo=url_objetivo
        )

        return objetivo_id