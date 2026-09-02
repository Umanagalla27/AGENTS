# NEXUS AI — Enterprise Intelligent Customer Operations
FROM python:3.11-slim

WORKDIR /app/enterprise_agent

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/enterprise_agent/requirements.txt
RUN pip install --no-cache-dir -r /app/enterprise_agent/requirements.txt

COPY . /app/enterprise_agent

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["python", "-m", "uvicorn", "enterprise_agent.app:app", "--host", "0.0.0.0", "--port", "8000"]
