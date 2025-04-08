// feedbackModel.js
import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const feedbackSchema = new mongoose.Schema({
    member: {
        name: { type: String, trim: true },
        phone: { type: String, trim: true },
        email: { type: String, trim: true }
    },
    ratings: {
        overall: { type: Number, min: 0, max: 5, required: true },
        cleanliness: { type: Number, min: 0, max: 5, required: true },
        equipment: { type: Number, min: 0, max: 5, required: true },
        staff: { type: Number, min: 0, max: 5, required: true },
        availability: { type: Number, min: 0, max: 5, required: true },
        ambiance: { type: Number, min: 0, max: 5, required: true }
    },
    feedback: {
        likes: { type: String, trim: true },
        improvements: { type: String, trim: true },
        comments: { type: String, trim: true }
    },
    recommendation: {
        type: String,
        enum: ['yes', 'no', 'maybe'],
        required: true
    },
    evidence: [{
        filename: String,
        path: String,
        mimetype: String
    }],
    agreement: {
        type: Boolean,
        required: true,
        default: false
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'archived'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

feedbackSchema.plugin(mongoosePaginate);

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;