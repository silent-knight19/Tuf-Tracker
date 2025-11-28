import { db } from '../config/firebase.config.js';
import admin from 'firebase-admin';
import * as geminiService from './geminiService.js';

/**
 * Get company requirements from Firestore cache
 */
export const getCompanyRequirements = async (companyName) => {
  try {
    const companyId = companyName.toLowerCase().replace(/\s+/g, '-');
    const docRef = db.collection('companyRequirements').doc(companyId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return {
        success: true,
        data: docSnap.data(),
        cached: true,
      };
    }

    return {
      success: false,
      cached: false,
    };
  } catch (error) {
    console.error('Error getting company requirements:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Store company requirements in Firestore
 */
export const storeCompanyRequirements = async (companyName, requirements) => {
  try {
    const companyId = companyName.toLowerCase().replace(/\s+/g, '-');
    const docRef = db.collection('companyRequirements').doc(companyId);

    const dataToStore = {
      companyName: requirements.companyName,
      requiredTopics: requirements.requiredTopics,
      requiredPatterns: requirements.requiredPatterns,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    };

    await docRef.set(dataToStore);

    return {
      success: true,
      data: dataToStore,
    };
  } catch (error) {
    console.error('Error storing company requirements:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Calculate readiness locally based on cached company requirements
 * Now uses solved counts to calculate coverage percentages
 */
export const calculateReadiness = (userTopics, userPatterns, companyRequirements) => {
  const COVERAGE_THRESHOLD = 75; // Percentage needed to mark as "covered"
  
  const getWeight = (importance) => {
    switch (importance) {
      case 'critical': return 3;
      case 'high': return 2;
      case 'medium': return 1;
      default: return 1;
    }
  };


  // Calculate topics coverage with percentages
  let topicsEarned = 0;
  let topicsTotal = 0;
  const topicsWithCoverage = companyRequirements.requiredTopics.map(topic => {
    const weight = getWeight(topic.importance);
    topicsTotal += weight;
    
    // Find user's solved count for this topic with fuzzy matching
    const normalizedTopicName = topic.name.toLowerCase().trim();
    const userTopic = userTopics.find(t => {
      const normalizedUserTopic = t.name.toLowerCase().trim();
      // Check if either name contains the other, or if they're exact matches
      const matches = normalizedUserTopic === normalizedTopicName ||
             normalizedUserTopic.includes(normalizedTopicName) ||
             normalizedTopicName.includes(normalizedUserTopic);
      
      if (matches) {
        console.log(`✅ Topic Match: "${t.name}" (${t.solvedCount} solved) → "${topic.name}"`);
      }
      
      return matches;
    });
    const solvedCount = userTopic ? userTopic.solvedCount : 0;
    
    console.log(`Topic: "${topic.name}" - Solved: ${solvedCount}`);
    
    // Calculate coverage percentage using practiceList length
    const totalRequired = topic.practiceList ? topic.practiceList.length : (topic.typicalQuestions || 15);
    const coveragePercent = totalRequired > 0 
      ? Math.min((solvedCount / totalRequired) * 100, 100)
      : 0;
    
    // Proportional credit based on coverage percentage
    const coverageFraction = coveragePercent / 100;
    topicsEarned += weight * coverageFraction;
    
    // Mark as covered if >= 75% threshold
    const covered = coveragePercent >= COVERAGE_THRESHOLD;
    
    return {
      ...topic,
      solvedCount,
      totalRequired,
      coveragePercent: Math.round(coveragePercent),
      covered
    };
  });

  // Calculate patterns coverage with percentages
  let patternsEarned = 0;
  let patternsTotal = 0;
  const patternsWithCoverage = companyRequirements.requiredPatterns.map(pattern => {
    const weight = getWeight(pattern.importance);
    patternsTotal += weight;
    
    // Find user's solved count for this pattern with fuzzy matching
    const normalizedPatternName = pattern.name.toLowerCase().trim();
    const userPattern = userPatterns.find(p => {
      const normalizedUserPattern = p.name.toLowerCase().trim();
      // Check if either name contains the other, or if they're exact matches
      return normalizedUserPattern === normalizedPatternName ||
             normalizedUserPattern.includes(normalizedPatternName) ||
             normalizedPatternName.includes(normalizedUserPattern);
    });
    const solvedCount = userPattern ? userPattern.solvedCount : 0;
    
    // Calculate total required using practiceList length or fallback to frequency-based calculation
    const totalRequired = pattern.practiceList 
      ? pattern.practiceList.length 
      : (pattern.typicalQuestions || Math.ceil((pattern.frequency || 75) / 5));
    
    // Calculate coverage percentage
    const coveragePercent = totalRequired > 0
      ? Math.min((solvedCount / totalRequired) * 100, 100)
      : 0;
    
    // Proportional credit based on coverage percentage
    const coverageFraction = coveragePercent / 100;
    patternsEarned += weight * coverageFraction;
    
    // Mark as covered if >= 75% threshold
    const covered = coveragePercent >= COVERAGE_THRESHOLD;
    
    return {
      ...pattern,
      solvedCount,
      totalRequired,
      coveragePercent: Math.round(coveragePercent),
      covered
    };
  });

  // Calculate overall readiness (proportional to coverage)
  const totalEarned = topicsEarned + patternsEarned;
  const totalPossible = topicsTotal + patternsTotal;
  const overallReadiness = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;

  // Generate recommendations based on low coverage items
  const recommendations = [];
  const lowCoverageCritical = topicsWithCoverage
    .filter(t => t.coveragePercent < COVERAGE_THRESHOLD && t.importance === 'critical')
    .sort((a, b) => a.coveragePercent - b.coveragePercent);
  const lowCoverageCriticalPatterns = patternsWithCoverage
    .filter(p => p.coveragePercent < COVERAGE_THRESHOLD && p.importance === 'critical')
    .sort((a, b) => a.coveragePercent - b.coveragePercent);

  if (lowCoverageCritical.length > 0) {
    const topGaps = lowCoverageCritical.slice(0, 3).map(t => 
      `${t.name} (${t.coveragePercent}%)`
    );
    recommendations.push(`Focus on critical topics: ${topGaps.join(', ')}`);
  }
  if (lowCoverageCriticalPatterns.length > 0) {
    const topGaps = lowCoverageCriticalPatterns.slice(0, 3).map(p => 
      `${p.name} (${p.coveragePercent}%)`
    );
    recommendations.push(`Master critical patterns: ${topGaps.join(', ')}`);
  }

  const lowCoverageHigh = topicsWithCoverage
    .filter(t => t.coveragePercent < COVERAGE_THRESHOLD && t.importance === 'high')
    .sort((a, b) => a.coveragePercent - b.coveragePercent)
    .slice(0, 2);
  const lowCoverageHighPatterns = patternsWithCoverage
    .filter(p => p.coveragePercent < COVERAGE_THRESHOLD && p.importance === 'high')
    .sort((a, b) => a.coveragePercent - b.coveragePercent)
    .slice(0, 2);

  if (lowCoverageHigh.length > 0) {
    recommendations.push(`Improve high-priority topics: ${lowCoverageHigh.map(t => `${t.name} (${t.coveragePercent}%)`).join(', ')}`);
  }
  if (lowCoverageHighPatterns.length > 0) {
    recommendations.push(`Work on high-priority patterns: ${lowCoverageHighPatterns.map(p => `${p.name} (${p.coveragePercent}%)`).join(', ')}`);
  }

  // Generate next steps based on lowest coverage
  const nextSteps = [];
  const allItems = [...topicsWithCoverage, ...patternsWithCoverage]
    .filter(item => item.coveragePercent < COVERAGE_THRESHOLD)
    .sort((a, b) => {
      // Sort by importance first, then by lowest coverage
      const weightDiff = getWeight(b.importance) - getWeight(a.importance);
      if (weightDiff !== 0) return weightDiff;
      return a.coveragePercent - b.coveragePercent;
    })
    .slice(0, 5);

  allItems.forEach((item, idx) => {
    const needed = item.typicalQuestions - item.solvedCount;
    nextSteps.push(
      `${idx + 1}. Solve ${needed} more ${item.name} problems (currently ${item.coveragePercent}% coverage)`
    );
  });

  return {
    companyName: companyRequirements.companyName,
    overallReadiness: Math.round(overallReadiness * 10) / 10,
    requiredTopics: topicsWithCoverage,
    requiredPatterns: patternsWithCoverage,
    recommendations: recommendations.length > 0 ? recommendations : ['Excellent coverage! Keep practicing to maintain your skills.'],
    nextSteps: nextSteps.length > 0 ? nextSteps : ['You have excellent coverage! Focus on consistency and advanced problems.'],
  };
};

/**
 * Get or create company requirements
 * First checks cache, then calls AI if not found
 */
export const getOrCreateCompanyRequirements = async (companyName, userTopics, userPatterns) => {
  try {
    // Try to get from cache first
    const cachedResult = await getCompanyRequirements(companyName);
    
    if (cachedResult.success && cachedResult.data) {
      // Calculate readiness locally using cached data
      const readiness = calculateReadiness(userTopics, userPatterns, cachedResult.data);
      return {
        success: true,
        data: readiness,
        cached: true,
      };
    }

    // Not in cache, call AI
    console.log(`Company ${companyName} not in cache, calling AI...`);
    const aiResult = await geminiService.analyzeCompanyReadiness({
      companyName,
      userTopics,
      userPatterns,
    });

    if (!aiResult.success) {
      return aiResult;
    }

    // Store in cache for future use
    await storeCompanyRequirements(companyName, aiResult.data);

    return {
      success: true,
      data: aiResult.data,
      cached: false,
    };
  } catch (error) {
    console.error('Error in getOrCreateCompanyRequirements:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Initialize default companies (Microsoft, Google, Amazon, Meta)
 * This should be called once during setup
 */
/**
 * Initialize default companies (Microsoft, Google, Amazon, Meta)
 * Uses static data to avoid API calls and ensure high quality example questions
 */
export const initializeDefaultCompanies = async (staticData = null) => {
  const defaultCompanies = ['Microsoft', 'Google', 'Amazon', 'Meta'];
  const results = [];

  console.log('Initializing default companies...');

  for (const company of defaultCompanies) {
    try {
      let dataToStore;

      // Use static data if provided
      if (staticData && staticData[company]) {
        console.log(`Using static data for ${company}...`);
        dataToStore = staticData[company];
      } else {
        // Fallback to AI if no static data (shouldn't happen with current script)
        console.log(`Calling AI for ${company}...`);
        const aiResult = await geminiService.analyzeCompanyReadiness({
          companyName: company,
          userTopics: [],
          userPatterns: [],
        });
        
        if (!aiResult.success) {
          console.error(`Failed to initialize ${company}:`, aiResult.error);
          results.push({ company, status: 'failed', error: aiResult.error });
          continue;
        }
        dataToStore = aiResult.data;
      }

      // Always update/overwrite to ensure we get the latest data (including example questions)
      await storeCompanyRequirements(company, dataToStore);
      console.log(`${company} initialized/updated successfully`);
      results.push({ company, status: 'updated' });

      // Add small delay only if using AI
      if (!staticData) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Error initializing ${company}:`, error);
      results.push({ company, status: 'error', error: error.message });
    }
  }

  return {
    success: true,
    results,
  };
};
