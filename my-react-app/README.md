# Buchunt

Buchunt is now split into a React browser client and a FastAPI backend.

## Run locally

Install backend requirements:

```bash
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Start the API:

```bash
npm run api
```

Start the browser client in a second terminal:

```bash
npm run dev
```

The Vite dev server proxies `/api` requests to FastAPI on `http://127.0.0.1:8000`.

## Test codes

- `BUC123` joins Old Town Secrets
- `PARK42` joins Campus Trail

## Dev task answers

Use these answers while testing manual task completion:

- `BUC123` / Old Town Secrets
  - The Clockkeeper: `twelve`
  - Hidden Garden Gate: `sunflower`
  - Market Motto: `together`
- `PARK42` / Campus Trail
  - Library Lion: `lion`
  - Quad Code: `eight`

Task definitions live in `backend/data/tasks.csv`. Hunt access codes live in `backend/data/hunts.csv`, and duplicate codes are rejected when the API reads hunt data.

## Docker deployment

The `Dockerfile` builds the React client and serves the built files from the FastAPI app. In the container, one process handles both the API and browser routes:

- API routes: `/api/*`
- Browser routes: `/` and `/game`

Build the image:

```bash
docker build -t buchunt .
```

Run the container:

```bash
docker run --rm -p 8000:8000 --name buchunt buchunt
```

Open the app at `http://localhost:8000`. The health endpoint is `http://localhost:8000/api/health`.

Player progress is stored at `/app/data/player_progress.json` inside the container. To keep progress after the container stops, mount that data directory:

```bash
docker run --rm -p 8000:8000 --name buchunt -v buchunt-data:/app/data buchunt
```

If you use that volume command, Docker will persist player progress in the `buchunt-data` volume while the seed hunt/task CSV files still come from the image.
