import { connect, connection } from 'mongoose';
import env from './env';

const { AXON_FAUCET_MONGODB_URL, AXON_FAUCET_MONGODB_DB } = env;

export async function connectToDatabase() {
  if (!connection.readyState) {
    console.log('Connecting to ', AXON_FAUCET_MONGODB_DB);
    connect(AXON_FAUCET_MONGODB_URL!);
  }
}
