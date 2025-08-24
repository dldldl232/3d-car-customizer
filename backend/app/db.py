from sqlmodel import SQLModel, create_engine, Session
from app.models import User # this assumes we have a User model, ask gpt 
from sqlmodel import Session, select


# currently using a local file
DATABASE_URL = "sqlite:///./test.db"

# create the engine
engine = create_engine(DATABASE_URL, echo=True)

def init_db():
    # create the database file & tables
    SQLModel.metadata.create_all(engine)

def get_session():
    # FASTAPI dependency
    with Session(engine) as session:
        yield session

def get_user(email: str, session: Session):
    # session is a instance of Session from SQLModel used to execute the query
    statement = select(User).where(User.email == email)
    result = session.exec(statement)
    return result.first() # returns the first matching user, as username are unique
    
