from sqlmodel import Field, SQLModel, Relationship
from typing import Optional, List
class Item(SQLModel, table=True):
    id: int = Field(primary_key=True)
    name: str
    price: float
    on_offer: bool = False

class User(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str

class CarModelPartLink(SQLModel, table=True):
    car_model_id: int = Field(foreign_key="carmodel.id", primary_key=True)
    part_id: int = Field(foreign_key="part.id", primary_key=True)


class CarModel(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    name: str
    manufacturer: str
    year: int
    gltf_url: str="" #url to the 3D model file
    parts: List["Part"] = Relationship(back_populates="car_model", link_model=CarModelPartLink)

class Part(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    name: str
    type: str # e.g. "wheel", "engine"
    price: float
    gltf_url: str=""
    car_model: List[CarModel] = Relationship(back_populates="parts", link_model=CarModelPartLink)

# part-to-part compatibility
class PartCompatibility(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    part_id: int = Field(foreign_key="part.id")
    compatible_with_part_id: int = Field(foreign_key="part.id")

Part.car_model = Relationship(back_populates="parts")