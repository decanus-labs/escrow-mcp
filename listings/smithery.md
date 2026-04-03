# Smithery Listing: @decanus-labs/escrow-mcp

## Server Name
escrow-mcp

## Display Name
Escrow MCP Server

## Description (short)
Onchain dual-deposit escrow for agent-to-agent task settlement on Base L2.

## Description (long)

Escrow MCP is the first MCP server purpose-built for bilateral agent commerce. It wraps a dual-deposit escrow smart contract on Base L2, exposing 8 tools that let any MCP client create, fund, deliver, dispute, and settle onchain escrows.

**The problem:** Agents proliferating across frameworks (Claude, Codex, Gemini, OpenClaw) cannot transact with each other. They can't pay for completed work, escrow funds conditionally, or dispute bad delivery. The entire agent economy runs on human payment rails.

**The solution:** Permissionless onchain escrow via MCP. Both parties deposit -- the buyer deposits payment, the seller deposits a matching stake. This creates Mutually Assured Destruction (MAD) incentives: if the seller doesn't deliver, their stake is burned. If the buyer doesn't approve valid delivery, the seller auto-claims after a 24-hour grace period.

### Architecture

```
MCP Client (any) → stdio → Escrow MCP Server → viem → Base Sepolia L2
                                                         ↓
                                                  DualDepositEscrow v2
                                                  0xEB979aDC63ef...
```

### Tools

**Write tools:**
- `create_escrow` -- Buyer creates escrow with payment deposit
- `accept_escrow` -- Seller accepts with matching stake
- `deliver_work` -- Seller submits delivery proof (IPFS CID, commit hash, etc.)
- `complete_escrow` -- Buyer approves, funds released to seller
- `dispute_escrow` -- Either party disputes with human-readable reason
- `refund_expired_escrow` -- Anyone triggers after deadline expiry

**Read tools:**
- `get_escrow` -- Full state with human-readable labels, deadlines, and next valid actions
- `list_escrows` -- Paginated scan with state and participant filters

### Response design

Every tool response includes:
- Current state in plain English (not raw enum values)
- Suggested next actions based on current state and caller role
- Transaction hash and block explorer link for all writes
- Deadline as both ISO timestamp and relative human time ("in 23h", "2h ago")

### Configuration

| Env Var | Required | Default |
|---------|----------|---------|
| `PRIVATE_KEY` | Yes | -- |
| `RPC_URL` | No | `https://sepolia.base.org` |
| `CONTRACT_ADDRESS` | No | v2 deployment |

### Install

```bash
npx @decanus-labs/escrow-mcp
```

### Client config

```json
{
  "mcpServers": {
    "escrow": {
      "command": "npx",
      "args": ["-y", "@decanus-labs/escrow-mcp"],
      "env": {
        "PRIVATE_KEY": "0x..."
      }
    }
  }
}
```

## Category
Finance

## Tags
escrow, blockchain, base, ethereum, payments, defi, agent-commerce

## npm Package
@decanus-labs/escrow-mcp

## Repository
https://github.com/decanus-labs/escrow-mcp

## License
MIT

## Transport
stdio

## Verified
Tested end-to-end on Base Sepolia with live transactions across all 8 tools. Full escrow lifecycle (create → accept → deliver → complete), dispute path, and expired-refund/burn path all verified.
