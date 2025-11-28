import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../utils/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import { Plus, Search, Code2, Zap, Filter, X } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalProblems: 0 });
  const [topicsData, setTopicsData] = useState([]);
  const [patternsData, setPatternsData] = useState([]);
  const [difficultyData, setDifficultyData] = useState([]);
  const [allProblems, setAllProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search filters
  const [searchFilters, setSearchFilters] = useState({
    topic: '',
    pattern: '',
    difficulty: ''
  });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    filterProblems();
  }, [searchFilters, allProblems]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      const questionsRef = collection(db, 'questions');
      const q = query(questionsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const topicCount = {};
      const patternCount = {};
      const difficultyCount = { Easy: 0, Medium: 0, Hard: 0 };
      const problems = [];

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        problems.push({ id: doc.id, ...data });
        
        // Count topics
        if (data.topic) {
          topicCount[data.topic] = (topicCount[data.topic] || 0) + 1;
        }

        // Count patterns
        if (data.pattern) {
          patternCount[data.pattern] = (patternCount[data.pattern] || 0) + 1;
        }

        // Count difficulty
        if (data.difficulty) {
          difficultyCount[data.difficulty]++;
        }
      });

      setStats({ totalProblems: snapshot.size });
      setAllProblems(problems);

      // Convert to arrays and sort
      const topicsArray = Object.entries(topicCount)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count);
      
      const patternsArray = Object.entries(patternCount)
        .map(([pattern, count]) => ({ pattern, count }))
        .sort((a, b) => b.count - a.count);

      const difficultyArray = [
        { name: 'Easy', value: difficultyCount.Easy, color: '#10b981' },
        { name: 'Medium', value: difficultyCount.Medium, color: '#f59e0b' },
        { name: 'Hard', value: difficultyCount.Hard, color: '#ef4444' },
      ].filter(item => item.value > 0);

      setTopicsData(topicsArray);
      setPatternsData(patternsArray);
      setDifficultyData(difficultyArray);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProblems = () => {
    if (!searchFilters.topic && !searchFilters.pattern && !searchFilters.difficulty) {
      setFilteredProblems([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const filtered = allProblems.filter(problem => {
      const matchesTopic = !searchFilters.topic || problem.topic === searchFilters.topic;
      const matchesPattern = !searchFilters.pattern || problem.pattern === searchFilters.pattern;
      const matchesDifficulty = !searchFilters.difficulty || problem.difficulty === searchFilters.difficulty;
      return matchesTopic && matchesPattern && matchesDifficulty;
    });

    setFilteredProblems(filtered);
  };

  const clearFilters = () => {
    setSearchFilters({ topic: '', pattern: '', difficulty: '' });
    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-dark-950 pb-16">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <h1 className="text-2xl font-bold text-dark-100 mb-1">Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!</h1>
          <p className="text-sm text-dark-400">Track your DSA learning journey</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Add Problem Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 border-2 border-dashed border-primary-500/30 hover:border-primary-500/50 transition-all duration-300 group cursor-pointer"
              onClick={() => navigate('/add-problem')}
            >
              <div className="flex items-center justify-center gap-4">
                <div className="bg-gradient-to-br from-primary-500 to-accent-purple p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Plus size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-dark-100 mb-1 group-hover:text-primary-400 transition-colors">Add New Problem</h2>
                  <p className="text-sm text-dark-400">Click to add and analyze a new DSA problem with AI</p>
                </div>
              </div>
            </motion.div>

            {/* Search Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Search size={20} className="text-primary-400" />
                <h2 className="text-lg font-bold text-dark-100">Search Problems</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                {/* Topic Filter */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Topic</label>
                  <select
                    value={searchFilters.topic}
                    onChange={(e) => setSearchFilters({ ...searchFilters, topic: e.target.value })}
                    className="input-field"
                  >
                    <option value="">All Topics</option>
                    {topicsData.map(item => (
                      <option key={item.topic} value={item.topic}>{item.topic}</option>
                    ))}
                  </select>
                </div>

                {/* Pattern Filter */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Pattern</label>
                  <select
                    value={searchFilters.pattern}
                    onChange={(e) => setSearchFilters({ ...searchFilters, pattern: e.target.value })}
                    className="input-field"
                  >
                    <option value="">All Patterns</option>
                    {patternsData.map(item => (
                      <option key={item.pattern} value={item.pattern}>{item.pattern}</option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Filter */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Difficulty</label>
                  <select
                    value={searchFilters.difficulty}
                    onChange={(e) => setSearchFilters({ ...searchFilters, difficulty: e.target.value })}
                    className="input-field"
                  >
                    <option value="">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {isSearching && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-sm text-dark-400 hover:text-primary-400 transition-colors"
                >
                  <X size={16} />
                  Clear filters
                </button>
              )}
            </motion.div>

            {/* Search Results */}
            <AnimatePresence>
              {isSearching && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="glass-card p-4"
                >
                  <h3 className="text-base font-bold text-dark-100 mb-3">
                    Search Results ({filteredProblems.length} {filteredProblems.length === 1 ? 'problem' : 'problems'})
                  </h3>

                  {filteredProblems.length > 0 ? (
                    <div className="space-y-3">
                      {filteredProblems.map((problem) => (
                        <div
                          key={problem.id}
                          className="p-4 rounded-xl bg-dark-900/50 border border-dark-700/50 hover:border-primary-500/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-medium text-dark-100 mb-2">{problem.title}</h4>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs px-2 py-1 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20">
                                  {problem.topic}
                                </span>
                                <span className="text-xs px-2 py-1 rounded-full bg-accent-purple/10 text-accent-purple border border-accent-purple/20">
                                  {problem.pattern}
                                </span>
                                <span className={`
                                  text-xs px-2 py-1 rounded-full
                                  ${problem.difficulty === 'Easy' ? 'bg-accent-mint/10 text-accent-mint border-accent-mint/20' :
                                    problem.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                    'bg-accent-rose/10 text-accent-rose border-accent-rose/20'} border
                                `}>
                                  {problem.difficulty}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs text-dark-500">
                              {problem.createdAt?.toDate().toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-dark-900/30 rounded-xl border border-dashed border-dark-700">
                      <p className="text-dark-400">No problems match your search criteria</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Difficulty Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-4"
            >
              <h2 className="text-base font-bold text-dark-100 mb-3">Difficulty Distribution</h2>
              
              {difficultyData.length > 0 ? (
                <div className="relative">
                  {/* Custom SVG Concentric Rings */}
                  <div className="flex items-center justify-center" style={{ height: '220px' }}>
                    <svg width="220" height="220" viewBox="0 0 220 220">
                      {/* Background circles */}
                      <circle
                        cx="110"
                        cy="110"
                        r="40"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.05)"
                        strokeWidth="12"
                      />
                      <circle
                        cx="110"
                        cy="110"
                        r="62"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.05)"
                        strokeWidth="12"
                      />
                      <circle
                        cx="110"
                        cy="110"
                        r="84"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.05)"
                        strokeWidth="12"
                      />
                      
                      {/* Hard - Innermost ring (Red) */}
                      <circle
                        cx="110"
                        cy="110"
                        r="40"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40 * ((difficultyData.find(d => d.name === 'Hard')?.value || 0) / Math.max(stats.totalProblems, 1))} ${2 * Math.PI * 40}`}
                        transform="rotate(-90 110 110)"
                        style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
                      />
                      
                      {/* Medium - Middle ring (Orange) */}
                      <circle
                        cx="110"
                        cy="110"
                        r="62"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 62 * ((difficultyData.find(d => d.name === 'Medium')?.value || 0) / Math.max(stats.totalProblems, 1))} ${2 * Math.PI * 62}`}
                        transform="rotate(-90 110 110)"
                        style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
                      />
                      
                      {/* Easy - Outermost ring (Green) */}
                      <circle
                        cx="110"
                        cy="110"
                        r="84"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 84 * ((difficultyData.find(d => d.name === 'Easy')?.value || 0) / Math.max(stats.totalProblems, 1))} ${2 * Math.PI * 84}`}
                        transform="rotate(-90 110 110)"
                        style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
                      />
                      
                      {/* Center text */}
                      <text
                        x="110"
                        y="105"
                        textAnchor="middle"
                        className="text-2xl font-bold fill-dark-100"
                        style={{ fontSize: '24px', fontWeight: 'bold' }}
                      >
                        {stats.totalProblems}
                      </text>
                      <text
                        x="110"
                        y="125"
                        textAnchor="middle"
                        className="text-xs fill-dark-400"
                        style={{ fontSize: '12px' }}
                      >
                        Total Problems
                      </text>
                    </svg>
                  </div>
                  
                  {/* Legend */}
                  <div className="mt-3 flex justify-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-accent-mint"></div>
                      <span className="text-sm text-dark-300">
                        Easy: {difficultyData.find(d => d.name === 'Easy')?.value || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-sm text-dark-300">
                        Medium: {difficultyData.find(d => d.name === 'Medium')?.value || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-accent-rose"></div>
                      <span className="text-sm text-dark-300">
                        Hard: {difficultyData.find(d => d.name === 'Hard')?.value || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-dark-900/30 rounded-xl border border-dashed border-dark-700">
                  <p className="text-dark-400">No data yet</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
