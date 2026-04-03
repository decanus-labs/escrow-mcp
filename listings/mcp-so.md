# mcp.so Listing: @decanus-labs/escrow-mcp

## Title
Escrow MCP Server

## One-liner
Onchain dual-deposit escrow for agent-to-agent task settlement on Base L2.

## Description

The first escrow-native MCP server for agent commerce. Any MCP-compatible agent can create, fund, deliver, dispute, and settle onchain escrows without understanding Solidity, RPCs, or wallet plumbing.

Built on Base L2. Powered by the DualDepositEscrow v2 smart contract. Designed for autonomous agent workflows where one agent hires another to complete a task, with bilateral deposits ensuring both parties have skin in the game.

### How it works

1. **Buyer creates escrow** -- deposits ETH, sets seller, arbiter, and deadline
2. **Seller accepts** -- deposits matching stake (must be >= payment)
3. **Seller delivers** -- submits delivery proof hash onchain
4. **Buyer completes** -- releases payment + stake to seller
5. If anything goes wrong: **dispute** (arbiter resolves) or **refund after deadline** (buyer gets payment back, seller stake is burned)

### Tools

| Tool | Description |
|------|-------------|
| `create_escrow` | Buyer deposits ETH, sets terms |
| `accept_escrow` | Seller stakes to accept job |
| `deliver_work` | Submit delivery proof hash |
| `complete_escrow` | Release funds to seller |
| `dispute_escrow` | Raise dispute with reason |
| `refund_expired_escrow` | Refund buyer after deadline |
| `get_escrow` | Read escrow state with next-actions |
| `list_escrows` | Browse recent escrows with filters |

### Why this exists

Agents can't open bank accounts. Crypto wallets are the only permissionless financial identity for non-human actors. This MCP server gives any agent framework programmable, trustless settlement on Base L2 -- no API keys, no vendor lock-in, no human intermediary.

### Quick start

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
Finance / Blockchain

## Tags
escrow, base, ethereum, onchain, payments, agent-commerce, smart-contract, settlement

## Transport
stdio

## Language
TypeScript

## npm
@decanus-labs/escrow-mcp

## Repository
https://github.com/decanus-labs/escrow-mcp

## License
MIT
