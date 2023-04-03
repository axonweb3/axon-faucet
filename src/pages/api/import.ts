import provider from '@/lib/provider';
import { Address } from '@/models/address';
import { ethers } from 'ethers';
import { NextApiRequest, NextApiResponse } from 'next';
import { ZodError, z } from 'zod';

type Data =
  | { balance: string }
  | {
      message: string;
      error?: ZodError;
    };

const schema = z.object({
  private_key: z.string(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  const params = schema.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({
      message: 'Invalid request',
      error: params.error,
    });
    return;
  }
  const { private_key } = params.data;
  if (!ethers.isHexString(private_key)) {
    res.status(400).json({ message: 'Invalid private key' });
    return;
  }

  const signer = new ethers.Wallet(private_key, provider);
  const address = await signer.getAddress();
  const balance = await provider.getBalance(address);

  const exist = await Address.exists({ private_key });
  if (exist) {
    await Address.updateOne({ private_key }, { balance });
  } else {
    await Address.create({
      private_key,
      balance,
      is_processing: false,
      pending_amount: [],
    });
  }

  res.status(200).json({ balance: balance.toString() });
}
