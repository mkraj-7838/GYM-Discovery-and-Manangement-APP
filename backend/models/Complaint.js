import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';


const complaintSchema = new mongoose.Schema({
    member: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String, required: true }
    },
    complaint: {
        category: { type: String, required: true },
        description: { type: String, required: true },
        incidentDate: { type: Date, default: Date.now }
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'resolved', 'rejected'],
        default: 'pending'
    },
    resolutionNotes: String,
    resolvedDate: Date,
    evidence: [{
        filename: String,
        path: String,
        mimetype: String
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true // This will automatically manage createdAt and updatedAt
});

// Indexes for faster queries
complaintSchema.index({ 'member.name': 'text' });
complaintSchema.index({ 'member.phone': 1 });
complaintSchema.index({ 'member.email': 1 });
complaintSchema.index({ 'complaint.category': 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ createdAt: -1 });
complaintSchema.plugin(mongoosePaginate);

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;