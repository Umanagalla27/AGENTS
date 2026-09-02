"""
Resolution Agent — Action Synthesis & Risk Classification Engine.

Synthesises all gathered context (customer profile, investigation findings,
policy citations) to:
  1. Determine the optimal resolution action(s)
  2. Assign a risk level to each proposed action
  3. Flag high-risk actions for Human-in-the-Loop approval
  4. Generate a chain-of-thought reasoning trace

Supports both LLM-driven synthesis and rule-based resolution for
high-confidence, low-ambiguity cases.
"""

from __future__ import annotations

import json
import re
import time
import logging
from typing import Any, Dict, List, Optional

from enterprise_agent.agents.state import (
    AgentState, ProposedAction, RiskLevel, ApprovalStatus,
    TicketIntent, TicketPriority, WorkflowStep, TransactionRecord,
    log_agent_step
)
from enterprise_agent.config import get_config, get_risk_config

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Risk Assessment
# ---------------------------------------------------------------------------

def _assess_risk(
    action: ProposedAction,
    customer_profile: Any,
    risk_config: Any,
) -> tuple[RiskLevel, bool]:
    """
    Determine risk level and whether human approval is required.

    Returns (risk_level, requires_approval).
    """
    requires_approval = False

    if action.action_type == "refund":
        amount = action.parameters.get("amount", 0.0)
        if amount >= risk_config.refund_approval_threshold:
            return RiskLevel.HIGH, True
        elif amount >= risk_config.refund_approval_threshold * 0.5:
            return RiskLevel.MEDIUM, False
        return RiskLevel.LOW, False

    if action.action_type in ("account_suspend", "account_modify"):
        return RiskLevel.HIGH, True

    if action.action_type == "credit":
        amount = action.parameters.get("amount", 0.0)
        if amount >= risk_config.refund_approval_threshold:
            return RiskLevel.MEDIUM, False
        return RiskLevel.LOW, False

    return RiskLevel.LOW, False


# ---------------------------------------------------------------------------
# Rule-based resolution engine
# ---------------------------------------------------------------------------

def _rule_based_resolution(state: AgentState) -> List[ProposedAction]:
    """
    Fast-path rule-based resolution for high-confidence scenarios.
    Returns a list of ProposedAction objects.
    """
    intent = state.get("intent", TicketIntent.UNKNOWN)
    transactions: List[TransactionRecord] = state.get("transactions", [])
    anomalies: List[str] = state.get("anomalies_detected", [])
    risk_config = get_risk_config()
    customer_profile = state.get("customer_profile")

    actions: List[ProposedAction] = []

    # Duplicate charge — auto-refund duplicates
    if intent in (TicketIntent.DUPLICATE_CHARGE, TicketIntent.BILLING_DISPUTE):
        duplicates = [t for t in transactions if t.is_duplicate and t.refund_eligible]
        if duplicates:
            total_refund = sum(t.amount for t in duplicates)
            risk_level, req_approval = _assess_risk(
                ProposedAction(action_type="refund", parameters={"amount": total_refund}),
                customer_profile,
                risk_config,
            )
            actions.append(
                ProposedAction(
                    action_type="refund",
                    description=(
                        f"Issue refund of ${total_refund:.2f} for "
                        f"{len(duplicates)} duplicate charge(s)"
                    ),
                    parameters={
                        "amount": total_refund,
                        "transaction_ids": [t.transaction_id for t in duplicates],
                        "reason": "duplicate_charge",
                    },
                    estimated_cost=total_refund,
                    risk_level=risk_level,
                    requires_approval=req_approval,
                )
            )
            # Always notify the customer
            actions.append(
                ProposedAction(
                    action_type="notify",
                    description="Send refund confirmation notification to customer",
                    parameters={"channel": "email", "template": "refund_confirmation"},
                    estimated_cost=0.0,
                    risk_level=RiskLevel.LOW,
                    requires_approval=False,
                )
            )

    elif intent == TicketIntent.REFUND_REQUEST:
        eligible = [t for t in transactions if t.refund_eligible]
        if eligible:
            total_refund = sum(t.amount for t in eligible)
            risk_level, req_approval = _assess_risk(
                ProposedAction(action_type="refund", parameters={"amount": total_refund}),
                customer_profile,
                risk_config,
            )
            actions.append(
                ProposedAction(
                    action_type="refund",
                    description=f"Issue refund of ${total_refund:.2f} per refund policy",
                    parameters={
                        "amount": total_refund,
                        "transaction_ids": [t.transaction_id for t in eligible],
                        "reason": "customer_request",
                    },
                    estimated_cost=total_refund,
                    risk_level=risk_level,
                    requires_approval=req_approval,
                )
            )
        else:
            actions.append(
                ProposedAction(
                    action_type="inform",
                    description="Inform customer of refund policy — no eligible transactions found",
                    parameters={"reason": "no_eligible_transactions"},
                    estimated_cost=0.0,
                    risk_level=RiskLevel.LOW,
                    requires_approval=False,
                )
            )

    elif intent == TicketIntent.PAYMENT_FAILURE:
        actions.append(
            ProposedAction(
                action_type="credit",
                description="Apply 10% service credit per payment failure SLA",
                parameters={"percentage": 10, "reason": "payment_failure_compensation"},
                estimated_cost=0.0,
                risk_level=RiskLevel.LOW,
                requires_approval=False,
            )
        )
        actions.append(
            ProposedAction(
                action_type="inform",
                description="Inform customer of payment failure reason and applied credit",
                parameters={"reason": "payment_failure_explained"},
                estimated_cost=0.0,
                risk_level=RiskLevel.LOW,
                requires_approval=False,
            )
        )

    else:
        # General: inform with policy guidance
        actions.append(
            ProposedAction(
                action_type="inform",
                description="Provide policy-grounded resolution information to customer",
                parameters={"source": "rag_agent"},
                estimated_cost=0.0,
                risk_level=RiskLevel.LOW,
                requires_approval=False,
            )
        )

    return actions


def _llm_synthesise_response(state: AgentState, config: Any) -> str:
    """
    Use LLM to synthesise a final customer-facing response.
    """
    try:
        import google.generativeai as genai

        genai.configure(api_key=config.llm.gemini_api_key)
        model = genai.GenerativeModel(config.llm.gemini_model)

        customer = state.get("customer_profile")
        customer_name = customer.name if customer else "Valued Customer"
        findings = state.get("investigation_findings", "No findings.")
        knowledge = state.get("knowledge_summary", "No policy guidance.")
        actions = state.get("proposed_actions", [])
        intent = state.get("intent", TicketIntent.UNKNOWN)

        action_descriptions = "\n".join(
            f"  - {a.description}" for a in actions
        ) if actions else "  - Provide information"

        prompt = f"""You are a professional customer service representative for an enterprise company.
Draft a concise, empathetic, and professional response to this customer.

Customer Name: {customer_name}
Customer Issue: {state.get('raw_customer_message', '')}
Issue Type: {intent.value.replace('_', ' ').title()}

Investigation Summary:
{findings}

Policy Guidance:
{knowledge}

Proposed Resolution Actions:
{action_descriptions}

Write a professional customer-facing response that:
1. Acknowledges the customer's issue with empathy
2. Explains what you found (without exposing internal system details)
3. Describes what action will be taken
4. Provides a timeline/next steps
5. Closes with a professional sign-off

Keep the response concise (3-5 paragraphs) and warm in tone."""

        response = model.generate_content(prompt)
        return response.text.strip()

    except Exception as e:
        logger.warning(f"[ResolutionAgent] LLM synthesis failed: {e}")
        return _template_response(state)


def _template_response(state: AgentState) -> str:
    """Rule-based template response fallback."""
    customer = state.get("customer_profile")
    name = customer.name if customer else "Valued Customer"
    intent = state.get("intent", TicketIntent.UNKNOWN)
    actions = state.get("proposed_actions", [])

    action_text = ""
    for action in actions:
        if action.action_type == "refund":
            amount = action.parameters.get("amount", 0)
            status = "pending human approval" if action.requires_approval else "being processed"
            action_text = f"We have identified the issue and a refund of ${amount:.2f} is {status}."
        elif action.action_type == "credit":
            action_text = "We have applied a service credit to your account as compensation."
        elif action.action_type == "inform":
            action_text = "We have reviewed your inquiry and can provide the following guidance."

    return f"""Dear {name},

Thank you for contacting our support team. We sincerely apologise for the inconvenience you've experienced.

We have thoroughly reviewed your account and investigated the issue you raised regarding {intent.value.replace('_', ' ')}. {action_text}

You will receive a confirmation email shortly with all the details. If you have any further questions, please don't hesitate to reach out.

Warm regards,
Customer Support Team"""


def resolution_agent(state: AgentState) -> AgentState:
    """
    LangGraph node: Resolution Agent.

    Synthesises the optimal resolution, assesses risk levels, determines
    whether human approval is required, and drafts the customer response.
    """
    start_time = time.time()
    config = get_config()

    logger.info("[ResolutionAgent] Synthesising resolution...")

    # --- Rule-based action determination ---
    proposed_actions = _rule_based_resolution(state)

    # --- Determine overall risk level ---
    if any(a.risk_level == RiskLevel.HIGH for a in proposed_actions):
        overall_risk = RiskLevel.HIGH
    elif any(a.risk_level == RiskLevel.MEDIUM for a in proposed_actions):
        overall_risk = RiskLevel.MEDIUM
    else:
        overall_risk = RiskLevel.LOW

    requires_human_approval = any(a.requires_approval for a in proposed_actions)

    # --- Update state with actions before LLM synthesis ---
    state = {
        **state,
        "proposed_actions": proposed_actions,
        "risk_level": overall_risk,
    }

    # --- LLM response synthesis ---
    final_response = _llm_synthesise_response(state, config)

    # --- Reasoning trace ---
    intent = state.get("intent", TicketIntent.UNKNOWN)
    anomalies = state.get("anomalies_detected", [])
    reasoning = (
        f"Intent={intent.value}, "
        f"Anomalies={len(anomalies)}, "
        f"Actions={[a.action_type for a in proposed_actions]}, "
        f"RiskLevel={overall_risk.value}, "
        f"RequiresApproval={requires_human_approval}"
    )

    # --- Estimated resolution time based on risk ---
    resolution_time_map = {
        RiskLevel.LOW: "1–2 hours",
        RiskLevel.MEDIUM: "24 hours",
        RiskLevel.HIGH: "1–3 business days (pending approval)",
    }
    estimated_time = resolution_time_map[overall_risk]

    approval_status = (
        ApprovalStatus.PENDING if requires_human_approval
        else ApprovalStatus.NOT_REQUIRED
    )

    duration_ms = (time.time() - start_time) * 1000

    execution_log = log_agent_step(
        state=state,
        agent="resolution_agent",
        step="synthesise_resolution",
        input_summary=f"intent={intent.value}, transactions={len(state.get('transactions', []))}",
        output_summary=(
            f"{len(proposed_actions)} action(s), risk={overall_risk.value}, "
            f"approval_needed={requires_human_approval}"
        ),
        duration_ms=duration_ms,
    )

    logger.info(
        f"[ResolutionAgent] ✓ {len(proposed_actions)} action(s), "
        f"risk={overall_risk.value}, approval_needed={requires_human_approval}"
    )

    return {
        **state,
        "proposed_actions": proposed_actions,
        "resolution_reasoning": reasoning,
        "risk_level": overall_risk,
        "estimated_resolution_time": estimated_time,
        "requires_human_approval": requires_human_approval,
        "approval_status": approval_status,
        "final_response": final_response,
        "completed_agents": state.get("completed_agents", []) + ["resolution_agent"],
        "current_step": WorkflowStep.RESOLUTION,
        "execution_log": execution_log,
        "updated_at": time.time(),
    }
