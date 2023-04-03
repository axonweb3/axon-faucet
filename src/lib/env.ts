import { z } from "zod";

export interface IEnv {
  AXON_FAUCET_REQUIRED_CONFIRMATIONS: number,
  AXON_FAUCET_CLAIM_VALUE: number,
  AXON_FAUCET_RPC_URL: string,
  AXON_FAUCET_CHAIN_ID: number,
  AXON_FAUCET_MONGODB_URL: string,
  AXON_FAUCET_MONGODB_DB: string,
}

const schema = z.object({
  AXON_FAUCET_REQUIRED_CONFIRMATIONS: z.string(),
  AXON_FAUCET_CLAIM_VALUE: z.string(),
  AXON_FAUCET_RPC_URL: z.string(),
  AXON_FAUCET_CHAIN_ID: z.string(),
  AXON_FAUCET_MONGODB_URL: z.string(),
  AXON_FAUCET_MONGODB_DB: z.string(),
});

const env = schema.parse(process.env);
const AXON_FAUCET_REQUIRED_CONFIRMATIONS = parseInt(env.AXON_FAUCET_REQUIRED_CONFIRMATIONS, 10);
const AXON_FAUCET_CLAIM_VALUE = parseInt(env.AXON_FAUCET_CLAIM_VALUE, 10);
const AXON_FAUCET_CHAIN_ID = parseInt(env.AXON_FAUCET_CHAIN_ID, 10);

export default {
  ...env,
  AXON_FAUCET_REQUIRED_CONFIRMATIONS,
  AXON_FAUCET_CLAIM_VALUE,
  AXON_FAUCET_CHAIN_ID,
} as IEnv;

