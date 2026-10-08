from fastapi.testclient import TestClient

from backend.main import app, store


client = TestClient(app)


def setup_function() -> None:
    if store.progress_path.exists():
        store.progress_path.unlink()


def test_health_endpoint() -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_join_hunt_by_access_code_returns_tasks() -> None:
    response = client.post(
        "/api/hunts/join",
        json={"access_code": "BUC123", "player_id": "player-one"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["hunt_id"] == "old-town-secrets"
    assert body["access_code"] == "BUC123"
    assert len(body["tasks"]) == 3


def test_invalid_access_code_is_rejected() -> None:
    response = client.post(
        "/api/hunts/join",
        json={"access_code": "NOPE", "player_id": "player-one"},
    )

    assert response.status_code == 404


def test_correct_answer_completes_task_and_sorts_it_after_incomplete_tasks() -> None:
    response = client.post(
        "/api/hunts/old-town-secrets/tasks/clockkeeper/submit",
        json={"player_id": "player-one", "answer": "Twelve"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["correct"] is True
    assert body["tasks"][-1]["id"] == "clockkeeper"
    assert body["tasks"][-1]["completed"] is True


def test_incorrect_answer_does_not_complete_task() -> None:
    response = client.post(
        "/api/hunts/old-town-secrets/tasks/clockkeeper/submit",
        json={"player_id": "player-one", "answer": "eleven"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["correct"] is False
    assert all(task["completed"] is False for task in body["tasks"])


def test_same_code_can_be_joined_by_multiple_players() -> None:
    first = client.post(
        "/api/hunts/join",
        json={"access_code": "BUC123", "player_id": "first-player"},
    )
    second = client.post(
        "/api/hunts/join",
        json={"access_code": "BUC123", "player_id": "second-player"},
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["hunt_id"] == second.json()["hunt_id"]
