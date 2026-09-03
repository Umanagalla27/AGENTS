"""
NEXUS AI — Billing & Transaction Audit MCP Server
"""

import sys
import json
import time

TRANSACTION_DATABASE = {
    "CUST-98421": [
        {"transaction_id": "TXN-10084", "order_id": "ORDER-98421", "amount": 99.99, "status": "COMPLETED", "timestamp": "2026-09-01T10:00:00Z"},
        {"transaction_id": "TXN-10085", "order_id": "ORDER-98421", "amount": 99.99, "status": "DUPLICATE_FLAGGED", "timestamp": "2026-09-01T10:00:05Z"}
    ],
    "CUST-DEMO-001": [
        {"transaction_id": "TXN-99412", "order_id": "ORDER-98421", "amount": 99.99, "status": "COMPLETED", "timestamp": "2026-09-01T10:00:00Z"},
        {"transaction_id": "TXN-99413", "order_id": "ORDER-98421", "amount": 99.99, "status": "DUPLICATE_FLAGGED", "timestamp": "2026-09-01T10:00:04Z"}
    ]
}

def query_billing_history(customer_id: str) -> dict:
    txns = TRANSACTION_DATABASE.get(customer_id, [
        {"transaction_id": "TXN-00001", "order_id": "ORDER-001", "amount": 49.99, "status": "COMPLETED", "timestamp": "2026-09-01T12:00:00Z"}
    ])
    has_duplicate = any(t["status"] == "DUPLICATE_FLAGGED" for t in txns)
    return {
        "customer_id": customer_id,
        "total_transactions": len(txns),
        "duplicate_charge_detected": has_duplicate,
        "flagged_amount": 99.99 if has_duplicate else 0.0,
        "transactions": txns
    }

def main():
    print("┌─────────────────────────────────────────────────────────────┐", file=sys.stderr)
    print("│  NEXUS AI — Billing & Transaction Audit MCP Server v2.0    │", file=sys.stderr)
    print("│  Status: OPERATIONAL · Listening for Tool Calls             │", file=sys.stderr)
    print("└─────────────────────────────────────────────────────────────┘", file=sys.stderr)

    if len(sys.argv) > 1:
        cid = sys.argv[1]
        print(json.dumps(query_billing_history(cid), indent=2))
        return

    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
            data = json.loads(line)
            cid = data.get("customer_id", "CUST-98421")
            res = query_billing_history(cid)
            print(json.dumps(res), flush=True)
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(json.dumps({"error": str(e)}), flush=True)

if __name__ == "__main__":
    main()
