import { connectToDatabase } from '@/lib/database';
import { ethers } from 'ethers';
import { Address } from '@/models/address';
import { NextApiRequest, NextApiResponse } from 'next';
import { Transaction } from '@/models/transaction';
import { TransactionStatus } from '@/lib/constants';
import provider from '@/lib/provider';
import { ZodError, z } from 'zod';

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
      message: string;
      error?: ZodError;
    };

connectToDatabase();

const { AXON_FAUCET_REQUIRED_CONFIRMATIONS, AXON_FAUCET_CLAIM_VALUE } = process.env;

const schema = z.object({
  account: z.string(),
});

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

  const params = schema.safeParse(JSON.parse(req.body));
  if (!params.success) {
    res.status(400).json({
      message: 'Invalid request',
      error: params.error,
    });
    return;
  }
  const { account } = params.data;

  const cursor = Address.find({}).sort({ private_key: 1 }).cursor();
  let fromAddress;
  for (
    let address = await cursor.next();
    address != null;
    address = await cursor.next()
  ) {
    const pendingAmount = address.pending_amount.reduce(
      (sum, amount) => sum + parseInt(amount, 10),
      0,
    );
    if (
      parseInt(address.balance, 10) + pendingAmount >
      parseInt(AXON_FAUCET_CLAIM_VALUE!, 10)
    ) {
      fromAddress = address;
      break;
    }
  }
  await cursor.close();

  const signer = new ethers.Wallet(fromAddress?.private_key!, provider);
  const from = signer.address;
  const amount = (-AXON_FAUCET_CLAIM_VALUE!).toString();

  await Address.updateOne(
    { private_key: fromAddress?.private_key },
    { $push: { pending_amount: amount } },
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
    { hash: tx.hash },
    { $set: { status: TransactionStatus.Confirmed } },
  );

  const balance = await provider.getBalance(signer.getAddress());
  await Address.updateOne(
    { private_key: fromAddress?.private_key! },
    {
      balance,
      $pop: { pending_amount: 1 },
    },
  );
}
