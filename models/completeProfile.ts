import { Schema, model, Document } from 'mongoose';

interface ICompleteProfile extends Document {
    user: Schema.Types.ObjectId;
    firstName: string;
    middleName?: string;
    lastName: string;
    gender: string;
    dob: Date;
    phoneNumber: string;
    countryOfOrigin: string;
    profileImage: string;
}

const CompleteProfileSchema = new Schema<ICompleteProfile>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },
    gender: { type: String, required: true },
    dob: { type: Date, required: true },
    phoneNumber: { type: String, required: true },
    countryOfOrigin: { type: String, required: true },
    profileImage: { type: String, required: true },
});

export default model<ICompleteProfile>('CompleteProfile', CompleteProfileSchema);
