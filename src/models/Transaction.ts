import { Schema, model, models } from 'mongoose';
import { ITransaction } from '../types/types';



const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String,enum:["success","fail"],required: true },
    amount: {type: Number,required:true},
    transactionHash: { type: String,required:true },
    packageId: { type: Schema.Types.ObjectId, ref: 'Package', required: true },
  },
  {
    timestamps: true,
  }
);

// Auto-delete logs after 30 days
transactionSchema.index({ userId: 1 }, { expireAfterSeconds: 15552000 });
transactionSchema.index({status : 1 });

export default models.Transaction || model<ITransaction>('Transaction', transactionSchema);
