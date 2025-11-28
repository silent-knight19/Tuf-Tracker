import { model, generationConfig, safetySettings } from '../config/gemini.config.js';

/**
 * Analyzes a DSA problem and extracts metadata using Gemini AI
 */
export const analyzeProblem = async ({ title, url, description, userNotes }) => {
  try {
    const prompt = `You are a diligent learning coach for DSA (Data Structures & Algorithms) practice with expertise in pattern-based problem solving.

Input:
- Problem title: ${title}
- URL: ${url || 'Not provided'}
- Description: ${description}
- Student's notes: ${userNotes || 'No notes provided'}

CRITICAL INSTRUCTION FOR PATTERN CLASSIFICATION:
Before assigning a pattern to this problem, you MUST mentally cross-reference how this problem is categorized on authoritative DSA learning platforms:
- GeeksforGeeks (GFG)
- Striver's TakeUForward (TUF)
- LeetCode Patterns
- HackerRank
- NeetCode
- AlgoExpert

Use your knowledge of how these platforms categorize similar problems. The pattern you assign should align with the consensus classification from these sources. If the problem appears in multiple pattern categories on these platforms, choose the PRIMARY pattern that best represents the core technique needed to solve it.

Common Pattern Categories (use these standardized names):
- Sliding Window
- Two Pointers
- Fast & Slow Pointers
- Merge Intervals
- Cyclic Sort
- In-place Reversal of LinkedList
- Binary Search
- Tree BFS (Breadth First Search)
- Tree DFS (Depth Search)
- Graph BFS
- Graph DFS
- Topological Sort
- Dynamic Programming (DP)
- 0/1 Knapsack (DP)
- Unbounded Knapsack (DP)
- Fibonacci Numbers (DP)
- Palindromic Subsequence (DP)
- Longest Common Substring (DP)
- Backtracking
- Greedy
- Divide & Conquer
- Union Find (Disjoint Set)
- Trie
- Monotonic Stack
- Heap / Priority Queue
- Bit Manipulation
- Math & Geometry

Tasks:
1. Identify the main Topic (e.g., Arrays, Strings, Dynamic Programming, Trees, Graphs, Linked Lists, Stacks, Queues, Heaps, Tries, Backtracking, Greedy, Sorting, Searching)
2. **CAREFULLY** Identify the Pattern/Technique using the standardized names above, cross-referencing with how GFG, Striver's TUF, LeetCode, HackerRank, and NeetCode would categorize this problem
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
  "pattern": "string (use standardized pattern name from the list above)",
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

/**
 * Analyzes company-specific readiness based on user's progress
 */
export const analyzeCompanyReadiness = async ({ companyName, userTopics, userPatterns }) => {
  try {
    const prompt = `You are an expert technical interviewer with deep knowledge of Data Structures and Algorithms interview patterns across major tech companies.

TASK: Analyze the provided company and calculate how ready the candidate is for their interview.

INPUT:
- Company Name: ${companyName}
- User's Covered Topics: ${JSON.stringify(userTopics)}
- User's Covered Patterns: ${JSON.stringify(userPatterns)}

COMPANY-SPECIFIC ANALYSIS GUIDELINES:

For MICROSOFT (SDE-1/Fresher):
- Critical Topics: Arrays, Strings, Trees, Linked Lists, Hash Tables
- High Priority: Graphs, Dynamic Programming, Stacks/Queues
- Medium Priority: Heaps, Tries, Backtracking
- Critical Patterns: Two Pointers, Sliding Window, DFS/BFS, Tree Traversals
- High Priority: Backtracking, Dynamic Programming, Binary Search
- Medium Priority: Greedy, Graph Algorithms
- Difficulty Mix: 60% Medium, 30% Easy, 10% Hard

For GOOGLE (L3/Entry Level):
- Critical Topics: Arrays, Graphs, Trees, Dynamic Programming
- High Priority: Strings, Hash Tables, Heaps
- Medium Priority: Tries, Backtracking, Math
- Critical Patterns: DFS/BFS, Dynamic Programming, Graph Algorithms
- High Priority: Greedy, Tree Traversals, Binary Search
- Medium Priority: Sliding Window, Two Pointers, Combinatorics
- Difficulty Mix: 70% Medium, 20% Hard, 10% Easy

For AMAZON (SDE-1):
- Critical Topics: Arrays, Strings, Trees, Hash Tables
- High Priority: Linked Lists, Stacks/Queues, Graphs
- Medium Priority: Dynamic Programming, Heaps, Tries
- Critical Patterns: Two Pointers, Hash Map Operations, Tree Traversals
- High Priority: DFS/BFS, Sliding Window, Binary Search
- Medium Priority: Dynamic Programming, Greedy
- Difficulty Mix: 50% Medium, 40% Easy, 10% Hard

For META (E3/Entry):
- Critical Topics: Arrays, Graphs, Trees, Dynamic Programming
- High Priority: Strings, Hash Tables, Stacks/Queues
- Medium Priority: Linked Lists, Heaps, Backtracking
- Critical Patterns: BFS/DFS, Dynamic Programming, Graph Traversals
- High Priority: Tree Traversals, Hash Map Operations, Two Pointers
- Medium Priority: Sliding Window, Greedy, Binary Search
- Difficulty Mix: 65% Medium, 25% Hard, 10% Easy

For OTHER COMPANIES:
Base your analysis on general FAANG-level standards with balanced coverage across core DSA topics and patterns.

CALCULATION LOGIC:
1. For Topics:
   - Critical topics covered = 3 points each
   - High priority topics covered = 2 points each
   - Medium priority topics covered = 1 point each
2. For Patterns:
   - Critical patterns covered = 3 points each
   - High priority patterns covered = 2 points each
   - Medium priority patterns covered = 1 point each
3. Overall Readiness = (Total Points Earned / Total Possible Points) * 100

REQUIRED OUTPUT (JSON format only, no markdown):
{
  "companyName": "string",
  "overallReadiness": number (0-100, rounded to 1 decimal),
  "requiredTopics": [
    {
      "name": "Topic Name (e.g., Arrays, DP)",
      "importance": "critical" | "high" | "medium",
      "typicalQuestions": number (e.g., 15),
      "practiceList": [
        "Problem Title 1",
        "Problem Title 2",
        "Problem Title 3",
        "Problem Title 4",
        "Problem Title 5",
        "Problem Title 6",
        "Problem Title 7",
        "Problem Title 8",
        "Problem Title 9",
        "Problem Title 10"
      ]
    }
  ],
  "requiredPatterns": [
    {
      "name": "Pattern Name (e.g., Sliding Window)",
      "importance": "critical" | "high" | "medium",
      "frequency": number (0-100),
      "practiceList": [
        "Problem Title 1",
        "Problem Title 2",
        "Problem Title 3",
        "Problem Title 4",
        "Problem Title 5"
      ]
    }
  ],
  "recommendations": [
    "string - specific, actionable advice based on what's missing"
  ],
  "nextSteps": [
    "string - ordered list of 3-5 immediate actions to improve readiness"
  ]
}

Analyze the interview patterns for ${companyName} and provide a comprehensive readiness assessment.

For each required topic and pattern, provide a "practiceList" of 10-15 specific, well-known problem titles (like "Two Sum", "Merge Intervals", "Climbing Stairs") that are highly relevant to ${companyName}.
These problems should form a "Must Do" list that covers the essential logic and patterns for that topic at this company.

Return the response in this exact JSON format. For practiceList, provide real, well-known problem titles that are commonly asked in interviews at ${companyName}. These should be specific problems from LeetCode, GeeksforGeeks, or similar platforms that candidates can search for and practice.

Be accurate, specific, and base your analysis on well-known interview patterns for ${companyName}. Ensure all JSON is properly formatted.`;

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
    console.error('Error analyzing company readiness:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

