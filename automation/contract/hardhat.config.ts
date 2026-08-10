import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

// Load environment variables from repository root .env
dotenv.config({ path: "../../.env" });

const RPC_URL = process.env.RPC_URL || "";
// Safely fall back to a dummy private key if none is provided in env
const OPERATOR_PRIVATE_KEY = process.env.OPERATOR_PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000001";

const accounts = [OPERATOR_PRIVATE_KEY];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {},
    polygon: {
      url: RPC_URL || "https://polygon-rpc.com",
      accounts: accounts
    },
    amoy: {
      url: RPC_URL || "https://rpc-amoy.polygon.technology",
      accounts: accounts
    }
  }
};

export default config;
