// // models/PasswordResetToken.ts
// import mongoose, { Schema, Document } from 'mongoose';

// export interface IPasswordResetToken extends Document {
//   email: string;
//   token: string;
//   expiresAt: Date;
// }

// const PasswordResetTokenSchema = new Schema<IPasswordResetToken>({
//   email: { type: String, required: true },
//   token: { type: String, required: true },
//   expiresAt: { type: Date, required: true },
// });

// PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-delete after expiry

// export default mongoose.models.PasswordResetToken ||
//   mongoose.model<IPasswordResetToken>('PasswordResetToken', PasswordResetTokenSchema);
