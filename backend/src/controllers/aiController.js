import * as geminiService from '../services/geminiService.js';

/**
 * Analyze a new problem
 */
export const analyzeProblem = async (req, res) => {
  try {
    const { title, url, description, userNotes } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Title and description are required',
      });
    }

    const result = await geminiService.analyzeProblem({
      title,
      url,
      description,
      userNotes,
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error in analyzeProblem controller:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Generate revision feedback
 */
export const getRevisionFeedback = async (req, res) => {
  try {
    const {
      title,
      topic,
      pattern,
      revisionCount,
      lastRevisionDate,
      previousMistakes,
      previousNotes,
      currentNotes,
    } = req.body;

    if (!title || !currentNotes) {
      return res.status(400).json({
        success: false,
        error: 'Title and current notes are required',
      });
    }

    const result = await geminiService.generateRevisionFeedback({
      title,
      topic,
      pattern,
      revisionCount,
      lastRevisionDate,
      previousMistakes,
      previousNotes,
      currentNotes,
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error in getRevisionFeedback controller:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Detect weak areas from all problems
 */
export const analyzeWeakAreas = async (req, res) => {
  try {
    const { problems } = req.body;

    if (!problems || !Array.isArray(problems) || problems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Problems array is required and must not be empty',
      });
    }

    const result = await geminiService.detectWeakAreas(problems);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error in analyzeWeakAreas controller:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Generate flashcards for a problem
 */
export const createFlashcards = async (req, res) => {
  try {
    const { problem } = req.body;

    if (!problem || !problem.title) {
      return res.status(400).json({
        success: false,
        error: 'Problem object with title is required',
      });
    }

    const result = await geminiService.generateFlashcards(problem);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error in createFlashcards controller:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
