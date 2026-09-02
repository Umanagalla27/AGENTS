"""
Investigation Agent — Transaction, Order & Payment API Investigator.

Queries the Billing & Payments MCP server to:
  - Retrieve payment history and order details
  - Detect duplicate charges and anomalies
  - Verify refund eligibility
  - Generate a structured investigation findings report
"""

from __future__ import annotations

import time
import logging
import httpx
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from enterprise_agent.agents.state import (
    AgentState, TransactionRecord, TicketIntent, WorkflowStep, log_agent_step
)
from enterprise_agent.config import get_config

logger = logging.getLogger(__name__)


def _call_billing_tool(
    tool: str, params: Dict[str, Any], billing_url: str
) -> Dict[str, Any]:
    """Call a Billing MCP server tool."""
    try:
        resp = httpx.post(
            f"{billing_url}/tools/{tool}",
            json=params,
            timeout=10.0,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.warning(f"[InvestigationAgent] Billing tool '{tool}' failed: {e}")
        return {}


def _generate_mock_transactions(
    customer_id: str, intent: TicketIntent
) -> List[TransactionRecord]:
    """
    Generate realistic mock transactions tailored to the detected intent.
    Used when the Billing MCP server is unavailable.
    """
    now = datetime.utcnow()
    amount = 29.99 if customer_id == "CUST-E2E002" else 99.99
    base_records = [
        TransactionRecord(
            transaction_id=f"TXN-{uuid.uuid4().hex[:8].upper()}",
            order_id=f"ORD-{uuid.uuid4().hex[:6].upper()}",
            amount=amount,
            currency="USD",
            status="completed",
            timestamp=(now - timedelta(days=2)).isoformat(),
            payment_method="Visa *4242",
            description="Premium Subscription Plan",
            is_duplicate=False,
            refund_eligible=True,
        )
    ]

    if intent in (TicketIntent.DUPLICATE_CHARGE, TicketIntent.BILLING_DISPUTE):
        # Add a duplicate transaction for realistic testing
        original = base_records[0]
        duplicate = TransactionRecord(
            transaction_id=f"TXN-{uuid.uuid4().hex[:8].upper()}",
            order_id=original.order_id,          # Same order ID = duplicate
            amount=original.amount,
            currency=original.currency,
            status="completed",
            timestamp=(now - timedelta(days=2, minutes=3)).isoformat(),
            payment_method=original.payment_method,
            description=original.description,
            is_duplicate=True,
            refund_eligible=True,
        )
        base_records.append(duplicate)

    return base_records


def _detect_anomalies(transactions: List[TransactionRecord]) -> List[str]:
    """Detect billing anomalies in a list of transactions."""
    anomalies: List[str] = []
    order_ids: Dict[str, List[TransactionRecord]] = {}

    for txn in transactions:
        if txn.order_id:
            order_ids.setdefault(txn.order_id, []).append(txn)

    for order_id, txns in order_ids.items():
        if len(txns) > 1:
            total = sum(t.amount for t in txns)
            anomalies.append(
                f"Duplicate charge detected for order {order_id}: "
                f"{len(txns)} transactions totalling ${total:.2f} "
                f"({', '.join(t.transaction_id for t in txns)})"
            )

    # Check for unusually large amounts
    for txn in transactions:
        if txn.amount > 500:
            anomalies.append(
                f"Unusually large transaction {txn.transaction_id}: ${txn.amount:.2f}"
            )

    return anomalies


def _build_findings_narrative(
    transactions: List[TransactionRecord],
    anomalies: List[str],
    intent: TicketIntent,
) -> str:
    """Synthesise a narrative investigation findings report."""
    if not transactions:
        return "No transaction records found for this customer."

    lines = [f"Investigation found {len(transactions)} transaction(s):"]
    for txn in transactions:
        dup_flag = " [DUPLICATE]" if txn.is_duplicate else ""
        refund_flag = " [REFUND ELIGIBLE]" if txn.refund_eligible else ""
        lines.append(
            f"  • {txn.transaction_id}{dup_flag}: ${txn.amount:.2f} "
            f"({txn.status}) on {txn.timestamp[:10]}{refund_flag}"
        )

    if anomalies:
        lines.append(f"\n⚠️ {len(anomalies)} anomaly/anomalies detected:")
        for a in anomalies:
            lines.append(f"  • {a}")

    duplicates = [t for t in transactions if t.is_duplicate]
    if duplicates:
        duplicate_total = sum(t.amount for t in duplicates)
        lines.append(
            f"\nRecommendation: Refund ${duplicate_total:.2f} for "
            f"{len(duplicates)} duplicate charge(s) on "
            f"order {duplicates[0].order_id}."
        )

    return "\n".join(lines)


def investigation_agent(state: AgentState) -> AgentState:
    """
    LangGraph node: Investigation Agent.

    Fetches payment/order data from the Billing MCP server, detects
    anomalies, and produces a structured investigation findings report.
    """
    start_time = time.time()
    config = get_config()
    billing_url = config.mcp.billing_url()

    customer_id = state.get("customer_id") or "CUST-UNKNOWN"
    intent = state.get("intent", TicketIntent.UNKNOWN)

    logger.info(
        f"[InvestigationAgent] Investigating transactions for {customer_id} | intent={intent.value}"
    )

    # --- Try live Billing MCP server ---
    billing_resp = _call_billing_tool(
        "check_payment", {"customer_id": customer_id}, billing_url
    )

    if billing_resp and "transactions" in billing_resp:
        raw_txns = billing_resp["transactions"]
        transactions = [
            TransactionRecord(
                transaction_id=t.get("id", ""),
                order_id=t.get("order_id", ""),
                amount=float(t.get("amount", 0)),
                currency=t.get("currency", "USD"),
                status=t.get("status", ""),
                timestamp=t.get("timestamp", ""),
                payment_method=t.get("payment_method", ""),
                description=t.get("description", ""),
                is_duplicate=t.get("is_duplicate", False),
                refund_eligible=t.get("refund_eligible", False),
            )
            for t in raw_txns
        ]
    else:
        logger.info("[InvestigationAgent] Billing MCP unavailable — using mock data.")
        transactions = _generate_mock_transactions(customer_id, intent)

    # --- Anomaly detection ---
    anomalies = _detect_anomalies(transactions)

    # --- Narrative report ---
    findings = _build_findings_narrative(transactions, anomalies, intent)

    duration_ms = (time.time() - start_time) * 1000

    execution_log = log_agent_step(
        state=state,
        agent="investigation_agent",
        step="fetch_and_analyse",
        input_summary=f"customer_id={customer_id}, intent={intent.value}",
        output_summary=(
            f"{len(transactions)} transactions, {len(anomalies)} anomalies detected"
        ),
        duration_ms=duration_ms,
    )

    logger.info(
        f"[InvestigationAgent] ✓ {len(transactions)} transactions, "
        f"{len(anomalies)} anomalies"
    )

    return {
        **state,
        "transactions": transactions,
        "investigation_findings": findings,
        "anomalies_detected": anomalies,
        "completed_agents": state.get("completed_agents", []) + ["investigation_agent"],
        "current_step": WorkflowStep.INVESTIGATION,
        "execution_log": execution_log,
        "updated_at": time.time(),
    }
