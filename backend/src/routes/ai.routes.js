import express from 'express';
import * as aiController from '../controllers/aiController.js';

const router = express.Router();

// Analyze a new problem
router.post('/analyze-problem', aiController.analyzeProblem);

// Generate revision feedback
router.post('/revision-feedback', aiController.getRevisionFeedback);

// Detect weak areas
router.post('/analyze-weaknesses', aiController.analyzeWeakAreas);

// Generate flashcards
router.post('/generate-flashcards', aiController.createFlashcards);

export default router;
