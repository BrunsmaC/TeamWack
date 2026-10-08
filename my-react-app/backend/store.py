import csv
import json
import os
import random
import re
import string
from pathlib import Path

from .models import Hunt, PublicTask, Task


DATA_DIR = Path(__file__).parent / "data"
HUNTS_PATH = DATA_DIR / "hunts.csv"
TASKS_PATH = DATA_DIR / "tasks.csv"
PROGRESS_PATH = Path(os.environ.get("BUCHUNT_PROGRESS_PATH", DATA_DIR / "player_progress.json"))


def _normalize_code(access_code: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", access_code.upper())


def _normalize_answer(answer: str) -> str:
    return re.sub(r"\s+", " ", answer.strip().lower())


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as csv_file:
        return list(csv.DictReader(csv_file))


def _write_hunts(path: Path, hunts: list[Hunt]) -> None:
    with path.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=["id", "name", "access_code"])
        writer.writeheader()
        for hunt in hunts:
            writer.writerow(hunt.model_dump())


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
    return slug or "hunt"


class HuntStore:
    def __init__(
        self,
        hunts_path: Path = HUNTS_PATH,
        tasks_path: Path = TASKS_PATH,
        progress_path: Path = PROGRESS_PATH,
    ) -> None:
        self.hunts_path = hunts_path
        self.tasks_path = tasks_path
        self.progress_path = progress_path
        self.progress_path.parent.mkdir(parents=True, exist_ok=True)

    def list_hunts(self) -> list[Hunt]:
        hunts = [
            Hunt(
                id=row["id"],
                name=row["name"],
                access_code=_normalize_code(row["access_code"]),
            )
            for row in _read_csv(self.hunts_path)
        ]
        codes = [hunt.access_code for hunt in hunts]
        duplicate_codes = sorted({code for code in codes if codes.count(code) > 1})
        if duplicate_codes:
            duplicates = ", ".join(duplicate_codes)
            raise ValueError(f"Duplicate hunt access codes found: {duplicates}")
        return hunts

    def list_tasks(self) -> list[Task]:
        return [
            Task(
                id=row["id"],
                hunt_id=row["hunt_id"],
                title=row["title"],
                description=row["description"],
                expected_answer=row["expected_answer"],
                latitude=float(row["latitude"]),
                longitude=float(row["longitude"]),
            )
            for row in _read_csv(self.tasks_path)
        ]

    def get_hunt_by_code(self, access_code: str) -> Hunt | None:
        code = _normalize_code(access_code)
        return next((hunt for hunt in self.list_hunts() if hunt.access_code == code), None)

    def get_hunt(self, hunt_id: str) -> Hunt | None:
        return next((hunt for hunt in self.list_hunts() if hunt.id == hunt_id), None)

    def get_tasks_for_hunt(self, hunt_id: str) -> list[Task]:
        return [task for task in self.list_tasks() if task.hunt_id == hunt_id]

    def read_progress(self) -> dict[str, dict[str, list[str]]]:
        if not self.progress_path.exists():
            return {}
        with self.progress_path.open(encoding="utf-8") as progress_file:
            return json.load(progress_file)

    def write_progress(self, progress: dict[str, dict[str, list[str]]]) -> None:
        with self.progress_path.open("w", encoding="utf-8") as progress_file:
            json.dump(progress, progress_file, indent=2, sort_keys=True)

    def get_completed_task_ids(self, hunt_id: str, player_id: str) -> set[str]:
        progress = self.read_progress()
        return set(progress.get(hunt_id, {}).get(player_id, []))

    def mark_task_complete(self, hunt_id: str, player_id: str, task_id: str) -> None:
        progress = self.read_progress()
        hunt_progress = progress.setdefault(hunt_id, {})
        completed = set(hunt_progress.setdefault(player_id, []))
        completed.add(task_id)
        hunt_progress[player_id] = sorted(completed)
        self.write_progress(progress)

    def public_tasks(self, hunt_id: str, player_id: str) -> list[PublicTask]:
        completed_ids = self.get_completed_task_ids(hunt_id, player_id)
        tasks = [
            PublicTask(
                id=task.id,
                title=task.title,
                description=task.description,
                latitude=task.latitude,
                longitude=task.longitude,
                completed=task.id in completed_ids,
            )
            for task in self.get_tasks_for_hunt(hunt_id)
        ]
        return sorted(tasks, key=lambda task: (task.completed, task.title.lower()))

    def validate_answer(self, task: Task, answer: str) -> bool:
        return _normalize_answer(task.expected_answer) == _normalize_answer(answer)

    def generate_unique_code(self, length: int = 6) -> str:
        existing_codes = {hunt.access_code for hunt in self.list_hunts()}
        alphabet = string.ascii_uppercase + string.digits
        while True:
            code = "".join(random.choice(alphabet) for _ in range(length))
            if code not in existing_codes:
                return code

    def create_hunt(self, name: str) -> Hunt:
        hunts = self.list_hunts()
        base_id = _slugify(name)
        existing_ids = {hunt.id for hunt in hunts}
        hunt_id = base_id
        suffix = 2
        while hunt_id in existing_ids:
            hunt_id = f"{base_id}-{suffix}"
            suffix += 1
        hunt = Hunt(id=hunt_id, name=name.strip(), access_code=self.generate_unique_code())
        hunts.append(hunt)
        _write_hunts(self.hunts_path, hunts)
        return hunt
