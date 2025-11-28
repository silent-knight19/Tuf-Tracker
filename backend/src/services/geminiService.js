import { model, generationConfig, safetySettings } from '../config/gemini.config.js';

/**
 * Analyzes a DSA problem and extracts metadata using Gemini AI
 */
export const analyzeProblem = async ({ title, url, description, userNotes }) => {
  try {
    const prompt = `You are a diligent learning coach for DSA (Data Structures & Algorithms) practice.

Input:
- Problem title: ${title}
- URL: ${url || 'Not provided'}
- Description: ${description}
- Student's notes: ${userNotes || 'No notes provided'}

Tasks:
1. Identify the main Topic (e.g., Arrays, Strings, Dynamic Programming, Trees, Graphs, Linked Lists, Stacks, Queues, Heaps, Tries, Backtracking, Greedy, Sorting, Searching)
2. Identify the Pattern/Technique (e.g., Sliding Window, Two Pointer, Fast & Slow Pointers, Binary Search, BFS, DFS, Dynamic Programming, Recursion, Divide & Conquer, Backtracking, Greedy, Union Find)
3. Suggest Difficulty level (Easy, Medium, or Hard)
4. Provide a Subtopic if applicable (e.g., "Binary Tree Traversal" under Trees)
5. Extract or infer Company Tags from the URL or description (e.g., Google, Amazon, Microsoft, Facebook, Apple)
6. Provide 3-6 key takeaways that are specific to this problem
7. Identify potential mistakes or weak points from the student's notes (if any)
8. Provide 2-4 targeted improvement suggestions
9. Generate a concise revision hint (1-2 sentences) for future review
10. Suggest 2-3 similar or follow-up problems with brief descriptions

Return ONLY valid JSON (no markdown, no code blocks, just pure JSON):
{
  "topic": "string",
  "pattern": "string",
  "difficulty": "Easy|Medium|Hard",
  "subtopic": "string or null",
  "companyTags": ["array of strings"],
  "keyTakeaways": ["array of 3-6 strings"],
  "mistakes": ["array of strings, can be empty"],
  "improvementSuggestions": ["array of 2-4 strings"],
  "revisionHint": "string (concise reminder)",
  "relatedProblems": [
    {"title": "string", "description": "brief description"}
  ]
}`;

    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: [],
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean the response - remove markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const parsedResponse = JSON.parse(cleanedText);
    
    return {
      success: true,
      data: parsedResponse,
    };
  } catch (error) {
    console.error('Error analyzing problem:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Generates revision feedback for a problem
 */
export const generateRevisionFeedback = async ({ 
  title, 
  topic, 
  pattern, 
  revisionCount, 
  lastRevisionDate, 
  previousMistakes, 
  previousNotes,
  currentNotes 
}) => {
  try {
    const prompt = `You are reviewing a previously solved DSA problem for a student.

Problem Details:
- Title: ${title}
- Topic: ${topic}
- Pattern: ${pattern}
- Number of previous attempts: ${revisionCount}
- Last revision: ${lastRevisionDate || 'First time'}
- Previous mistakes: ${previousMistakes?.join(', ') || 'None recorded'}
- Previous notes: ${previousNotes || 'None'}

Current Revision Notes: ${currentNotes}

Generate updated revision feedback:
1. Updated revision hint (brief, actionable reminder for next time)
2. Corrective focus areas (what should the student focus on improving)
3. Progress assessment (is the student improving? be encouraging but honest)
4. Next steps (1-3 actionable recommendations)

Return ONLY valid JSON (no markdown, no code blocks):
{
  "updatedRevisionHint": "string",
  "focusAreas": ["array of 2-4 strings"],
  "progressAssessment": "string (2-3 sentences)",
  "nextSteps": ["array of 1-3 strings"]
}`;

    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: [],
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean the response
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const parsedResponse = JSON.parse(cleanedText);
    
    return {
      success: true,
      data: parsedResponse,
    };
  } catch (error) {
    console.error('Error generating revision feedback:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Analyzes all user's problems to detect weak areas
 */
export const detectWeakAreas = async (problems) => {
  try {
    const topicCount = {};
    const patternCount = {};
    const difficultyCount = { Easy: 0, Medium: 0, Hard: 0 };
    const mistakesByTopic = {};
    
    problems.forEach(problem => {
      // Count topics
      topicCount[problem.topic] = (topicCount[problem.topic] || 0) + 1;
      
      // Count patterns
      patternCount[problem.pattern] = (patternCount[problem.pattern] || 0) + 1;
      
      // Count difficulty
      if (problem.difficulty) {
        difficultyCount[problem.difficulty]++;
      }
      
      // Track mistakes by topic
      if (problem.mistakes && problem.mistakes.length > 0) {
        if (!mistakesByTopic[problem.topic]) {
          mistakesByTopic[problem.topic] = [];
        }
        mistakesByTopic[problem.topic].push(...problem.mistakes);
      }
    });

    const topicsData = Object.entries(topicCount).map(([topic, count]) => ({
      topic,
      count,
      mistakes: mistakesByTopic[topic]?.length || 0
    })).sort((a, b) => b.count - a.count);

    const patternsData = Object.entries(patternCount).map(([pattern, count]) => ({
      pattern,
      count
    })).sort((a, b) => b.count - a.count);

    const prompt = `You are analyzing a student's DSA problem-solving patterns.

Statistics:
- Total problems solved: ${problems.length}
- Topics practiced: ${JSON.stringify(topicsData)}
- Patterns practiced: ${JSON.stringify(patternsData)}
- Difficulty distribution: ${JSON.stringify(difficultyCount)}
- Mistakes by topic: ${JSON.stringify(mistakesByTopic)}

Based on this data, identify:
1. Weak areas (topics with low coverage or high mistake rates)
2. Strengths (topics with good coverage and low mistakes)
3. Recommended focus areas
4. Personalized improvement roadmap (5-7 actionable steps)

Return ONLY valid JSON (no markdown):
{
  "weakAreas": [{"topic": "string", "reason": "string"}],
  "strengths": [{"topic": "string", "reason": "string"}],
  "recommendedFocus": ["array of 3-5 strings"],
  "improvementRoadmap": [{"step": number, "action": "string", "why": "string"}]
}`;

    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: [],
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean the response
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const parsedResponse = JSON.parse(cleanedText);
    
    return {
      success: true,
      data: {
        ...parsedResponse,
        statistics: {
          total: problems.length,
          topicsData,
          patternsData,
          difficultyCount
        }
      },
    };
  } catch (error) {
    console.error('Error detecting weak areas:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Generates flashcards from a problem
 */
export const generateFlashcards = async (problem) => {
  try {
    const prompt = `Create study flashcards for this DSA problem:

Title: ${problem.title}
Topic: ${problem.topic}
Pattern: ${problem.pattern}
Key Takeaways: ${problem.keyTakeaways?.join(', ')}
Revision Hint: ${problem.revisionHint}

Generate 3-5 flashcards in this format:
- Front: A question or concept prompt
- Back: The answer or explanation

Return ONLY valid JSON (no markdown):
{
  "flashcards": [
    {"front": "string", "back": "string"}
  ]
}`;

    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: [],
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean the response
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const parsedResponse = JSON.parse(cleanedText);
    
    return {
      success: true,
      data: parsedResponse,
    };
  } catch (error) {
    console.error('Error generating flashcards:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
