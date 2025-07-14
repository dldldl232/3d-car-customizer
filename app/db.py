from sqlmodel import SQLModel, create_engine, Session

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

