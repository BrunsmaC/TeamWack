# Buchunt frontend

React frontend prototype for Sprint 1. The home and game pages run without a backend.

## Run locally

```bash
npm install
npm run dev
```

Enter any nonempty game code to preview the game page, or open `/game` to view the access-code form. The map, task cards, answer forms, and progress display use sample content. Submitting an answer displays a prototype message; answers are not checked and progress is not saved.

## Checks

```bash
npm run lint
npm run build
```

## Docker

From the repository root, run `docker compose up --build` and open `http://localhost:8081`.
