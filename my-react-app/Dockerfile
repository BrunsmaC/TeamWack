FROM node:24-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM python:3.14-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV BUCHUNT_PROGRESS_PATH=/app/data/player_progress.json
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend ./backend
COPY --from=frontend /app/dist ./dist
VOLUME ["/app/data"]
EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
