// models/CronLog.ts
import { Schema, model, models } from 'mongoose';

const CronLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    domain: { type: String, required: true },
    status: { type: Number },
    responseTime: { type: Number }, // in ms
    message: { type: String, require:true },
  },
  { timestamps: true }
);

export default models.CronLog || model('CronLog', CronLogSchema);
