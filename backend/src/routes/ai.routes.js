import express from 'express';
import * as aiController from '../controllers/aiController.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifyToken);

// Analyze a new problem
router.post('/analyze-problem', aiController.analyzeProblem);

// Generate revision feedback
router.post('/revision-feedback', aiController.getRevisionFeedback);

// Detect weak areas
router.post('/analyze-weaknesses', aiController.analyzeWeakAreas);

// Generate flashcards
router.post('/generate-flashcards', aiController.createFlashcards);

export default router;
