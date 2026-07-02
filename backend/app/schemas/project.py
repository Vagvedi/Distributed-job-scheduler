from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    organization_id: int


class ProjectResponse(BaseModel):
    id: int
    name: str
    organization_id: int

    class Config:
        from_attributes = True