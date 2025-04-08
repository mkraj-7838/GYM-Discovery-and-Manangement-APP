import MembershipPlan from '../models/MembershipPlan.js';
import asyncHandler from 'express-async-handler';
import { body, validationResult } from 'express-validator';

// @desc    Create a new membership plan
// @route   POST /api/membership-plans
// @access  Private
// Update the createPlan validation
export const createPlan = [
  body('name').trim().notEmpty().withMessage('Plan name is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('features.*.name').notEmpty().withMessage('Feature name is required'),
  body('icon').optional().trim(),
  body('color').optional().trim().matches(/^#([0-9a-f]{3}){1,2}$/i).withMessage('Color must be a valid hex code'),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, price, features, icon, color } = req.body;

    // Check if plan name already exists for this user
    const existingPlan = await MembershipPlan.findOne({ 
      name, 
      userId: req.user._id 
    });

    if (existingPlan) {
      return res.status(400).json({
        success: false,
        error: 'You already have a plan with this name'
      });
    }

    const plan = new MembershipPlan({
      name,
      price,
      features,
      icon: icon || 'star', // Set default if not provided
      color: color || '#000000',    // Set default if not provided
      userId: req.user._id
    });

    const createdPlan = await plan.save();
    res.status(201).json({ 
      success: true, 
      data: createdPlan 
    });
  })
];

// @desc    Get all plans for the authenticated user
// @route   GET /api/membership-plans
// @access  Private
export const getUserPlans = asyncHandler(async (req, res) => {
  const plans = await MembershipPlan.find({ userId: req.user._id });
  res.json({ 
    success: true, 
    data: plans 
  });
});

// @desc    Get single plan by ID
// @route   GET /api/membership-plans/:id
// @access  Private
export const getPlanById = asyncHandler(async (req, res) => {
  const plan = await MembershipPlan.findOne({ 
    _id: req.params.id, 
    userId: req.user._id 
  });

  if (!plan) {
    return res.status(404).json({ 
      success: false, 
      error: 'Plan not found or unauthorized' 
    });
  }

  res.json({ 
    success: true, 
    data: plan 
  });
});

// @desc    Update a plan
// @route   PUT /api/membership-plans/:id
// @access  Private
// Update the updatePlan validation and logic
export const updatePlan = [
  body('name').optional().trim().notEmpty().withMessage('Plan name cannot be empty'),
  body('price').optional().isNumeric().withMessage('Price must be a number'),
  body('features').optional().isArray().withMessage('Features must be an array'),
  body('icon').optional().trim(),
  body('color').optional().trim().matches(/^#([0-9a-f]{3}){1,2}$/i).withMessage('Color must be a valid hex code'),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, price, features, icon, color } = req.body;
    
    const plan = await MembershipPlan.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        error: 'Plan not found or unauthorized' 
      });
    }

    // Check if new name conflicts with existing plans
    if (name && name !== plan.name) {
      const existingPlan = await MembershipPlan.findOne({ 
        name, 
        userId: req.user._id 
      });
      
      if (existingPlan) {
        return res.status(400).json({
          success: false,
          error: 'You already have a plan with this name'
        });
      }
    }

    // Update plan fields
    if (name) plan.name = name;
    if (price) plan.price = price;
    if (features) plan.features = features;
    if (icon) plan.icon = icon;
    if (color) plan.color = color;

    const updatedPlan = await plan.save();
    res.json({ 
      success: true, 
      data: updatedPlan 
    });
  })
];

// @desc    Delete a plan
// @route   DELETE /api/membership-plans/:id
// @access  Private
export const deletePlan = asyncHandler(async (req, res) => {
  const plan = await MembershipPlan.findOneAndDelete({ 
    _id: req.params.id, 
    userId: req.user._id 
  });

  if (!plan) {
    return res.status(404).json({ 
      success: false, 
      error: 'Plan not found or unauthorized' 
    });
  }

  res.json({ 
    success: true, 
    data: {},
    message: 'Plan deleted successfully'
  });
});