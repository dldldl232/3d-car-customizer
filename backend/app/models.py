from sqlmodel import Field, SQLModel, Relationship
from typing import Optional, List
from datetime import datetime
import uuid

class Item(SQLModel, table=True):
    id: int = Field(primary_key=True)
    name: str
    price: float
    on_offer: bool = False

class User(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    email: str
    password: str
    first_name: str
    last_name: str

class CarModelPartLink(SQLModel, table=True):
    car_model_id: int = Field(foreign_key="carmodel.id", primary_key=True)
    part_id: int = Field(foreign_key="part.id", primary_key=True)

class CarModel(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    name: str
    manufacturer: str
    year: int
    glb_url: str = ""  # Object storage URL for optimized GLB
    thumbnail_url: str = ""  # Object storage URL for thumbnail
    license_slug: str = ""  # e.g., "CC-BY-4.0", "CC-BY-NC-4.0"
    license_url: str = ""
    attribution_html: str = ""  # Required attribution text
    source_url: str = ""  # Original Sketchfab URL
    uploader: str = ""  # Original creator name
    source_uid: str = ""  # Sketchfab model UID
    bounds: str = ""  # JSON string of bounding box
    scale_factor: float = 1.0  # Scale factor for normalization
    unit_scale: float = 1.0  # meters per unit
    default_up_axis: str = "Y"  # up axis of the model
    anchors_ready: bool = False  # whether anchors have been set up
    parts: List["Part"] = Relationship(back_populates="car_model", link_model=CarModelPartLink)

class Anchor(SQLModel, table=True):
    """Car-specific anchor nodes for part attachment"""
    id: int = Field(default=None, primary_key=True)
    car_model_id: int = Field(foreign_key="carmodel.id")
    name: str  # e.g., "wheel_FL_anchor", "spoiler_anchor"
    type: str  # e.g., "wheel", "spoiler", "headlight"
    pos_x: float = 0.0
    pos_y: float = 0.0
    pos_z: float = 0.0
    rot_x: float = 0.0
    rot_y: float = 0.0
    rot_z: float = 0.0
    scale_x: float = 1.0
    scale_y: float = 1.0
    scale_z: float = 1.0
    anchor_metadata: str = ""  # JSON string for extras like radius, axis, symmetry pair
    symmetry_pair_id: Optional[int] = None  # ID of symmetric anchor (e.g., FL <-> FR)
    expected_diameter: Optional[float] = None  # for wheels, expected wheel diameter
    bounds: str = ""  # JSON string of anchor bounds

class Fitment(SQLModel, table=True):
    """User and community fitment overrides for part placement"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    car_model_id: int = Field(foreign_key="carmodel.id")
    part_id: int = Field(foreign_key="part.id")
    anchor_id: int = Field(foreign_key="anchor.id")
    part_variant_hash: str = ""  # hash of part GLB + material/size
    transform_override: str = ""  # JSON string of position/rotation/scale override
    quality_score: float = 0.5  # 0-1 score from moderation/usage
    scope: str = "user"  # "user", "org", "global"
    created_by_user_id: Optional[int] = Field(foreign_key="user.id", default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    version: int = 1  # for versioning and rollbacks

# part-to-part compatibility
class PartCompatibility(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    part_id: int = Field(foreign_key="part.id")
    compatible_with_part_id: int = Field(foreign_key="part.id")

class SavedCarPartLink(SQLModel, table=True):
    saved_car_id: int = Field(foreign_key="savedcar.id", primary_key=True)
    part_id: int = Field(foreign_key="part.id", primary_key=True)

class SavedCar(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    car_model_id: int = Field(foreign_key="carmodel.id")
    name: str = ""
    parts: List["Part"] = Relationship(back_populates="saved_cars", link_model=SavedCarPartLink)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Part(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    name: str
    type: str  # e.g. "wheel", "engine", "exterior"
    category: str = ""  # e.g., "wheel", "wing", "hood", "headlight"
    price: float
    glb_url: str = ""  # Object storage URL for part GLB
    thumbnail_url: str = ""  # Object storage URL for part thumbnail
    license_slug: str = ""
    license_url: str = ""
    attribution_html: str = ""
    source_url: str = ""
    uploader: str = ""
    source_uid: str = ""
    intrinsic_size: str = ""  # JSON string for auto-scaling (e.g., wheel radius)
    nominal_size: float = 0.0  # nominal size in mm
    pivot_hint: str = "center"  # e.g., "center", "bottom-center", "hub-center"
    symmetry: str = ""  # "L", "R", "LR", "" (for symmetric parts)
    bounding_box: str = ""  # JSON string of part bounding box
    attach_to: str = ""  # e.g. "wheel_FL_anchor", "spoiler_anchor"
    pos_x: float = 0.0
    pos_y: float = 0.0
    pos_z: float = 0.0
    rot_x: float = 0.0
    rot_y: float = 0.0
    rot_z: float = 0.0
    scale_x: float = 1.0
    scale_y: float = 1.0
    scale_z: float = 1.0
    car_model: List[CarModel] = Relationship(back_populates="parts", link_model=CarModelPartLink)
    saved_cars: List["SavedCar"] = Relationship(back_populates="parts", link_model=SavedCarPartLink)

Part.car_model = Relationship(back_populates="parts")