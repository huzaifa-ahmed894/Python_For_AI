from fastapi import APIRouter
from .schema import chat_payload

aiagent_router = APIRouter(prefix="/ai")

@aiagent_router.post("/chat")
def initiate_chat(query: chat_payload):

    print(query.model_dump())
    return query

@aiagent_router.get("/history")
def get_history(session_id: str):
    print("Session ID has been recieved")

    # TODO
    # define service/
    
    return f"Here is the chat for {session_id} Session ID"