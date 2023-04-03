import { connectToDatabase, collections, Address } from '@/lib/database';
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

  const address = await collections
    .address!.find({})
    .project({ balance: 1, pending_amount: 1 })
    .toArray() as Address[];

  const balance = address.reduce((total: number, address: Address) => {
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
