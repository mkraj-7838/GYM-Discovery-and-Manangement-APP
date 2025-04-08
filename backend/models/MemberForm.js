import mongoose from 'mongoose';

const MemberFormSchema = new mongoose.Schema({
    photo: String,
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: String,
    height: Number,
    weight: Number,
    age: Number,
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    batch: { type: String, enum: ['morning', 'evening'], required: true },
    membershipPlan: { type: String, enum: ['basic', 'premium', 'vip'], required: true },
    status: { type: String, enum: ['active', 'inactive', 'trial'], default: 'active' },
    joiningDate: { type: Date, required: true },
    monthsOfSubscription: Number,
    createdAt: { type: Date, default: Date.now }
});

const MemberForm = mongoose.model('MemberForm', MemberFormSchema);
export default MemberForm;