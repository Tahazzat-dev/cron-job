import { Document, Schema, model, models } from 'mongoose';
import bcrypt from 'bcrypt';
import { SubscriptionType, TDomain, UserRole } from '../types/types';

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
  username: string;
  mobile: number;
  status: 'pending' | 'enabled' | 'disabled' | "deleted" | "blocked";
  role: UserRole;
  defaultDomains: TDomain[];
  manualDomains?: TDomain[];
  telegramId?: string;
  telegramConnected: boolean;
  packageExpiresAt: Date;
  subscription: SubscriptionInfo;
  manualCronCount: number;
  allowedToAddManualDomains: boolean;
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
    username: { type: String, required: true, unique: true },
    mobile: { type: Number,required: true, unique: true, trim: true},
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    status: {
      type: String,
      enum: ['pending', 'enabled', 'disabled' , 'deleted', 'blocked'],
      default: 'pending',
    },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },

    defaultDomains: {
      type: [
        {
          status: { type: String, enum: ['enabled', 'disabled'], default: 'enabled' },
          url: { type: String, required: true, trim: true },
        },
      ],
      required: true,
      validate: [(arr: TDomain[]) => arr.length > 0, 'At least one default domain is required.'],
    },

    manualDomains: {
      type: [
        {
          status: { type: String, enum: ['enabled', 'disabled'], default: 'enabled' },
          url: { type: String, required: true, trim: true },
        },
      ],
      required: false,
      default: [],
    },

    telegramId: { type: String },
    telegramConnected: { type: Boolean, default: false },

    packageExpiresAt: { type: Date, required: true },

    subscription: {
      type: {
        type: String,
        enum: ['trial', 'silver', 'gold', 'diamond'],
        required: true,
        default: 'trial',
      },
      manualCronLimit: { type: Number, required: true, default: 5 },
    },

    manualCronCount: { type: Number, default: 0 },
    allowedToAddManualDomains: { type: Boolean, default: false },

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

// Indexes
UserSchema.index({ packageExpiresAt: 1 });
UserSchema.index({ 'defaultDomains.url': 1 });
UserSchema.index({ 'manualDomains.url': 1 });
UserSchema.index({ 'subscription.type': 1 });
UserSchema.index({ status: 1 }); 

// Hash password before saving
UserSchema.pre('save', async function (next) {
  const user = this as IUser;
  if (!user.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  next();
});

// Password comparison method
UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export default models.User || model<IUser>('User', UserSchema);
