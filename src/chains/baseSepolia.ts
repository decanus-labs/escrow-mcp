import { createPublicClient, createWalletClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { account, RPC_URL } from '../config.js';

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC_URL),
});

export const walletClient = createWalletClient({
  chain: baseSepolia,
  transport: http(RPC_URL),
  account,
});
