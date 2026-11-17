from fastapi import APIRouter
from .schema import chat_payload
from . import service

ai_agent_router = APIRouter(prefix="/ai")

@ai_agent_router.post("/chat")
def initiate_chat(payload: chat_payload):
    answer = service.chat(payload.query, payload.session_id)
    return {"session_id": payload.session_id, "answer": answer}

@ai_agent_router.get("/history")
def get_history(session_id: str):
    return {"session_id": session_id, "messages": service.get_history(session_id)}

@ai_agent_router.delete("/history/{session_id}")
def delete_history(session_id: str):
    from core.database import sqlite
    sqlite.delete_session(session_id)
    return {"session_id": session_id, "deleted": True}
