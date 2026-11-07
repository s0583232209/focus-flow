FROM python:3.12-slim

# Run as a non-root user.
RUN useradd --create-home --uid 1000 appuser

WORKDIR /app

# Requirements first, so the pip layer stays cached when only the code changes.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips=*"]
