from app.db import engine
from app.models import Part, CarModel
from sqlmodel import Session, select

session = Session(engine)

# Check parts
parts = session.exec(select(Part)).all()
print(f"Found {len(parts)} parts:")
for part in parts:
    print(f"- {part.name} (type: {part.type}, attach_to: {part.attach_to})")

# Check car models
car_models = session.exec(select(CarModel)).all()
print(f"\nFound {len(car_models)} car models:")
for car in car_models:
    print(f"- {car.name} (ID: {car.id})") 