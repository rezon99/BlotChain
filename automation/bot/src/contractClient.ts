import { ethers } from 'ethers';
import dotenv from 'dotenv';
import contractConfig from '@blotchain/automation-shared/contract-config.json' with { type: 'json' };

dotenv.config();

export function getContractAddress(): string {
  return process.env.CONTRACT_ADDRESS || contractConfig.address;
}

export function getProvider(): ethers.JsonRpcProvider {
  const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
  return new ethers.JsonRpcProvider(rpcUrl);
}

export function getOperatorWallet(provider?: ethers.JsonRpcProvider): ethers.Wallet {
  const activeProvider = provider || getProvider();
  const privateKey = process.env.OPERATOR_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001';
  return new ethers.Wallet(privateKey, activeProvider);
}

export function getContractClient(walletOrProvider?: ethers.Wallet | ethers.JsonRpcProvider): ethers.Contract {
  const activeSignerOrProvider = walletOrProvider || getOperatorWallet();
  const address = getContractAddress();
  return new ethers.Contract(address, contractConfig.abi, activeSignerOrProvider);
}

export async function getOperatorBalance(): Promise<string> {
  const wallet = getOperatorWallet();
  const balance = await wallet.provider!.getBalance(wallet.address);
  return ethers.formatEther(balance);
}

export async function getTotalSupply(): Promise<number> {
  const contract = getContractClient();
  try {
    const total = await contract.totalSupply();
    return Number(total);
  } catch {
    // If contract doesn't implement totalSupply (ERC721Enumerable), we fallback to standard check or return 0
    return 0;
  }
}

export async function mintSnapshotOnChain(tokenURI: string): Promise<number> {
  const contract = getContractClient();
  const wallet = getOperatorWallet();
  const tx = await contract.mintSnapshot(wallet.address, tokenURI);
  const receipt = await tx.wait();

  // Try to find SnapshotMinted event or Transfer event
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed && (parsed.name === 'SnapshotMinted' || parsed.name === 'Transfer')) {
        const tokenId = parsed.args.tokenId ?? parsed.args[0];
        if (tokenId !== undefined) {
          return Number(tokenId);
        }
      }
    } catch {
      // Continue checking other logs
    }
  }
  return 0;
}

export async function burnSnapshotToken(tokenId: number | string): Promise<{ success: boolean; txHash?: string; error?: string }> {
  const contract = getContractClient();
  try {
    const tx = await contract.burn(tokenId);
    const receipt = await tx.wait();
    return { success: true, txHash: receipt.hash };
  } catch (err: any) {
    let reason = err.reason || err.message || 'Unknown error during burn execution';
    if (err.info && err.info.error && err.info.error.message) {
      reason = err.info.error.message;
    }
    return { success: false, error: reason };
  }
}
