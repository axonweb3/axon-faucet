import { connect, connection } from 'mongoose';

const { AXON_FAUCET_MONGODB_URL, AXON_FAUCET_MONGODB_DB } = process.env;

export async function connectToDatabase() {
  if (!connection.readyState) {
    console.log('Connecting to ', AXON_FAUCET_MONGODB_DB);
    connect(AXON_FAUCET_MONGODB_URL!);
  }
}
