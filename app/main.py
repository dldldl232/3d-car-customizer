from fastapi import FastAPI

app = FastAPI(title="Simple Backend API", version = "0.1.0")

@app.get("/")
async def root():
    return {"message": "FastAPI is running"}