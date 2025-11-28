
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../utils/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import { motion } from 'framer-motion';
import { TrendingUp, BookOpen, Flame, Target } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProblems: 0,
    thisWeek: 0,
    dueToday: 0,
    currentStreak: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    
    try {
      const questionsRef = collection(db, 'questions');
      const q = query(questionsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      let dueCount = 0;
      let weekCount = 0;
      const recent = [];

      snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        
        // Collect recent 5 items
        if (index < 5) {
          recent.push({ id: doc.id, ...data });
        }
        
        // Count problems added this week
        if (data.createdAt?.toDate() >= weekAgo) {
          weekCount++;
        }

        // Count problems due today
        if (data.nextRevisionDate) {
          const nextDate = data.nextRevisionDate.toDate ? data.nextRevisionDate.toDate() : new Date(data.nextRevisionDate);
          if (nextDate <= new Date()) {
            dueCount++;
          }
        }
      });

      setStats({
        totalProblems: snapshot.size,
        thisWeek: weekCount,
        dueToday: dueCount,
        currentStreak: 0, // TODO: Calculate actual streak
      });
      setRecentActivity(recent);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Problems',
      value: stats.totalProblems,
      icon: <BookOpen size={24} />,
      color: 'text-primary-400',
      bg: 'bg-primary-500/10',
      border: 'border-primary-500/20'
    },
    {
      label: 'This Week',
      value: stats.thisWeek,
      icon: <TrendingUp size={24} />,
      color: 'text-accent-teal',
      bg: 'bg-accent-teal/10',
      border: 'border-accent-teal/20'
    },
    {
      label: 'Due Today',
      value: stats.dueToday,
      icon: <Target size={24} />,
      color: 'text-accent-rose',
      bg: 'bg-accent-rose/10',
      border: 'border-accent-rose/20'
    },
    {
      label: 'Current Streak',
      value: stats.currentStreak,
      icon: <Flame size={24} />,
      color: 'text-accent-purple',
      bg: 'bg-accent-purple/10',
      border: 'border-accent-purple/20'
    },
  ];

  return (
    <div className="min-h-screen bg-dark-950 pb-20">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-dark-100 mb-2">Dashboard</h1>
          <p className="text-dark-400">Track your DSA learning journey</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((card, idx) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`glass-card p-6 hover:border-opacity-50 transition-all duration-300 group ${card.border}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform duration-300`}>
                      {card.icon}
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-dark-100 mb-1">{card.value}</div>
                  <div className="text-sm text-dark-400 font-medium">{card.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Recent Activity Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6"
            >
              <h2 className="text-xl font-bold text-dark-100 mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-primary-400" />
                Recent Activity
              </h2>
              
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((problem) => (
                    <div key={problem.id} className="flex items-center justify-between p-4 rounded-xl bg-dark-900/50 border border-dark-700/50 hover:border-dark-600 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className={`
                          w-2 h-2 rounded-full
                          ${problem.difficulty === 'Easy' ? 'bg-accent-mint' : 
                            problem.difficulty === 'Medium' ? 'bg-yellow-500' : 
                            'bg-accent-rose'}
                        `} />
                        <div>
                          <h3 className="font-medium text-dark-100 group-hover:text-primary-400 transition-colors">
                            {problem.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-dark-400 bg-dark-800 px-2 py-0.5 rounded-full border border-dark-700">
                              {problem.difficulty}
                            </span>
                            <span className="text-xs text-dark-500">
                              {problem.topic}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-dark-500 font-medium">
                        {problem.createdAt?.toDate().toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-dark-900/30 rounded-xl border border-dashed border-dark-700">
                  <p className="text-dark-400 mb-2">No activity yet</p>
                  <p className="text-sm text-dark-500">Start solving problems to see them here!</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
