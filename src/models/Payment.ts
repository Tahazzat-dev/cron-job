// import { Schema, model, models } from 'mongoose';
// import { IPayment } from '../types/types';



// const paymentSchema = new Schema<IPayment>(
//   {
//     userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
//     amount: {type: Number,required:true},
//     processExpiresAt:{type: Date, required:true},
//     packageId: { type: Schema.Types.ObjectId, ref: 'Package', required: true },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Auto-delete logs after 30 days
// paymentSchema.index({ userId: 1 });
 

// export default models.Payment || model<IPayment>('Payment', paymentSchema);
