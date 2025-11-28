import axios from 'axios';
import { auth } from './firebaseConfig';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

/**
 * Analyze a problem using AI
 */
export const analyzeProblem = async (problemData) => {
  try {
    const response = await apiClient.post('/api/ai/analyze-problem', problemData);
    return response.data;
  } catch (error) {
    console.error('Error analyzing problem:', error);
    throw error;
  }
};

/**
 * Get revision feedback
 */
export const getRevisionFeedback = async (revisionData) => {
  try {
    const response = await apiClient.post('/api/ai/revision-feedback', revisionData);
    return response.data;
  } catch (error) {
    console.error('Error getting revision feedback:', error);
    throw error;
  }
};

/**
 * Analyze weak areas
 */
export const analyzeWeaknesses = async (problems) => {
  try {
    const response = await apiClient.post('/api/ai/analyze-weaknesses', { problems });
    return response.data;
  } catch (error) {
    console.error('Error analyzing weaknesses:', error);
    throw error;
  }
};

/**
 * Generate flashcards
 */
export const generateFlashcards = async (problem) => {
  try {
    const response = await apiClient.post('/api/ai/generate-flashcards', { problem });
    return response.data;
  } catch (error) {
    console.error('Error generating flashcards:', error);
    throw error;
  }
};

export default apiClient;
