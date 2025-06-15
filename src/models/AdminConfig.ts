// models/AdminConfig.ts
import { Schema, model, models } from 'mongoose';

const AdminConfigSchema = new Schema({
  autoCronIntervalSec: {
    type: Number,
    default: 5, // default to 5s
    enum: [3, 5, 7],
  },
});

export default models.AdminConfig || model('AdminConfig', AdminConfigSchema);
