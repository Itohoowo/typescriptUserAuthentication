import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

interface IUser extends Document {
    email: string;
    password: string;
    isConfirmed: boolean;
    isComplete: boolean;
    firstName?: string; // Add firstName property
}

const UserSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isConfirmed: { type: Boolean, default: false },
    isComplete: { type: Boolean, default: false } // Profile Completion Check
}, { timestamps: true });

UserSchema.pre<IUser>('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

export default model<IUser>('User', UserSchema);
