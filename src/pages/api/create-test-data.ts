import { TransactionStatus } from '@/lib/constants';
import { connectToDatabase } from '@/lib/database';
import { Address, IAddress } from '@/models/address';
import { ITransaction, Transaction } from '@/models/transaction';
import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  message?: string;
};

connectToDatabase();

export default async function handler(
  _: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      message: 'Unable to create test data in production environment.',
    });
    return;
  }

  const addresses: IAddress[] = [];
  for (let i = 0; i < 3; i += 1) {
    const privateKey = '0x' + i.toString().padStart(64, '0');
    const exists = await Address.exists({ private_key: privateKey });
    if (exists) {
      continue;
    }

    addresses.push({
      private_key: privateKey,
      balance: '1000000000000000000',
      pending_amount: [],
      is_processing: false,
    });
  }

  if (addresses.length === 0) {
    res.status(200).json({ message: 'test data exists' });
    return;
  }

  const transcations: ITransaction[] = [];
  for (const status of [
    TransactionStatus.Confirmed,
    TransactionStatus.Pending,
    TransactionStatus.Failed,
  ]) {
    transcations.push({
      from: '0x0000000000000000000000000000000000000000',
      to: '0x0000000000000000000000000000000000000000',
      value: '1000000000000000000',
      gas: '100',
      nonce: '0',
      hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
      time: new Date(),
      status,
    });
  }

  await Address.insertMany(addresses);
  await Transaction.insertMany(transcations);

  res.status(200).json({ message: 'success' });
}
