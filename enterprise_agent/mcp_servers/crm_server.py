"""
NEXUS AI — Customer Intelligence & CRM MCP Server
"""

import sys
import json
import time

CUSTOMER_DATABASE = {
    "CUST-98421": {
        "customer_id": "CUST-98421",
        "name": "Uma Nagal",
        "email": "uma.nagal@nexus.ai",
        "tier": "VIP Gold",
        "account_status": "Active",
        "ltv_usd": 12450.00,
        "sentiment_score": 0.88,
        "recent_orders": ["ORDER-98421", "ORDER-97104"]
    },
    "CUST-DEMO-001": {
        "customer_id": "CUST-DEMO-001",
        "name": "Uma Nagal",
        "email": "uma.nagal@nexus.ai",
        "tier": "Enterprise Tier 1",
        "account_status": "Active",
        "ltv_usd": 28900.00,
        "sentiment_score": 0.94,
        "recent_orders": ["ORDER-98421"]
    }
}

def get_customer_profile(customer_id: str) -> dict:
    return CUSTOMER_DATABASE.get(
        customer_id,
        {
            "customer_id": customer_id,
            "name": "Standard Customer",
            "tier": "Standard",
            "account_status": "Active",
            "ltv_usd": 150.00,
            "sentiment_score": 0.50,
            "recent_orders": []
        }
    )

def main():
    print("┌─────────────────────────────────────────────────────────────┐", file=sys.stderr)
    print("│  NEXUS AI — CRM & Customer Intel MCP Server v2.0            │", file=sys.stderr)
    print("│  Status: OPERATIONAL · Listening for Tool Calls             │", file=sys.stderr)
    print("└─────────────────────────────────────────────────────────────┘", file=sys.stderr)

    if len(sys.argv) > 1:
        cid = sys.argv[1]
        print(json.dumps(get_customer_profile(cid), indent=2))
        return

    # Serve loop / standby signal
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
            data = json.loads(line)
            cid = data.get("customer_id", "CUST-98421")
            res = get_customer_profile(cid)
            print(json.dumps(res), flush=True)
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(json.dumps({"error": str(e)}), flush=True)

if __name__ == "__main__":
    main()
