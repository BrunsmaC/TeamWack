from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .models import (
    CreateHuntRequest,
    CreateHuntResponse,
    JoinHuntRequest,
    JoinHuntResponse,
    SubmitTaskRequest,
    SubmitTaskResponse,
)
from .store import HuntStore


app = FastAPI(title="Buchunt API")
store = HuntStore()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "message": "Buchunt backend is running"}


@app.post("/api/hunts/join", response_model=JoinHuntResponse)
def join_hunt(request: JoinHuntRequest) -> JoinHuntResponse:
    hunt = store.get_hunt_by_code(request.access_code)
    if hunt is None:
        raise HTTPException(status_code=404, detail="Invalid hunt access code")

    return JoinHuntResponse(
        hunt_id=hunt.id,
        hunt_name=hunt.name,
        access_code=hunt.access_code,
        player_id=request.player_id,
        tasks=store.public_tasks(hunt.id, request.player_id),
    )


@app.get("/api/hunts/{hunt_id}/tasks")
def get_tasks(hunt_id: str, player_id: str) -> dict[str, object]:
    hunt = store.get_hunt(hunt_id)
    if hunt is None:
        raise HTTPException(status_code=404, detail="Hunt not found")

    return {
        "hunt_id": hunt.id,
        "hunt_name": hunt.name,
        "tasks": store.public_tasks(hunt.id, player_id),
    }


@app.post("/api/hunts/{hunt_id}/tasks/{task_id}/submit", response_model=SubmitTaskResponse)
def submit_task(hunt_id: str, task_id: str, request: SubmitTaskRequest) -> SubmitTaskResponse:
    hunt = store.get_hunt(hunt_id)
    if hunt is None:
        raise HTTPException(status_code=404, detail="Hunt not found")

    task = next((candidate for candidate in store.get_tasks_for_hunt(hunt.id) if candidate.id == task_id), None)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    correct = store.validate_answer(task, request.answer)
    if correct:
        store.mark_task_complete(hunt.id, request.player_id, task.id)

    return SubmitTaskResponse(
        correct=correct,
        completed=correct,
        message="Task completed" if correct else "That answer is not correct yet",
        tasks=store.public_tasks(hunt.id, request.player_id),
    )


@app.post("/api/hunts", response_model=CreateHuntResponse, status_code=201)
def create_hunt(request: CreateHuntRequest) -> CreateHuntResponse:
    hunt = store.create_hunt(request.name)
    return CreateHuntResponse(
        hunt_id=hunt.id,
        hunt_name=hunt.name,
        access_code=hunt.access_code,
    )


DIST_DIR = Path(__file__).resolve().parent.parent / "dist"
ASSETS_DIR = DIST_DIR / "assets"

if ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")


@app.get("/{full_path:path}", include_in_schema=False)
def serve_react_app(full_path: str) -> FileResponse:
    if full_path.startswith("api/") or not DIST_DIR.exists():
        raise HTTPException(status_code=404, detail="Not found")

    requested_path = DIST_DIR / full_path
    if requested_path.is_file():
        return FileResponse(requested_path)
    return FileResponse(DIST_DIR / "index.html")
