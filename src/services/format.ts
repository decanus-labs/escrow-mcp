import { formatEther } from 'viem';
import { CONTRACT_ADDRESS, EXPLORER_BASE } from '../config.js';
export { formatEther };

export const STATE_LABELS: Record<number, string> = {
  0: 'AWAITING_SELLER',
  1: 'FUNDED',
  2: 'DELIVERED',
  3: 'COMPLETED',
  4: 'DISPUTED',
  5: 'REFUNDED',
  6: 'BURNED',
};

export const STATE_DESCRIPTIONS: Record<number, string> = {
  0: 'Escrow created. Awaiting seller to accept and deposit stake.',
  1: 'Both parties have deposited. Awaiting seller delivery or deadline.',
  2: 'Seller has marked delivery. Buyer has 24h to approve or dispute.',
  3: 'Completed. Funds released to seller.',
  4: 'Disputed. Awaiting arbiter resolution.',
  5: 'Refunded by arbiter decision.',
  6: 'Expired. Buyer refunded. Seller stake burned.',
};

export const NEXT_ACTIONS: Record<number, string[]> = {
  0: ['accept_escrow'],
  1: ['deliver_work', 'dispute_escrow', 'complete_escrow', 'refund_expired_escrow (after deadline)'],
  2: ['complete_escrow', 'dispute_escrow', 'claim_after_delivery (seller, after 24h grace)'],
  3: [],
  4: ['resolve_dispute (arbiter only)'],
  5: [],
  6: [],
};

export function txUrl(hash: string): string {
  return `${EXPLORER_BASE}/tx/${hash}`;
}

export function addrUrl(addr: string): string {
  return `${EXPLORER_BASE}/address/${addr}`;
}

export function isoTime(unixSeconds: bigint): string | null {
  if (unixSeconds === 0n) return null;
  return new Date(Number(unixSeconds) * 1000).toISOString();
}

export function relativeTime(unixSeconds: bigint): string | null {
  if (unixSeconds === 0n) return null;
  const diff = Number(unixSeconds) * 1000 - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.floor(abs / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  const label =
    days > 0 ? `${days}d ${hrs % 24}h` : hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m`;
  return diff > 0 ? `in ${label}` : `${label} ago`;
}

export function formatEscrow(id: number | bigint, raw: {
  buyer: string;
  seller: string;
  arbiter: string;
  paymentAmount: bigint;
  sellerStake: bigint;
  deadline: bigint;
  deliveryTime: bigint;
  deliveryHash: string;
  state: number;
}) {
  const stateNum = raw.state;
  const gracePeriodSecs = 86400n;
  const gracePeriodEnds =
    raw.deliveryTime > 0n ? raw.deliveryTime + gracePeriodSecs : null;

  return {
    escrowId: Number(id),
    state: STATE_LABELS[stateNum] ?? 'UNKNOWN',
    stateDescription: STATE_DESCRIPTIONS[stateNum] ?? '',
    buyer: raw.buyer,
    seller: raw.seller,
    arbiter: raw.arbiter,
    paymentAmountEth: formatEther(raw.paymentAmount),
    sellerStakeEth: formatEther(raw.sellerStake),
    deadline: isoTime(raw.deadline),
    deadlineRelative: relativeTime(raw.deadline),
    deliveryHash: raw.deliveryHash,
    gracePeriodEnds: gracePeriodEnds ? isoTime(gracePeriodEnds) : null,
    chain: 'base-sepolia',
    contractAddress: CONTRACT_ADDRESS,
    nextActions: NEXT_ACTIONS[stateNum] ?? [],
  };
}
