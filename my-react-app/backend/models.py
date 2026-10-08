from pydantic import BaseModel, Field


class Hunt(BaseModel):
    id: str
    name: str
    access_code: str


class Task(BaseModel):
    id: str
    hunt_id: str
    title: str
    description: str
    expected_answer: str
    latitude: float
    longitude: float


class PublicTask(BaseModel):
    id: str
    title: str
    description: str
    latitude: float
    longitude: float
    completed: bool = False


class JoinHuntRequest(BaseModel):
    access_code: str = Field(..., min_length=1)
    player_id: str = Field(..., min_length=1)


class JoinHuntResponse(BaseModel):
    hunt_id: str
    hunt_name: str
    access_code: str
    player_id: str
    tasks: list[PublicTask]


class SubmitTaskRequest(BaseModel):
    player_id: str = Field(..., min_length=1)
    answer: str = Field(..., min_length=1)


class SubmitTaskResponse(BaseModel):
    correct: bool
    completed: bool
    message: str
    tasks: list[PublicTask]


class CreateHuntRequest(BaseModel):
    name: str = Field(..., min_length=1)


class CreateHuntResponse(BaseModel):
    hunt_id: str
    hunt_name: str
    access_code: str
