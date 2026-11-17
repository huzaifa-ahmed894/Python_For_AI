"""Supervisor: a manager agent that sends each question to the right worker agent."""
from langgraph.prebuilt import create_react_agent
from langgraph_supervisor import create_supervisor
from modules.ai_agent.graph import create_chat_model
from modules.ai_agent.tools import fetch_menu, validate_order_id, log_complaint, get_discounts


def build_supervisor(llm="groq"):
    model = create_chat_model(llm)

    menu_agent = create_react_agent(
        model=model,
        tools=[fetch_menu],
        name="menu_agent",
        prompt=("You answer menu and price questions. Prices are in PKR. Always use fetch_menu. "
                "Write prices like Rs. 850, never use the peso sign. Format menu choices as a "
                "short Markdown list or table."),
    )
    complaint_agent = create_react_agent(
        model=model,
        tools=[validate_order_id, log_complaint],
        name="complaint_agent",
        prompt=("You handle complaints. Collect customer name, phone, order ID and complaint. "
                "Check the order ID with validate_order_id, then save with log_complaint. "
                "Ask for missing details. Never invent a complaint ID."),
    )
    customer_support_agent = create_react_agent(
        model=model,
        tools=[],
        name="customer_support_agent",
        prompt=("After serving Customer, You have to collect user feedback"),
    )

    offer_agent = create_react_agent(
        model=model,
        tools=[get_discounts],
        name="get_discount_agent",
        prompt=("You answer questions about today's discount. Always call get_discounts "
                "before describing an offer, and format the answer in concise Markdown."),
    )

    supervisor = create_supervisor(
        agents=[menu_agent, complaint_agent, customer_support_agent, offer_agent],
        model=model,
        prompt=("You are the manager of Xander Restaurant support. "
                "Menu or price questions -> menu_agent. Complaints -> complaint_agent. "
                "User feedback -> customer_support_agent. "
                "Discount information -> get_discount_agent. "
                "If asked to place a purchase order, explain that order placement is not available "
                "and offer to help choose items from the menu. Never claim an order was placed. "
                "For greetings, answer yourself in one short line. "
                "Use clean Markdown where it improves readability, including short paragraphs, "
                "bullets for choices or steps, and bold for key prices or details. "
                "After a worker agent answers, write nothing more: repeat the worker's answer exactly."),
    )
    return supervisor.compile()
