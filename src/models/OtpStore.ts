// import mongoose, { Schema, Document } from 'mongoose';

// interface IOtpStore extends Document {
//   email: string;
//   otp: string;
//   expiresAt: Date;
//   resendAfter: Date;
// }

// const OtpStoreSchema = new Schema<IOtpStore>({
//   email: { type: String, required: true },
//   otp: { type: String, required: true },
//   expiresAt: { type: Date, required: true },
//   resendAfter: { type: Date, required: true },
// });

// export default mongoose.models.OtpStore || mongoose.model<IOtpStore>('OtpStore', OtpStoreSchema);
