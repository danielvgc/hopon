# Backend Dockerfile for HopOn
# Builds a compact image running gunicorn for the Flask app
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy project files
COPY pyproject.toml ./
COPY app.py ./
COPY models.py ./
# Copy everything else from the backend context
COPY . ./

# Install Python dependencies (including gunicorn for production)
RUN pip install --no-cache-dir \
    Flask==3.0.3 \
    Flask-SQLAlchemy==3.1.1 \
    Flask-CORS==4.0.0 \
    python-dotenv==1.0.0 \
    Authlib==1.3.2 \
    PyJWT==2.9.0 \
    requests==2.31.0 \
    gunicorn==20.1.0

# Expose port
EXPOSE 8000

# Use a sensible default command for production
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "app:app"]
