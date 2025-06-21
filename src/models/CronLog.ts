// models/CronLog.ts
import { Schema, model, models } from 'mongoose';

const CronLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    domain: { type: String, required: true },
    status: { type: Number },
    success: { type: Boolean },
    responseTime: { type: Number }, // in ms
    message: { type: String, require:true },
  },
  { timestamps: true }
);

CronLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

export default models.CronLog || model('CronLog', CronLogSchema);
