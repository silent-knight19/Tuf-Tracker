import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../utils/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import { ChevronDown, Code2, Zap, TrendingUp, Search, Building2, CheckCircle2, Loader2, Target, Award, Flame, Sparkles } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// List of major companies with colors
const MAJOR_COMPANIES = [
  { name: 'Microsoft', logo: '/ms.png', color: 'from-blue-500 to-blue-600', textColor: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  { name: 'Google', logo: '/google-logo.webp', color: 'from-red-500 via-yellow-500 to-green-500', textColor: 'text-green-400', bgColor: 'bg-green-500/10' },
  { name: 'Amazon', logo: '/amazon.jpg', color: 'from-orange-500 to-orange-600', textColor: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  { name: 'Meta', logo: '/meta-logo.png', color: 'from-purple-500 to-pink-500', textColor: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  { name: 'Apple', logo: '/apple.png', color: 'from-gray-500 to-gray-600', textColor: 'text-gray-400', bgColor: 'bg-gray-500/10' },
  { name: 'Netflix', logo: '/netflix.png', color: 'from-red-600 to-red-700', textColor: 'text-red-400', bgColor: 'bg-red-500/10' },
];

export default function ProgressPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [topicsData, setTopicsData] = useState([]);
  const [patternsData, setPatternsData] = useState([]);
  
  // Company Readiness State
  const [selectedCompany, setSelectedCompany] = useState('Microsoft');
  const [readinessData, setReadinessData] = useState(null);
  const [readinessLoading, setReadinessLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Set up real-time listener
    const questionsRef = collection(db, 'questions');
    const q = query(questionsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const topicMap = {};
      const patternMap = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const problem = { id: doc.id, ...data };

        if (data.topic) {
          if (!topicMap[data.topic]) {
            topicMap[data.topic] = { name: data.topic, count: 0, problems: [] };
          }
          topicMap[data.topic].count++;
          topicMap[data.topic].problems.push(problem);
        }

        if (data.pattern) {
          if (!patternMap[data.pattern]) {
            patternMap[data.pattern] = { name: data.pattern, count: 0, problems: [] };
          }
          patternMap[data.pattern].count++;
          patternMap[data.pattern].problems.push(problem);
        }
      });

      setTopicsData(Object.values(topicMap).sort((a, b) => b.count - a.count));
      setPatternsData(Object.values(patternMap).sort((a, b) => b.count - a.count));
      setLoading(false);
    }, (error) => {
      console.error('Error loading progress data:', error);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (topicsData.length > 0 && patternsData.length > 0 && selectedCompany) {
      fetchCompanyReadiness();
    }
  }, [selectedCompany, topicsData, patternsData]);

  const fetchCompanyReadiness = async () => {
    setReadinessLoading(true);
    try {
      const userTopics = topicsData.map(t => ({
        name: t.name,
        solvedCount: t.count
      }));
      const userPatterns = patternsData.map(p => ({
        name: p.name,
        solvedCount: p.count
      }));

      const token = await user.getIdToken();
      const response = await axios.post(
        `${API_URL}/api/ai/company-readiness`,
        { companyName: selectedCompany, userTopics, userPatterns },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setReadinessData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching company readiness:', error);
    } finally {
      setReadinessLoading(false);
    }
  };

  const getCoverageColor = (percent) => {
    if (percent >= 75) return 'text-green-400';
    if (percent >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProgressBarColor = (percent) => {
    if (percent >= 75) return 'from-green-500 to-emerald-500';
    if (percent >= 50) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  const selectedCompanyData = MAJOR_COMPANIES.find(c => c.name === selectedCompany);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <Loader2 className="w-8 h-8 text-accent-purple animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 pb-12">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Interview Readiness</h1>
              <p className="text-dark-400 text-sm">Track your progress towards your dream company</p>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column - General Progress (30%) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-4 space-y-6"
          >
            <div className="bg-dark-800/30 backdrop-blur-sm border border-dark-700/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Your Progress</h2>
                  <p className="text-dark-400 text-xs">All solved problems</p>
                </div>
              </div>

              {/* All Topics */}
              <div className="mb-8">
                <h3 className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Code2 size={14} />
                  All Topics
                </h3>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {topicsData.map((topic, idx) => (
                    <SidebarSection
                      key={idx}
                      title={topic.name}
                      count={topic.count}
                      icon={<Code2 size={14} className="text-blue-400" />}
                      iconBg="bg-blue-500/10"
                      problems={topic.problems}
                    />
                  ))}
                  {topicsData.length === 0 && (
                    <div className="text-center py-8 text-dark-400 text-xs">
                      No topics practiced yet.
                    </div>
                  )}
                </div>
              </div>

              {/* All Patterns */}
              <div>
                <h3 className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Zap size={14} />
                  All Patterns
                </h3>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {patternsData.map((pattern, idx) => (
                    <SidebarSection
                      key={idx}
                      title={pattern.name}
                      count={pattern.count}
                      icon={<Zap size={14} className="text-purple-400" />}
                      iconBg="bg-purple-500/10"
                      problems={pattern.problems}
                    />
                  ))}
                  {patternsData.length === 0 && (
                    <div className="text-center py-8 text-dark-400 text-xs">
                      No patterns practiced yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Company Readiness (70%) */}
          <div className="lg:col-span-8">
            {/* Company Selector Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <h2 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Building2 size={16} />
                Select Company
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {MAJOR_COMPANIES.map((company, idx) => (
                  <motion.button
                    key={company.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setSelectedCompany(company.name)}
                    className={`relative group overflow-hidden rounded-xl p-4 transition-all duration-300 ${
                      selectedCompany === company.name
                        ? `bg-gradient-to-br ${company.color} shadow-lg shadow-${company.name.toLowerCase()}/20 scale-105`
                        : 'bg-dark-800/50 hover:bg-dark-800 border border-dark-700/50'
                    }`}
                  >
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-12 h-12 mb-3 rounded-full bg-white p-2 flex items-center justify-center shadow-md">
                        <img 
                          src={company.logo} 
                          alt={company.name} 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className={`text-sm font-semibold ${selectedCompany === company.name ? 'text-white' : 'text-dark-300'}`}>
                        {company.name}
                      </div>
                    </div>
                    {selectedCompany === company.name && (
                      <motion.div
                        layoutId="companySelector"
                        className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Custom Company Search */}
              <div className="mt-6">
                <div className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
                  Or search for any company
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., Uber, Stripe, Airbnb..."
                    value={selectedCompany && !MAJOR_COMPANIES.find(c => c.name === selectedCompany) ? selectedCompany : ''}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="flex-1 bg-dark-800/50 border border-dark-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-accent-purple/50 focus:ring-2 focus:ring-accent-purple/20 transition-all"
                  />
                  <button
                    onClick={() => {
                      if (selectedCompany && selectedCompany.trim()) {
                        fetchCompanyReadiness();
                      }
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-accent-purple to-accent-blue text-white rounded-lg font-medium hover:shadow-lg hover:shadow-accent-purple/20 transition-all flex items-center gap-2"
                  >
                    <Search size={16} />
                    Search
                  </button>
                </div>
              </div>
            </motion.div>


            {readinessLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-accent-purple animate-spin" />
              </div>
            ) : readinessData ? (
              <>
                {/* Readiness Score - Large Circular Display */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-8"
                >
                  <div className={`relative rounded-2xl p-8 bg-gradient-to-br ${selectedCompanyData.color} shadow-2xl overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-20 translate-x-20 blur-3xl" />
                    
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <Award className="w-8 h-8 text-white" />
                          <div>
                            <h3 className="text-2xl font-bold text-white">Interview Readiness</h3>
                            <p className="text-white/80 text-sm">for {selectedCompany}</p>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <div className="text-6xl font-bold text-white mb-2">
                            {readinessData.overallReadiness}%
                          </div>
                          <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${readinessData.overallReadiness}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full bg-white rounded-full shadow-lg"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-white/90 text-sm">
                          <Sparkles size={16} />
                          <span>Keep solving to increase your readiness score!</span>
                        </div>
                      </div>

                      {/* Circular Progress Indicator on the right */}
                      <div className="hidden lg:block">
                        <CircularProgress percent={readinessData.overallReadiness} />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Topics and Patterns Grid */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Required Topics */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <Code2 className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white">Required Topics</h3>
                          <p className="text-xs text-dark-400">{readinessData.requiredTopics?.length || 0} topics to master</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {readinessData.requiredTopics?.map((topic, idx) => {
                          // Fuzzy match to find user's solved problems for this topic
                          const normalizedTopicName = topic.name.toLowerCase().trim();
                          const matchedUserTopic = topicsData.find(t => {
                            const normalizedUserTopic = t.name.toLowerCase().trim();
                            return normalizedUserTopic === normalizedTopicName ||
                                   normalizedUserTopic.includes(normalizedTopicName) ||
                                   normalizedTopicName.includes(normalizedUserTopic);
                          });
                          
                          return (
                            <TopicCard
                              key={`topic-${idx}`}
                              item={topic}
                              type="topic"
                              userProblems={matchedUserTopic?.problems || []}
                              delay={idx * 0.05}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>

                  {/* Required Patterns */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white">Required Patterns</h3>
                          <p className="text-xs text-dark-400">{readinessData.requiredPatterns?.length || 0} patterns to master</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {readinessData.requiredPatterns?.map((pattern, idx) => {
                          // Fuzzy match to find user's solved problems for this pattern
                          const normalizedPatternName = pattern.name.toLowerCase().trim();
                          const matchedUserPattern = patternsData.find(p => {
                            const normalizedUserPattern = p.name.toLowerCase().trim();
                            return normalizedUserPattern === normalizedPatternName ||
                                   normalizedUserPattern.includes(normalizedPatternName) ||
                                   normalizedPatternName.includes(normalizedUserPattern);
                          });
                          
                          return (
                            <TopicCard
                              key={`pattern-${idx}`}
                              item={pattern}
                              type="pattern"
                              userProblems={matchedUserPattern?.problems || []}
                              delay={idx * 0.05}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* AI Recommendations */}
                {readinessData.recommendations && readinessData.recommendations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-6 bg-gradient-to-r from-accent-purple/10 to-accent-blue/10 border border-accent-purple/20 rounded-xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Flame className="w-6 h-6 text-accent-purple" />
                      <h3 className="text-lg font-semibold text-white">AI Recommendations</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {readinessData.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-sm text-dark-300">
                          <CheckCircle2 size={16} className="text-accent-purple mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// Circular Progress Component
function CircularProgress({ percent }) {
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-white/10"
        />
        <circle
          cx="64"
          cy="64"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-white transition-all duration-1000 ease-out"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-2xl font-bold text-white">{percent}%</span>
        <span className="text-[10px] text-white/60 uppercase tracking-wider">Ready</span>
      </div>
    </div>
  );
}

function TopicCard({ item, type, userProblems, delay }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const solvedCount = userProblems.length;
  
  // Use the totalRequired from backend, or practiceList length, or fallback
  const totalRequired = item.totalRequired || (item.practiceList ? item.practiceList.length : 15);
  const percent = Math.min(Math.round((solvedCount / totalRequired) * 100), 100);
  
  const getProgressColor = (p) => {
    if (p >= 75) return 'bg-green-500';
    if (p >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = (p) => {
    if (p >= 75) return 'text-green-400';
    if (p >= 50) return 'text-yellow-400';
    if (p >= 25) return 'text-orange-400'; // Added for better granularity
    return 'text-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-dark-900/50 rounded-lg border border-dark-700/30 overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-dark-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${type === 'topic' ? 'bg-blue-500/10' : 'bg-purple-500/10'} flex items-center justify-center`}>
            {type === 'topic' ? (
              <Code2 size={14} className={type === 'topic' ? 'text-blue-400' : 'text-purple-400'} />
            ) : (
              <Zap size={14} className={type === 'topic' ? 'text-blue-400' : 'text-purple-400'} />
            )}
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-white">{item.name}</div>
            <div className="text-xs text-dark-400">
              {solvedCount}/{totalRequired} solved
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className={`text-sm font-bold ${getTextColor(percent)}`}>{percent}%</div>
          </div>
          <ChevronDown 
            size={16} 
            className={`text-dark-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
      
      {/* Progress Bar */}
      <div className="h-1 bg-dark-800 w-full">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${getProgressColor(percent)}`}
        />
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-dark-950/30"
          >
            <div className="p-3 space-y-2">
              {/* Strategy Note */}
              <div className="p-2 rounded bg-blue-500/5 border border-blue-500/10 text-xs text-blue-300/80 mb-3">
                <span className="font-semibold text-blue-400">Strategy:</span> Focus on mastering the core patterns. 
                {percent < 50 ? " Start with easy problems to build intuition." : " Move to medium/hard problems to solidify your understanding."}
              </div>

              {/* Must Do Problems List */}
              <div className="space-y-1">
                <div className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Flame size={12} className="text-orange-400" />
                  Must-Do Problems
                </div>
                
                {item.practiceList && item.practiceList.length > 0 ? (
                  item.practiceList.map((problemName, idx) => {
                    // Normalize both strings for better matching
                    const normalizedProblemName = problemName.toLowerCase().trim();
                    const isSolved = userProblems.some(p => {
                      const normalizedUserTitle = p.title.toLowerCase().trim();
                      // Check for exact match or if one contains the other
                      return normalizedUserTitle === normalizedProblemName ||
                             normalizedUserTitle.includes(normalizedProblemName) ||
                             normalizedProblemName.includes(normalizedUserTitle);
                    });
                    return (
                      <div key={idx} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-dark-800/30 transition-colors group">
                        <span className={`text-xs ${isSolved ? 'text-dark-400 line-through' : 'text-dark-200 group-hover:text-white transition-colors'}`}>
                          {problemName}
                        </span>
                        {isSolved ? (
                          <CheckCircle2 size={12} className="text-green-500" />
                        ) : (
                          <div className="w-3 h-3 rounded-full border border-dark-600 group-hover:border-dark-400 transition-colors" />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-dark-500 italic px-2">No specific practice list available.</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SidebarSection({ title, count, icon, iconBg, problems }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-dark-900/50 rounded-lg border border-dark-700/30 overflow-hidden transition-all duration-200 hover:border-dark-600">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-dark-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
            {icon}
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-white">{title}</div>
            <div className="text-xs text-dark-400">{count} solved</div>
          </div>
        </div>
        <ChevronDown 
          size={14} 
          className={`text-dark-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-dark-950/30 border-t border-dark-700/30"
          >
            <div className="p-2 space-y-2">
              {problems.map((problem, idx) => (
                <ProblemCard key={problem.id || idx} problem={problem} index={idx} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProblemCard({ problem, index }) {
  // Format date if available
  const dateStr = problem.createdAt?.toDate 
    ? problem.createdAt.toDate().toLocaleDateString() 
    : new Date().toLocaleDateString();

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-dark-800/40 p-2.5 rounded-lg border border-dark-700/30 hover:bg-dark-800/60 transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-medium text-white mb-1.5 truncate group-hover:text-accent-blue transition-colors">
            {problem.title}
          </h4>
          
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            <Badge color={getDifficultyColor(problem.difficulty)}>
              {problem.difficulty}
            </Badge>
            {problem.revisionCount > 0 && (
              <span className="text-[10px] text-dark-400 bg-dark-800 px-1.5 py-0.5 rounded border border-dark-700">
                Rev: {problem.revisionCount}
              </span>
            )}
          </div>

          {problem.revisionHint && (
            <p className="text-[10px] text-dark-400 line-clamp-1 mb-1">
              💡 {problem.revisionHint}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Badge({ color, children }) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${colors[color] || colors.blue}`}>
      {children}
    </span>
  );
}

function getDifficultyColor(difficulty) {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return 'green';
    case 'medium': return 'yellow';
    case 'hard': return 'red';
    default: return 'blue';
  }
}
