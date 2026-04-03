import { parseEther, formatEther, isAddress, keccak256, toBytes } from 'viem';
import { publicClient, walletClient } from '../chains/baseSepolia.js';
import { CONTRACT_ADDRESS, account } from '../config.js';
import { DUAL_DEPOSIT_ESCROW_ABI } from '../abi.js';
import { formatEscrow, txUrl, STATE_LABELS } from './format.js';

// ── helpers ──────────────────────────────────────────────────────────────────

async function waitForReceipt(hash: `0x${string}`) {
  return publicClient.waitForTransactionReceipt({ hash, timeout: 60_000, confirmations: 1 });
}

function assertAddress(val: string, name: string): `0x${string}` {
  if (!isAddress(val)) throw new Error(`${name} is not a valid Ethereum address: ${val}`);
  return val as `0x${string}`;
}

async function getRawEscrow(escrowId: bigint) {
  const result = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: DUAL_DEPOSIT_ESCROW_ABI,
    functionName: 'escrows',
    args: [escrowId],
  });
  // viem returns a tuple array for multi-return view functions
  const [buyer, seller, arbiter, paymentAmount, sellerStake, deadline, deliveryTime, deliveryHash, state] = result as [
    `0x${string}`, `0x${string}`, `0x${string}`,
    bigint, bigint, bigint, bigint,
    `0x${string}`, number
  ];
  return { buyer, seller, arbiter, paymentAmount, sellerStake, deadline, deliveryTime, deliveryHash, state };
}

// ── tools ─────────────────────────────────────────────────────────────────────

export async function createEscrow(args: {
  seller: string;
  arbiter: string;
  paymentAmountEth: string;
  durationSeconds: number;
}) {
  const seller = assertAddress(args.seller, 'seller');
  const arbiter = assertAddress(args.arbiter, 'arbiter');
  const value = parseEther(args.paymentAmountEth);
  if (value <= 0n) throw new Error('paymentAmountEth must be > 0');
  if (args.durationSeconds <= 0) throw new Error('durationSeconds must be > 0');

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: DUAL_DEPOSIT_ESCROW_ABI,
    functionName: 'createEscrow',
    args: [seller, arbiter, BigInt(args.durationSeconds)],
    value,
  });

  const receipt = await waitForReceipt(hash);

  // Parse escrowId from EscrowCreated event topic[1] (indexed escrowId)
  // Event sig: EscrowCreated(uint256 indexed escrowId, address indexed buyer, address indexed seller, uint256 paymentAmount, uint256 deadline)
  const ESCROW_CREATED_TOPIC = '0x59e4b8728799382406714f1c57de5c893d2772f9a8bf9950c5afe4397e648654';
  const log = receipt.logs.find(
    (l) => l.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase() &&
           l.topics[0] === ESCROW_CREATED_TOPIC
  );
  let escrowId: number;
  if (log && log.topics[1]) {
    escrowId = Number(BigInt(log.topics[1]));
  } else {
    // fallback: read nextEscrowId - 1
    const nextId = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: DUAL_DEPOSIT_ESCROW_ABI,
      functionName: 'nextEscrowId',
    });
    escrowId = Number(nextId) - 1;
  }

  const raw = await getRawEscrow(BigInt(escrowId));

  return {
    ...formatEscrow(escrowId, raw),
    txHash: hash,
    explorerUrl: txUrl(hash),
    gasUsed: receipt.gasUsed.toString(),
  };
}

export async function acceptEscrow(args: {
  escrowId: number;
  stakeAmountEth: string;
}) {
  const value = parseEther(args.stakeAmountEth);
  if (value <= 0n) throw new Error('stakeAmountEth must be > 0');

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: DUAL_DEPOSIT_ESCROW_ABI,
    functionName: 'acceptEscrow',
    args: [BigInt(args.escrowId)],
    value,
  });

  const receipt = await waitForReceipt(hash);
  const raw = await getRawEscrow(BigInt(args.escrowId));

  return {
    ...formatEscrow(args.escrowId, raw),
    sellerStakeEth: formatEther(value),
    txHash: hash,
    explorerUrl: txUrl(hash),
    gasUsed: receipt.gasUsed.toString(),
  };
}

export async function deliverWork(args: {
  escrowId: number;
  deliveryHash: string;
}) {
  let hashBytes: `0x${string}`;
  if (args.deliveryHash.startsWith('0x') && args.deliveryHash.length === 66) {
    hashBytes = args.deliveryHash as `0x${string}`;
  } else {
    // treat as a plain string and hash it
    hashBytes = keccak256(toBytes(args.deliveryHash));
  }

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: DUAL_DEPOSIT_ESCROW_ABI,
    functionName: 'deliverWork',
    args: [BigInt(args.escrowId), hashBytes],
  });

  const receipt = await waitForReceipt(hash);
  const raw = await getRawEscrow(BigInt(args.escrowId));

  return {
    ...formatEscrow(args.escrowId, raw),
    deliveryHashSubmitted: hashBytes,
    txHash: hash,
    explorerUrl: txUrl(hash),
    gasUsed: receipt.gasUsed.toString(),
  };
}

export async function completeEscrow(args: { escrowId: number }) {
  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: DUAL_DEPOSIT_ESCROW_ABI,
    functionName: 'completeEscrow',
    args: [BigInt(args.escrowId)],
  });

  const receipt = await waitForReceipt(hash);
  const raw = await getRawEscrow(BigInt(args.escrowId));
  const payout = raw.paymentAmount + raw.sellerStake;

  return {
    ...formatEscrow(args.escrowId, raw),
    payoutToSellerEth: formatEther(payout),
    txHash: hash,
    explorerUrl: txUrl(hash),
    gasUsed: receipt.gasUsed.toString(),
  };
}

export async function disputeEscrow(args: { escrowId: number; reason?: string }) {
  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: DUAL_DEPOSIT_ESCROW_ABI,
    functionName: 'disputeEscrow',
    args: [BigInt(args.escrowId)],
  });

  const receipt = await waitForReceipt(hash);
  const raw = await getRawEscrow(BigInt(args.escrowId));

  return {
    ...formatEscrow(args.escrowId, raw),
    reason: args.reason ?? null,
    txHash: hash,
    explorerUrl: txUrl(hash),
    gasUsed: receipt.gasUsed.toString(),
  };
}

export async function refundExpiredEscrow(args: { escrowId: number }) {
  const raw = await getRawEscrow(BigInt(args.escrowId));

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: DUAL_DEPOSIT_ESCROW_ABI,
    functionName: 'refundEscrow',
    args: [BigInt(args.escrowId)],
  });

  const receipt = await waitForReceipt(hash);
  const rawAfter = await getRawEscrow(BigInt(args.escrowId));

  return {
    ...formatEscrow(args.escrowId, rawAfter),
    refundToBuyerEth: formatEther(raw.paymentAmount),
    stakeBurnedEth: formatEther(raw.sellerStake),
    txHash: hash,
    explorerUrl: txUrl(hash),
    gasUsed: receipt.gasUsed.toString(),
  };
}

export async function getEscrow(args: { escrowId: number }) {
  const raw = await getRawEscrow(BigInt(args.escrowId));
  return formatEscrow(args.escrowId, raw);
}

export async function listEscrows(args: {
  limit?: number;
  state?: string;
  participant?: string;
}) {
  const limit = Math.min(args.limit ?? 10, 50);

  const nextId = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: DUAL_DEPOSIT_ESCROW_ABI,
    functionName: 'nextEscrowId',
  });

  const total = Number(nextId);
  const results = [];
  let checked = 0;

  for (let id = total - 1; id >= 0 && results.length < limit; id--) {
    checked++;
    const raw = await getRawEscrow(BigInt(id));
    const stateLabel = STATE_LABELS[raw.state];

    if (args.state && stateLabel !== args.state) continue;
    if (args.participant) {
      const p = args.participant.toLowerCase();
      if (
        raw.buyer.toLowerCase() !== p &&
        raw.seller.toLowerCase() !== p &&
        raw.arbiter.toLowerCase() !== p
      ) continue;
    }

    results.push({
      escrowId: id,
      state: stateLabel,
      buyer: raw.buyer,
      seller: raw.seller,
      arbiter: raw.arbiter,
      paymentAmountEth: formatEther(raw.paymentAmount),
      sellerStakeEth: formatEther(raw.sellerStake),
      deadline: new Date(Number(raw.deadline) * 1000).toISOString(),
    });
  }

  return {
    total,
    returned: results.length,
    escrows: results,
  };
}
