// File: models/otp.ts
import { Schema, model, Document } from 'mongoose';

interface IOTP extends Document {
    email: string;
    expiresAt: Date;
    confirmationToken: string;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
}

const OTPSchema = new Schema<IOTP>(
    {
        email: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        confirmationToken: {
            type: String,
            default: "",
        },
        resetPasswordToken: String,
        resetPasswordExpires: Date,
    },
    { timestamps: true }
);

export default model<IOTP>('OTP', OTPSchema);
