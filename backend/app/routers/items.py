from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from app.db import get_session
from app.models import Item

router = APIRouter()

@router.get("/", summary="List all items")
def list_items(session: Session = Depends(get_session)):
    items = session.exec(select(Item)).all()
    return items

@router.get("/{item_id}", summary="Get an item by ID")
def get_item(item_id: int):
    item = session.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

# we are expecting the user or frontend to provide the id
@router.post("/", summary="Create an item")
def create_item(item: Item, session: Session = Depends(get_session)):
    if session.get(Item, item.id):
        raise HTTPException(status_code=400, detail="Item already exists")
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@router.put("/{item_id}", summary="Update an item")
def update_item(item_id: int, item: Item, session: Session = Depends(get_session)):
    db_item = session.get(Item, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")

    db_item.name = item.name
    db_item.price = item.price
    db_item.on_offer = item.on_offer
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item

@router.delete("/{item_id}", summary="Delete an item")
def delete_item(item_id: int):
   item = session.get(Item, item_id)
   if not item:
    raise HTTPException(status_code=404, detail="Item not found")
    
    session.delete(item)
    session.commit()
    return {"message": f"Item {item_id} deleted successfully"}