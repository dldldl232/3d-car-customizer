from sqlmodel import Field, SQLModel

class Item(SQLModel, table=True):
    id: int = Field(primary_key=True)
    name: str
    price: float
    on_offer: bool = False
