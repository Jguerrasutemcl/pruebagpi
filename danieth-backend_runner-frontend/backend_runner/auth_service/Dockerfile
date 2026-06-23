FROM python:3.11-slim
WORKDIR /app
COPY shared/ ./shared/
COPY auth_service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY auth_service/ ./auth_service/
CMD ["uvicorn", "auth_service.app.main:app", "--host", "0.0.0.0", "--port", "8001"]
