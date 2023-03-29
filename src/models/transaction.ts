import mongoose, { Model, Schema, model } from 'mongoose';

export interface ITransaction {
  from: string;
  to: string;
  value: string;
  gas: string;
  nonce: string;
  hash: string;
  time: Date;
  status: number;
}

export const TransactionSchema = new Schema<ITransaction>(
  {
    from: String,
    to: String,
    value: String,
    gas: String,
    nonce: String,
    hash: String,
    time: Date,
    status: Number,
  },
);

export const Transaction = (mongoose.models.Transaction ||
  model('Transaction', TransactionSchema)) as Model<ITransaction>;
