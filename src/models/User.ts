import mongoose, { Document, Schema, model, models } from 'mongoose';
import bcrypt from 'bcrypt';

export type UserRole = 'admin' | 'user';
export type SubscriptionType = 'silver' | 'gold' | 'diamond';

interface NotificationPreferences {
  telegram: boolean;
  email: boolean;
}

interface SubscriptionInfo {
  type: SubscriptionType;
  manualCronLimit: number;
}

interface Profile {
  avatarUrl?: string;
  bio?: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  domain: string;
  manualCronDomains: string[];
  telegramId?: string;
  telegramConnected: boolean;
  packageExpiresAt: Date;
  subscription: SubscriptionInfo;
  manualCronCount: number;
  notificationPreferences: NotificationPreferences;
  twoFactorEnabled: boolean;
  failedLoginAttempts: number;
  lastFailedLoginAt?: Date;
  profile: Profile;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, minlength: 2, maxlength: 50, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },

    domain: { type: String, required: true, trim: true },
    manualCronDomains: { type: [String], default: [] },

    telegramId: { type: String },
    telegramConnected: { type: Boolean, default: false },

    packageExpiresAt: { type: Date, required: true },

    subscription: {
      type: {
        type: String,
        enum: ['silver', 'gold', 'diamond'],
        required: true,
        default: 'silver',
      },
      manualCronLimit: { type: Number, required: true, default: 5 },
    },

    manualCronCount: { type: Number, default: 0 },
    notificationPreferences: {
      telegram: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
    },

    twoFactorEnabled: { type: Boolean, default: false },
    failedLoginAttempts: { type: Number, default: 0 },
    lastFailedLoginAt: { type: Date },

    profile: {
      avatarUrl: { type: String },
      bio: { type: String, maxlength: 300 },
    },
  },
  {
    timestamps: true,
  }
);


UserSchema.index({ packageExpiresAt: 1 });
UserSchema.index({ domain: 1 }, { unique: true });
UserSchema.index({ manualCronDomains: 1 });
UserSchema.index({ 'subscription.type': 1 });



// Password hashing
UserSchema.pre('save', async function (next) {
  const user = this as IUser;
  if (!user.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export default models.User || model<IUser>('User', UserSchema);
