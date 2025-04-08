// feedbackRoutes.js
import express from 'express';
import Feedback from '../models/Feedback.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/feedback/';
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
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

/**
 * @route POST /api/feedback
 * @desc Submit new feedback
 * @access Public
 */
router.post('/', upload.array('evidence', 5), async (req, res) => {
    try {
        const { member, ratings, feedback, recommendation, agreement } = req.body;
        
        // Handle file uploads if any
        const evidenceFiles = req.files?.map(file => ({
            filename: file.originalname,
            path: file.path,
            mimetype: file.mimetype
        })) || [];

        const newFeedback = await Feedback.create({
            member,
            ratings,
            feedback,
            recommendation,
            evidence: evidenceFiles,
            agreement
        });
        
        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: newFeedback
        });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit feedback',
            error: error.message
        });
    }
});

/**
 * @route GET /api/feedback
 * @desc Get all feedback (paginated)
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

        const result = await Feedback.paginate(query, options);

        res.json({
            success: true,
            count: result.docs.length,
            total: result.totalDocs,
            pages: result.totalPages,
            page: result.page,
            data: result.docs
        });
    } catch (error) {
        console.error('Error getting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get feedback',
            error: error.message
        });
    }
});


/**
 * @route GET /api/feedback/search
 * @desc Search feedback by member details (phone, name, or email)
 * @access Private/Admin
 */
router.get('/search', async (req, res) => {
    try {
        const { phone, name, email } = req.query;
        
        // Validate at least one search parameter is provided
        if (!phone && !name && !email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide at least one search parameter (phone, name, or email)'
            });
        }

        const query = {};
        
        // Build search query
        if (phone) query['member.phone'] = phone;
        if (name) query['member.name'] = new RegExp(name, 'i'); // Case-insensitive partial match
        if (email) query['member.email'] = email;

        const feedback = await Feedback.find(query)
            .sort({ createdAt: -1 }) // Sort by newest first
            .limit(50); // Limit results to 50

        res.json({
            success: true,
            count: feedback.length,
            data: feedback
        });
    } catch (error) {
        console.error('Error searching feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search feedback',
            error: error.message
        });
    }
});

/**
 * @route GET /api/feedback/:id
 * @desc Get single feedback by ID
 * @access Private/Admin
 */
router.get('/:id', async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        
        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        res.json({
            success: true,
            data: feedback
        });
    } catch (error) {
        console.error('Error getting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get feedback',
            error: error.message
        });
    }
});

/**
 * @route PATCH /api/feedback/:id/status
 * @desc Update feedback status
 * @access Private/Admin
 */
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'reviewed', 'archived'];
        
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status value. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const feedback = await Feedback.findByIdAndUpdate(
            req.params.id,
            { 
                status,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        );

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        res.json({
            success: true,
            message: 'Feedback status updated',
            data: feedback
        });
    } catch (error) {
        console.error('Error updating feedback status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update feedback status',
            error: error.message
        });
    }
});

/**
 * @route DELETE /api/feedback/:id
 * @desc Delete feedback
 * @access Private/Admin
 */
router.delete('/:id', async (req, res) => {
    try {
        const feedback = await Feedback.findByIdAndDelete(req.params.id);

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        // Delete associated evidence files
        if (feedback.evidence && feedback.evidence.length > 0) {
            feedback.evidence.forEach(file => {
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
            message: 'Feedback deleted successfully',
            data: feedback
        });
    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete feedback',
            error: error.message
        });
    }
});

export default router;