from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def home_root():
    return {"message": "Sucess"}
@app.get("/deploy")
async def home_root():
    return {"message": "FastAPI deployed on Vercel"}
