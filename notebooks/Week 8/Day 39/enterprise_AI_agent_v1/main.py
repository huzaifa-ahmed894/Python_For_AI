from fastapi import FastAPI
# from pydantic import BaseModel
from modules.aiagent.router import aiagent_router

app = FastAPI()

app.include_router(
    aiagent_router
)

@app.get("/", status_code=200)
async def root():
    return {"message": "You are at the Eatry's backend"}












# class chat_payload(BaseModel):
#     query: str
# @app.get("/name")
# async def get_name():
#     return {'name': 'Huzaifa Ahmed'}

# @app.post("/chat")
# def initiate_chat(query: chat_payload):

#     print(query.model_dump())
#     return query
    # {
    #     "message": f"Your {query} query is processing"
    # }