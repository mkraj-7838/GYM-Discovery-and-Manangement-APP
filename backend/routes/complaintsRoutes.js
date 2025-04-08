import express from 'express';
import Complaint from '../models/Complaint.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/complaints/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image and video files are allowed!'), false);
        }
    }
});

/*
 * @route POST /api/complaints
 * @desc Submit a new complaint
 * @access Public
 */
router.post('/', upload.array('evidence', 5), async (req, res) => {
    try {
        const { member, complaint } = req.body;
        
        // Handle file uploads if any
        const evidenceFiles = req.files?.map(file => ({
            filename: file.originalname,
            path: file.path,
            mimetype: file.mimetype
        })) || [];

        const newComplaint = await Complaint.create({
            member: {
                name: member.name,
                phone: member.phone,
                email: member.email
            },
            complaint: {
                category: complaint.category,
                description: complaint.description,
                incidentDate: complaint.incidentDate || new Date()
            },
            status: 'pending',
            evidence: evidenceFiles
        });
        
        res.status(201).json({
            success: true,
            message: 'Complaint submitted successfully',
            data: newComplaint
        });
    } catch (error) {
        console.error('Error submitting complaint:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit complaint',
            error: error.message
        });
    }
});

/*
 * @route GET /api/complaints/search
 * @desc Search complaints by member details
 * @access Public
 */
router.get('/search', async (req, res) => {
    try {
        const { name, phone, email } = req.query;
        
        if (!name && !phone && !email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide at least one search parameter (name, phone, or email)'
            });
        }

        const query = {};
        if (name) query['member.name'] = new RegExp(name, 'i');
        if (phone) query['member.phone'] = phone;
        if (email) query['member.email'] = email;

        const complaints = await Complaint.find(query)
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            success: true,
            count: complaints.length,
            data: complaints
        });
    } catch (error) {
        console.error('Error searching complaints:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search complaints',
            error: error.message
        });
    }
});

/*
 * @route GET /api/complaints
 * @desc Get all complaints (for admin)
 * @access Private/Admin
 */
router.get('/', async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        
        const query = {};
        if (status) query.status = status;


        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 }
        };

        const result = await Complaint.paginate(query, options);

        res.json({
            success: true,
            count: result.docs.length,
            total: result.totalDocs,
            pages: result.totalPages,
            page: result.page,
            data: result.docs
        });
    } catch (error) {
        console.error('Error getting complaints:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get complaints',
            error: error.message
        });
    }
});

/**
 * @route PATCH /api/complaints/:id/status
 * @desc Update complaint status
 * @access Private/Admin
 */
router.patch('/:id/status', async (req, res) => {
    try {
        const { status, notes } = req.body;
        const validStatuses = ['pending', 'in_progress', 'resolved', 'rejected'];
        
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status value. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const update = {
            status,
            resolutionNotes: notes || '',
            updatedAt: new Date()
        };

        if (status === 'resolved') {
            update.resolvedDate = new Date();
        }

        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { $set: update },
            { new: true, runValidators: true }
        );

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        res.json({
            success: true,
            message: 'Complaint status updated',
            data: complaint
        });
    } catch (error) {
        console.error('Error updating complaint status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update complaint status',
            error: error.message
        });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const complaint = await Complaint.findByIdAndDelete(req.params.id);

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        // Optional: Delete associated evidence files
        if (complaint.evidence && complaint.evidence.length > 0) {
            complaint.evidence.forEach(file => {
                try {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                } catch (fileError) {
                    console.error('Error deleting evidence file:', fileError);
                }
            });
        }

        res.json({
            success: true,
            message: 'Complaint deleted successfully',
            data: complaint
        });
    } catch (error) {
        console.error('Error deleting complaint:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete complaint',
            error: error.message
        });
    }
});

export default router;