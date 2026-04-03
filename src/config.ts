import { privateKeyToAccount } from 'viem/accounts';

export const CONTRACT_ADDRESS = (
  process.env.CONTRACT_ADDRESS ?? '0xEB979aDC63efcc68E32Ef0378185368fa3648Fed'
) as `0x${string}`;

export const RPC_URL =
  process.env.RPC_URL ?? 'https://sepolia.base.org';

const rawKey = process.env.PRIVATE_KEY;
if (!rawKey) {
  process.stderr.write('[mcp-escrow] ERROR: PRIVATE_KEY env var is required\n');
  process.exit(1);
}
const normalized = rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`;
export const account = privateKeyToAccount(normalized as `0x${string}`);

export const CHAIN_ID = 84532;
export const EXPLORER_BASE = 'https://sepolia.basescan.org';
