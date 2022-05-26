import { Timestamp } from "mongodb";

export class Addresses {
  balance: string;

  pending_amount: string[];

  is_processing: boolean;

  private_key: string;
}

export enum TransactionStatus {
  Pending = 0,
  Confirmed = 1,
  Failed = 2,
}

const TRANSACTION_STATUS = ["Pending", "Confirmed", "Failed"];
export function transactionStatusToStr(status: TransactionStatus): string {
  return TRANSACTION_STATUS[status];
}

export class Transactions {
  from: string;

  to: string;

  value: string;

  gas: string;

  nonce: string;

  hash: string;

  time: Timestamp;

  status: number;
}
