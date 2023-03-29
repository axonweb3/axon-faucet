import mongoose, { Model, Schema, model } from 'mongoose';

export interface IAddress {
  balance: string;
  pending_amount: string[];
  is_processing: boolean;
  private_key: string;
}

export const AddressSchema = new Schema<IAddress>({
  balance: String,
  pending_amount: [String],
  is_processing: Boolean,
  private_key: String,
});

export const Address = (mongoose.models.Address ||
  model('Address', AddressSchema)) as Model<IAddress>;
