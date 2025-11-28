import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      const questionsRef = collection(db, 'questions');
      const q = query(questionsRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      let dueCount = 0;
      let weekCount = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        
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
      icon: <BookOpen />,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'This Week',
      value: stats.thisWeek,
      icon: <TrendingUp />,
      color: 'from-green-500 to-emerald-500',
    },
    {
      label: 'Due Today',
      value: stats.dueToday,
      icon: <Target />,
      color: 'from-orange-500 to-red-500',
    },
    {
      label: 'Current Streak',
      value: stats.currentStreak,
      icon: <Flame />,
      color: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-400">Track your DSA learning journey</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card, idx) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card p-6 hover:scale-105 transition-transform cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${card.color}`}>
                    {card.icon}
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">{card.value}</div>
                <div className="text-sm text-gray-400">{card.label}</div>
              </motion.div>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 glass-card p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <div className="space-y-3 text-gray-300">
            <p>👋 Welcome to Tuf-Tracker, your AI-powered DSA learning companion!</p>
            <ul className="space-y-2 ml-4">
              <li>• Click <span className="text-primary-400 font-semibold">"Add Problem"</span> to log your first DSA problem</li>
              <li>• AI will automatically categorize it and provide personalized insights</li>
              <li>• Check <span className="text-primary-400 font-semibold">"Revision Queue"</span> for problems due for review</li>
              <li>• View <span className="text-primary-400 font-semibold">"Analytics"</span> to track your progress and weak areas</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
