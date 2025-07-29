import { Schema, model, models, Document } from 'mongoose';

export interface ICronLog extends Document {
  userId: Schema.Types.ObjectId;
  domain: string;
  status?: number;
  responseTime?: number;
  domainType: 'default' | 'manual';
}

const CronLogSchema = new Schema<ICronLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    domain: { type: String, required: true },
    status: { type: Number },
    responseTime: { type: Number }, // in ms
    domainType: {
      type: String,
      enum: ['default', 'manual'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete logs after 12 days
CronLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 43200 });
CronLogSchema.index({userId : 1 });
CronLogSchema.index({status : 1 });
CronLogSchema.index({ domainType: 1 });
CronLogSchema.index({ domainType: 1 });

export default models.CronLog || model<ICronLog>('CronLog', CronLogSchema);
