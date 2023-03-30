import { connectToDatabase } from '@/lib/database';
import { Address, IAddress } from '@/models/address';
import { NextApiRequest, NextApiResponse } from 'next';

type Data =
  | {
      balance: string;
    }
  | {
      message?: string;
    };

connectToDatabase();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  if (req.method !== 'GET') {
    res.status(405).json({
      message: 'Method Not Allowed',
    });
    return;
  }

  const address = await Address.find({});

  const balance = address.reduce((total: number, address: IAddress) => {
    const balance =
      parseInt(address.balance, 10) +
      address.pending_amount.reduce(
        (sum: number, amount: string) => sum + parseInt(amount, 10),
        0,
      );
    return total + balance;
  }, 0);

  res.status(200).json({
    balance: balance.toString(),
  });
}
