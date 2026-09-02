"""
Triage Agent — Intent Classification & Priority Scoring.

Analyses the raw customer message and classifies:
  - Intent (billing dispute, refund request, technical issue, etc.)
  - Priority (critical / high / medium / low)
  - Routing decision (which specialist agents should follow)

Uses a two-tier approach:
  1. Rule-based fast-path classifier (keyword/pattern matching)
  2. LLM-based structured output classification for ambiguous cases
"""

from __future__ import annotations

import re
import time
import uuid
import json
import logging
from typing import Any, Dict, List

from enterprise_agent.agents.state import (
    AgentState, TicketIntent, TicketPriority, RiskLevel,
    WorkflowStep, log_agent_step
)
from enterprise_agent.config import get_config

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Keyword rule tables for fast-path classification
# ---------------------------------------------------------------------------

INTENT_RULES: Dict[TicketIntent, List[str]] = {
    TicketIntent.DUPLICATE_CHARGE: [
        "charged twice", "double charged", "duplicate charge",
        "billed twice", "charged two times", "two charges",
    ],
    TicketIntent.REFUND_REQUEST: [
        "refund", "money back", "reimburse", "reimbursement",
        "get my money", "return payment",
    ],
    TicketIntent.BILLING_DISPUTE: [
        "wrong amount", "incorrect charge", "overcharged", "billing error",
        "billing issue", "dispute", "unauthorized charge",
    ],
    TicketIntent.PAYMENT_FAILURE: [
        "payment failed", "payment declined", "card declined",
        "transaction failed", "payment not processed", "declined",
    ],
    TicketIntent.ORDER_ISSUE: [
        "order", "shipment", "delivery", "package", "item missing",
        "wrong item", "damaged", "not received",
    ],
    TicketIntent.TECHNICAL_ISSUE: [
        "error", "bug", "not working", "broken", "crash", "500",
        "loading", "slow", "cant access", "cannot access",
    ],
    TicketIntent.ACCOUNT_MANAGEMENT: [
        "password", "login", "account", "profile", "update email",
        "change details", "suspend", "cancel account", "upgrade", "plan",
    ],
    TicketIntent.GENERAL_INQUIRY: [
        "question", "how do i", "how to", "what is", "explain",
        "help me understand", "policy",
    ],
}

PRIORITY_RULES: Dict[TicketPriority, List[str]] = {
    TicketPriority.CRITICAL: [
        "urgent", "emergency", "immediately", "asap", "critical",
        "legal action", "lawyer", "court",
    ],
    TicketPriority.HIGH: [
        "charged twice", "duplicate", "fraud", "unauthorized",
        "high priority", "important", "escalate",
    ],
    TicketPriority.LOW: [
        "whenever", "no rush", "just wondering", "curious",
        "low priority",
    ],
}

ROUTING_RULES: Dict[TicketIntent, List[str]] = {
    TicketIntent.DUPLICATE_CHARGE: [
        "customer_agent", "investigation_agent", "rag_agent", "resolution_agent"
    ],
    TicketIntent.REFUND_REQUEST: [
        "customer_agent", "investigation_agent", "rag_agent", "resolution_agent"
    ],
    TicketIntent.BILLING_DISPUTE: [
        "customer_agent", "investigation_agent", "rag_agent", "resolution_agent"
    ],
    TicketIntent.PAYMENT_FAILURE: [
        "customer_agent", "investigation_agent", "resolution_agent"
    ],
    TicketIntent.ORDER_ISSUE: [
        "customer_agent", "investigation_agent", "rag_agent", "resolution_agent"
    ],
    TicketIntent.TECHNICAL_ISSUE: [
        "customer_agent", "rag_agent", "resolution_agent"
    ],
    TicketIntent.ACCOUNT_MANAGEMENT: [
        "customer_agent", "rag_agent", "resolution_agent"
    ],
    TicketIntent.GENERAL_INQUIRY: [
        "rag_agent", "resolution_agent"
    ],
    TicketIntent.UNKNOWN: [
        "customer_agent", "rag_agent", "resolution_agent"
    ],
}


# ---------------------------------------------------------------------------
# Fast-path rule-based classifier
# ---------------------------------------------------------------------------

def _rule_classify_intent(message: str) -> tuple[TicketIntent, float]:
    """Keyword-pattern intent classification. Returns (intent, confidence)."""
    msg = message.lower()
    scores: Dict[TicketIntent, int] = {}
    for intent, keywords in INTENT_RULES.items():
        score = sum(1 for kw in keywords if kw in msg)
        if score > 0:
            scores[intent] = score

    if not scores:
        return TicketIntent.UNKNOWN, 0.3

    best_intent = max(scores, key=lambda k: scores[k])
    total = sum(scores.values())
    confidence = min(scores[best_intent] / max(total, 1), 1.0)
    return best_intent, round(confidence, 2)


def _rule_classify_priority(
    message: str, intent: TicketIntent
) -> TicketPriority:
    """Keyword-pattern priority classification."""
    msg = message.lower()
    for priority, keywords in PRIORITY_RULES.items():
        if any(kw in msg for kw in keywords):
            return priority

    # Default priority based on intent
    high_priority_intents = {
        TicketIntent.DUPLICATE_CHARGE,
        TicketIntent.BILLING_DISPUTE,
        TicketIntent.PAYMENT_FAILURE,
        TicketIntent.TECHNICAL_ISSUE,
    }
    low_priority_intents = {
        TicketIntent.ACCOUNT_MANAGEMENT,
        TicketIntent.GENERAL_INQUIRY,
    }
    if intent in high_priority_intents:
        return TicketPriority.HIGH
    if intent in low_priority_intents:
        return TicketPriority.LOW
    return TicketPriority.MEDIUM


# ---------------------------------------------------------------------------
# LLM-backed classification (used when confidence is low)
# ---------------------------------------------------------------------------

def _llm_classify(message: str, config: Any) -> Dict[str, Any]:
    """
    Call the LLM to classify intent and priority with structured output.
    Falls back gracefully if the LLM call fails.
    """
    try:
        import google.generativeai as genai

        genai.configure(api_key=config.llm.gemini_api_key)
        model = genai.GenerativeModel(config.llm.gemini_model)

        prompt = f"""You are a customer service triage agent. Classify the following customer message.

Customer message: "{message}"

Respond ONLY with a valid JSON object in this exact format:
{{
  "intent": "<one of: billing_dispute|refund_request|technical_issue|account_management|general_inquiry|order_issue|duplicate_charge|payment_failure|unknown>",
  "priority": "<one of: critical|high|medium|low>",
  "confidence": <float between 0 and 1>,
  "triage_summary": "<one sentence summary of the issue>",
  "key_entities": ["<entity1>", "<entity2>"]
}}"""

        response = model.generate_content(prompt)
        text = response.text.strip()
        # Strip markdown code blocks if present
        text = re.sub(r"```(?:json)?", "", text).strip()
        return json.loads(text)
    except Exception as e:
        logger.warning(f"LLM classification failed: {e}. Using rule-based fallback.")
        return {}


# ---------------------------------------------------------------------------
# Triage Agent Node
# ---------------------------------------------------------------------------

def triage_agent(state: AgentState) -> AgentState:
    """
    LangGraph node: Triage Agent.

    Classifies customer message intent and priority, generates a ticket ID,
    and determines the routing path for subsequent agents.
    """
    start_time = time.time()
    config = get_config()
    message = state.get("raw_customer_message", "")
    logger.info(f"[TriageAgent] Processing message: {message[:100]}...")

    # --- Step 1: Fast-path rule classification ---
    intent, confidence = _rule_classify_intent(message)
    priority = _rule_classify_priority(message, intent)
    triage_summary = f"Customer inquiry classified as '{intent.value}' with {priority.value} priority."
    key_entities: List[str] = []

    # --- Step 2: LLM enhancement if confidence is low ---
    if confidence < 0.6:
        logger.info("[TriageAgent] Low confidence — escalating to LLM classifier.")
        llm_result = _llm_classify(message, config)
        if llm_result:
            intent = TicketIntent(llm_result.get("intent", intent.value))
            priority = TicketPriority(llm_result.get("priority", priority.value))
            confidence = float(llm_result.get("confidence", confidence))
            triage_summary = llm_result.get("triage_summary", triage_summary)
            key_entities = llm_result.get("key_entities", [])

    # --- Step 3: Generate ticket ID ---
    ticket_id = f"TKT-{uuid.uuid4().hex[:8].upper()}"

    # --- Step 4: Determine routing ---
    next_agents = ROUTING_RULES.get(intent, ROUTING_RULES[TicketIntent.UNKNOWN])

    duration_ms = (time.time() - start_time) * 1000

    execution_log = log_agent_step(
        state=state,
        agent="triage_agent",
        step="classify_and_route",
        input_summary=f"Message: '{message[:80]}...'",
        output_summary=(
            f"Intent={intent.value}, Priority={priority.value}, "
            f"Confidence={confidence:.2f}, Ticket={ticket_id}"
        ),
        duration_ms=duration_ms,
        tokens_used=0,
    )

    logger.info(
        f"[TriageAgent] ✓ Ticket {ticket_id} | Intent={intent.value} "
        f"| Priority={priority.value} | Confidence={confidence:.2f}"
    )

    return {
        **state,
        "ticket_id": ticket_id,
        "intent": intent,
        "priority": priority,
        "intent_confidence": confidence,
        "triage_summary": triage_summary,
        "routing_decision": " → ".join(next_agents),
        "next_agents": next_agents,
        "completed_agents": state.get("completed_agents", []) + ["triage_agent"],
        "current_step": WorkflowStep.TRIAGE,
        "execution_log": execution_log,
        "updated_at": time.time(),
    }
