"""
NEXUS AI — Multi-Channel Notification & Alerting MCP Server
"""

import sys
import json
import time

def send_notification(channel: str, recipient: str, message: str) -> dict:
    nid = f"NOTIF-{int(time.time())}"
    return {
        "notification_id": nid,
        "channel": channel,
        "recipient": recipient,
        "status": "DELIVERED",
        "timestamp": time.time()
    }

def main():
    print("┌─────────────────────────────────────────────────────────────┐", file=sys.stderr)
    print("│  NEXUS AI — Multi-Channel Notification MCP Server v2.0      │", file=sys.stderr)
    print("│  Status: OPERATIONAL · Listening for Tool Calls             │", file=sys.stderr)
    print("└─────────────────────────────────────────────────────────────┘", file=sys.stderr)

    if len(sys.argv) > 1:
        print(json.dumps(send_notification("email", "uma.nagal@nexus.ai", "Your refund request has been submitted for approval."), indent=2))
        return

    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
            data = json.loads(line)
            res = send_notification(
                data.get("channel", "email"),
                data.get("recipient", "uma.nagal@nexus.ai"),
                data.get("message", "NEXUS AI Notification")
            )
            print(json.dumps(res), flush=True)
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(json.dumps({"error": str(e)}), flush=True)

if __name__ == "__main__":
    main()
