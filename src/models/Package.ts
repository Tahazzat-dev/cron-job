import { Document, Schema, model, models } from 'mongoose';

export interface IPackage extends Document {
    name: string;
    price: number;
    validity: number;
    intervalInMs: number;
    manualCronLimit: number;
    status: 'enabled' | 'disabled'
}

const PackageSchema = new Schema<IPackage>(
    {
        name: { type: String, required: true, unique: true, trim: true },
        price: { type: Number, required: true, trim: true },
        status: {
            type: String,
            enum: ['enabled', 'disabled'],
            default: 'enabled',
        },
        validity: { type: Number, required: true, trim: true },
        intervalInMs: { type: Number, required: true, trim: true },
        manualCronLimit: { type: Number, required: true, trim: true },
    },
    {
        timestamps: true,
    }
);

// Indexes
PackageSchema.index({ validity: 1 });

export default models.Package || model<IPackage>('Package', PackageSchema);
