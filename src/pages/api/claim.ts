import { connectToDatabase } from '@/lib/database';
import { ethers } from 'ethers';
import { Address } from '@/models/address';
import { NextApiRequest, NextApiResponse } from 'next';
import { Transaction } from '@/models/transaction';
import { TransactionStatus } from '@/lib/constants';

type Data =
  | {
      from: string;
      to: string;
      value: string;
      nonce: string;
      hash: string;
      gas: string;
    }
  | {
      message?: string;
    };

connectToDatabase();

const {
  AXON_FAUCET_REQUIRED_CONFIRMATIONS,
  AXON_FAUCET_CLAIM_VALUE,
  AXON_FAUCET_RPC_URL,
  AXON_FAUCET_CHAIN_ID,
} = process.env;

const provider = new ethers.JsonRpcProvider(
  AXON_FAUCET_RPC_URL,
  parseInt(AXON_FAUCET_CHAIN_ID!),
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  if (req.method !== 'POST') {
    res.status(405).json({
      message: 'Method Not Allowed',
    });
    return;
  }

  const { account } = JSON.parse(req.body);

  const cursor = Address.find({}).sort({ private_key: 1 }).cursor();
  let fromAddress;
  for (
    let address = await cursor.next();
    address != null;
    address = await cursor.next()
  ) {
    if (BigInt(address.balance) > BigInt(AXON_FAUCET_CLAIM_VALUE!)) {
      fromAddress = address;
      break;
    }
  }
  await cursor.close();

  const signer = new ethers.Wallet(fromAddress?.private_key!, provider);
  const from = signer.address;

  await Address.updateOne(
    { private_key: fromAddress?.private_key },
    { $push: { pending_amount: (-AXON_FAUCET_CLAIM_VALUE!).toString() } },
  );

  const tx = await signer.sendTransaction({
    to: account,
    type: 2,
    value: AXON_FAUCET_CLAIM_VALUE,
    gasLimit: 21000,
  });

  const receipt = await tx.wait(1);
  const result = {
    from,
    to: account,
    value: tx.value.toString(),
    nonce: tx.nonce.toString(),
    hash: tx.hash,
    gas: receipt!.gasUsed.toString(),
  };
  await Transaction.create({
    ...result,
    time: new Date(),
    status: TransactionStatus.Pending,
  }),

  res.status(200).json(result);

  await tx.wait(parseInt(AXON_FAUCET_REQUIRED_CONFIRMATIONS!, 10));
  await Transaction.updateOne(
    {
      hash: tx.hash,
    },
    {
      $set: { status: TransactionStatus.Confirmed },
    },
  );
}
