// import mongoose, { Document, Schema, Types, model, models } from 'mongoose';
// import bcrypt from 'bcrypt';
// import { TDomain, TManualDomain, UserRole } from '../types/types';

// interface NotificationPreferences {
//   telegram: boolean;
//   email: boolean;
// }
// interface Profile {
//   avatarUrl?: string;
//   bio?: string;
// }

// export interface IUser extends Document {
//   name: string;
//   email: string;
//   password: string;
//   username: string;
//   mobile: string;
//   status: 'pending' | 'enabled' | 'disabled' | "deleted" | "blocked";
//   role: UserRole;
//   domain: string;
//   defaultDomains: TDomain[];
//   manualDomains: TManualDomain[];
//   telegramId?: string;
//   telegramConnected: boolean;
//   packageExpiresAt: Date;
//   subscription?: mongoose.Types.ObjectId;
//   manualCronCount: number;
//   allowedToAddManualDomains: boolean;
//   notificationPreferences: NotificationPreferences;
//   twoFactorEnabled: boolean;
//   failedLoginAttempts: number;
//   lastFailedLoginAt?: Date;
//   profile?: Profile;
//   comparePassword(candidate: string): Promise<boolean>;
// }

// const UserSchema = new Schema<IUser>(
//   {
//     name: { type: String, required: true, minlength: 2, maxlength: 50, trim: true },
//     username: { type: String, required: true, unique: true },
//     mobile: { type: String, required: true, unique: true, trim: true },
//     email: { type: String, required: true, unique: true, lowercase: true, trim: true },
//     password: { type: String, required: true, minlength: 8 },
//     status: {
//       type: String,
//       enum: ['pending', 'enabled', 'disabled', 'deleted', 'blocked'],
//       default: 'enabled', // modify according to requirements
//     },
//     role: { type: String, enum: ['admin', 'user'], default: 'user' },
//     domain: { type: String, required: true, unique: true, trim: true },
//     defaultDomains: {
//       type: [
//         {
//           status: { type: String, enum: ['enabled', 'disabled'] },
//           url: { type: String, required: true, trim: true },
//         },
//       ],
//       default: [],
//     },
//     packageExpiresAt: { type: Date, default: () => new Date() },
//     manualDomains: {
//       type: [
//         {
//           title: { type: String, required: true },
//           status: { type: String, enum: ['enabled', 'disabled'], default: 'enabled' },
//           url: { type: String, required: true, trim: true },
//           executeInMs: { type: Number, default: (1000 * 60 * 10) },
//         },
//       ],
//       default: [],
//     },

//     telegramId: { type: String },
//     telegramConnected: { type: Boolean, default: false },

//     subscription: {
//       type: Types.ObjectId,
//       ref: 'Package',
//       required: false,
//     },

//     manualCronCount: { type: Number, default: 0 },
//     allowedToAddManualDomains: { type: Boolean, default: false },

//     notificationPreferences: {
//       telegram: { type: Boolean, default: true },
//       email: { type: Boolean, default: true },
//     },

//     twoFactorEnabled: { type: Boolean, default: false },
//     failedLoginAttempts: { type: Number, default: 0 },
//     lastFailedLoginAt: { type: Date },

//     profile: {
//       type: {
//         avatarUrl: { type: String },
//         bio: { type: String, maxlength: 300 },
//       },
//       default: {},
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Indexes
// UserSchema.index({ 'defaultDomains.url': 1 });
// UserSchema.index({ 'manualDomains.url': 1 })
// UserSchema.index({ status: 1 });

// // Hash password before saving
// UserSchema.pre('save', async function (next) {
//   const user = this as IUser;
//   if (!user.isModified('password')) return next();
//   const salt = await bcrypt.genSalt(10);
//   user.password = await bcrypt.hash(user.password, salt);
//   next();
// });

// // Password comparison method
// UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
//   return bcrypt.compare(candidate, this.password);
// };

// export default models.User || model<IUser>('User', UserSchema);
