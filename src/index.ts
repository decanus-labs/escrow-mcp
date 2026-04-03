#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import {
  createEscrow,
  acceptEscrow,
  deliverWork,
  completeEscrow,
  disputeEscrow,
  refundExpiredEscrow,
  getEscrow,
  listEscrows,
} from './services/escrow.js';
import { CONTRACT_ADDRESS, account } from './config.js';

const server = new McpServer({
  name: 'mcp-escrow-server',
  version: '0.1.0',
});

// ── create_escrow ─────────────────────────────────────────────────────────────

server.tool(
  'create_escrow',
  'Create a new escrow as buyer. Deposits ETH and sets seller, arbiter, and deadline.',
  {
    seller: z.string().describe('Ethereum address of the seller'),
    arbiter: z.string().describe('Ethereum address of the arbiter (dispute resolver)'),
    paymentAmountEth: z.string().describe('Payment in ETH, e.g. "0.01"'),
    durationSeconds: z.number().int().positive().describe('Deadline duration in seconds from now'),
  },
  async (args) => {
    try {
      const result = await createEscrow(args);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (e: unknown) {
      return { content: [{ type: 'text', text: `Error: ${(e as Error).message}` }], isError: true };
    }
  }
);

// ── accept_escrow ─────────────────────────────────────────────────────────────

server.tool(
  'accept_escrow',
  'Accept an escrow as seller. Deposits stake >= payment amount.',
  {
    escrowId: z.number().int().min(0).describe('Escrow ID to accept'),
    stakeAmountEth: z.string().describe('Stake in ETH, must be >= escrow paymentAmount'),
  },
  async (args) => {
    try {
      const result = await acceptEscrow(args);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (e: unknown) {
      return { content: [{ type: 'text', text: `Error: ${(e as Error).message}` }], isError: true };
    }
  }
);

// ── deliver_work ──────────────────────────────────────────────────────────────

server.tool(
  'deliver_work',
  'Mark work as delivered with a proof hash. Starts 24h buyer review window.',
  {
    escrowId: z.number().int().min(0).describe('Escrow ID'),
    deliveryHash: z
      .string()
      .describe('Delivery proof: bytes32 hex (0x...) or plain string (will be keccak256-hashed)'),
  },
  async (args) => {
    try {
      const result = await deliverWork(args);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (e: unknown) {
      return { content: [{ type: 'text', text: `Error: ${(e as Error).message}` }], isError: true };
    }
  }
);

// ── complete_escrow ───────────────────────────────────────────────────────────

server.tool(
  'complete_escrow',
  'Buyer approves delivery. Releases payment + seller stake to seller.',
  {
    escrowId: z.number().int().min(0).describe('Escrow ID to complete'),
  },
  async (args) => {
    try {
      const result = await completeEscrow(args);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (e: unknown) {
      return { content: [{ type: 'text', text: `Error: ${(e as Error).message}` }], isError: true };
    }
  }
);

// ── dispute_escrow ────────────────────────────────────────────────────────────

server.tool(
  'dispute_escrow',
  'Raise a dispute on a FUNDED or DELIVERED escrow. Either buyer or seller can call this.',
  {
    escrowId: z.number().int().min(0).describe('Escrow ID to dispute'),
    reason: z.string().optional().describe('Human-readable dispute reason (stored off-chain)'),
  },
  async (args) => {
    try {
      const result = await disputeEscrow(args);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (e: unknown) {
      return { content: [{ type: 'text', text: `Error: ${(e as Error).message}` }], isError: true };
    }
  }
);

// ── refund_expired_escrow ─────────────────────────────────────────────────────

server.tool(
  'refund_expired_escrow',
  'Trigger refund on an expired FUNDED escrow. Buyer gets payment back. Seller stake is burned. Anyone can call.',
  {
    escrowId: z.number().int().min(0).describe('Escrow ID to refund'),
  },
  async (args) => {
    try {
      const result = await refundExpiredEscrow(args);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (e: unknown) {
      return { content: [{ type: 'text', text: `Error: ${(e as Error).message}` }], isError: true };
    }
  }
);

// ── get_escrow ────────────────────────────────────────────────────────────────

server.tool(
  'get_escrow',
  'Get current state of an escrow by ID. Read-only.',
  {
    escrowId: z.number().int().min(0).describe('Escrow ID to inspect'),
  },
  async (args) => {
    try {
      const result = await getEscrow(args);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (e: unknown) {
      return { content: [{ type: 'text', text: `Error: ${(e as Error).message}` }], isError: true };
    }
  }
);

// ── list_escrows ──────────────────────────────────────────────────────────────

server.tool(
  'list_escrows',
  'List recent escrows. Paginated scan with optional state and participant filters.',
  {
    limit: z.number().int().min(1).max(50).optional().describe('Max results (default 10, max 50)'),
    state: z
      .enum(['AWAITING_SELLER', 'FUNDED', 'DELIVERED', 'COMPLETED', 'DISPUTED', 'REFUNDED', 'BURNED'])
      .optional()
      .describe('Filter by escrow state'),
    participant: z.string().optional().describe('Filter by address (buyer, seller, or arbiter)'),
  },
  async (args) => {
    try {
      const result = await listEscrows(args);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (e: unknown) {
      return { content: [{ type: 'text', text: `Error: ${(e as Error).message}` }], isError: true };
    }
  }
);

// ── start ─────────────────────────────────────────────────────────────────────

process.stderr.write(`[mcp-escrow] Starting. Contract: ${CONTRACT_ADDRESS} | Wallet: ${account.address}\n`);

const transport = new StdioServerTransport();
await server.connect(transport);

process.stderr.write('[mcp-escrow] Ready. Listening on stdio.\n');
