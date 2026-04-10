FROM python:3.11-slim

# Install Node.js 20
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python deps (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# npm install (cached layer — only re-runs if package.json changes)
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy ALL source files
COPY . .

# Create output dirs if not present
RUN mkdir -p /app/static /app/templates

# Build frontend AFTER copy — output goes to /app/static + /app/templates
RUN cd frontend && npm run build

CMD ["python", "start.py"]
