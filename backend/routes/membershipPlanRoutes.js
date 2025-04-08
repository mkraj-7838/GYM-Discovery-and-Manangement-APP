import express from 'express';
import {
  createPlan,
  getUserPlans,
  getPlanById,
  updatePlan,
  deletePlan
} from '../controller/membershipPlanController.js';
import isAuthenticated from '../middlewares/isAuth.js';

const router = express.Router();

// Create a plan (protected route - user must be authenticated)
router.post('/', isAuthenticated, createPlan);

// Get all plans for the authenticated user
router.get('/', isAuthenticated, getUserPlans);

// Get a specific plan by ID (user must own the plan)
router.get('/:id', isAuthenticated, getPlanById);

// Update a plan (user must own the plan)
router.put('/:id', isAuthenticated, updatePlan);

// Delete a plan (user must own the plan)
router.delete('/:id', isAuthenticated, deletePlan);

export default router;