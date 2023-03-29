import { TransactionStatus } from '@/lib/constants';
import { connectToDatabase } from '@/lib/database';
import { Transaction } from '@/models/transaction';
import { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  message?: string;
};

connectToDatabase();

const DEFAULT_STATUS = [
  TransactionStatus.Failed,
  TransactionStatus.Pending,
  TransactionStatus.Confirmed,
];
const DEFAULT_PAGE_NUM = 0;
const DEFAULT_SIZE_LIMIT = 20;

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

  const { page, limit, status = DEFAULT_STATUS } = req.query;
  console.log(page, limit, status);

  const pageNum = parseInt(page as string, 10) ?? DEFAULT_PAGE_NUM;
  const limitNum = parseInt(limit as string, 10) ?? DEFAULT_SIZE_LIMIT;

  const transcations = await Transaction.find({ status: { $in: status } })
    .skip(pageNum * limitNum)
    .limit(limitNum);

  console.log(transcations);
  res.end();
}
