import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function RevisionQueuePage() {
  const { user } = useAuth();
  const [problems, setProblems] = useState({
    overdue: [],
    dueToday: [],
    upcoming: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRevisionQueue();
  }, [user]);

  const loadRevisionQueue = async () => {
    try {
      const questionsRef = collection(db, 'questions');
      const q = query(questionsRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const categorized = {
        overdue: [],
        dueToday: [],
        upcoming: [],
      };

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const problemWithId = { id: docSnapshot.id, ...data };

        if (!data.nextRevisionDate) return;

        const nextDate = data.nextRevisionDate.toDate ? data.nextRevisionDate.toDate() : new Date(data.nextRevisionDate);
        nextDate.setHours(0, 0, 0, 0);

        if (nextDate < today) {
          categorized.overdue.push(problemWithId);
        } else if (nextDate.getTime() === today.getTime()) {
          categorized.dueToday.push(problemWithId);
        } else {
          categorized.upcoming.push(problemWithId);
        }
      });

      // Sort by urgency
      categorized.overdue.sort((a, b) => {
        const dateA = a.nextRevisionDate.toDate ? a.nextRevisionDate.toDate() : new Date(a.nextRevisionDate);
        const dateB = b.nextRevisionDate.toDate ? b.nextRevisionDate.toDate() : new Date(b.nextRevisionDate);
        return dateA - dateB;
      });

      categorized.upcoming.sort((a, b) => {
        const dateA = a.nextRevisionDate.toDate ? a.nextRevisionDate.toDate() : new Date(a.nextRevisionDate);
        const dateB = b.nextRevisionDate.toDate ? b.nextRevisionDate.toDate() : new Date(b.nextRevisionDate);
        return dateA - dateB;
      });

      setProblems(categorized);
    } catch (error) {
      console.error('Error loading revision queue:', error);
      toast.error('Failed to load revision queue');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRevised = async (problemId, problem) => {
    try {
      const intervals = {
        Easy: [1, 3, 7, 14, 30, 60],
        Medium: [1, 2, 5, 10, 20, 40],
        Hard: [1, 1, 3, 7, 14, 28],
      };

      const difficultyIntervals = intervals[problem.difficulty] || intervals.Medium;
      const newRevisionCount = (problem.revisionCount || 0) + 1;
      const intervalIndex = Math.min(newRevisionCount, difficultyIntervals.length - 1);
      const daysToAdd = difficultyIntervals[intervalIndex];

      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + daysToAdd);

      const problemRef = doc(db, 'questions', problemId);
      await updateDoc(problemRef, {
        revisionCount: newRevisionCount,
        lastRevisionDate: serverTimestamp(),
        nextRevisionDate: nextDate,
        updatedAt: serverTimestamp(),
        revisionHistory: [
          ...(problem.revisionHistory || []),
          {
            date: new Date(),
            count: newRevisionCount,
          },
        ],
      });

      toast.success('Marked as revised! 🎉');
      loadRevisionQueue();
    } catch (error) {
      console.error('Error marking as revised:', error);
      toast.error('Failed to mark as revised');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-primary-500 to-purple-500 p-3 rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Revision Queue</h1>
          </div>
          <p className="text-gray-400">Problems scheduled for revision</p>
        </motion.div>

        <div className="space-y-8">
          {/* Overdue */}
          {problems.overdue.length > 0 && (
            <Section
              title="Overdue"
              icon={<AlertCircle className="text-red-400" />}
              count={problems.overdue.length}
            >
              {problems.overdue.map((problem, idx) => (
                <ProblemCard
                  key={problem.id}
                  problem={problem}
                  index={idx}
                  onRevise={() => handleMarkRevised(problem.id, problem)}
                />
              ))}
            </Section>
          )}

          {/* Due Today */}
          {problems.dueToday.length > 0 && (
            <Section
              title="Due Today"
              icon={<Clock className="text-orange-400" />}
              count={problems.dueToday.length}
            >
              {problems.dueToday.map((problem, idx) => (
                <ProblemCard
                  key={problem.id}
                  problem={problem}
                  index={idx}
                  onRevise={() => handleMarkRevised(problem.id, problem)}
                />
              ))}
            </Section>
          )}

          {/* Upcoming */}
          {problems.upcoming.length > 0 && (
            <Section
              title="Upcoming"
              icon={<CheckCircle className="text-green-400" />}
              count={problems.upcoming.length}
            >
              {problems.upcoming.slice(0, 10).map((problem, idx) => (
                <ProblemCard
                  key={problem.id}
                  problem={problem}
                  index={idx}
                  onRevise={() => handleMarkRevised(problem.id, problem)}
                />
              ))}
            </Section>
          )}

          {problems.overdue.length === 0 && problems.dueToday.length === 0 && problems.upcoming.length === 0 && (
            <div className="glass-card p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No problems in revision queue</h3>
              <p className="text-gray-400">Start adding problems to build your revision schedule!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, count, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-xl font-semibold">
          {title} <span className="text-gray-500">({count})</span>
        </h2>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ProblemCard({ problem, index, onRevise }) {
  const nextDate = problem.nextRevisionDate?.toDate ? problem.nextRevisionDate.toDate() : new Date(problem.nextRevisionDate);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card p-4 hover:bg-white/10 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold mb-2">{problem.title}</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge color="blue">{problem.topic}</Badge>
            <Badge color="purple">{problem.pattern}</Badge>
            <Badge color={getDifficultyColor(problem.difficulty)}>
              {problem.difficulty}
            </Badge>
          </div>
          {problem.revisionHint && (
            <p className="text-sm text-gray-400 mb-2">💡 {problem.revisionHint}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Revisions: {problem.revisionCount || 0}</span>
            <span>Next: {format(nextDate, 'MMM d, yyyy')}</span>
          </div>
        </div>
        <button
          onClick={onRevise}
          className="btn-primary px-4 py-2 text-sm whitespace-nowrap"
        >
          Mark Revised
        </button>
      </div>
    </motion.div>
  );
}

function Badge({ color, children }) {
  const colors = {
    blue: 'bg-blue-500/20 text-blue-300',
    purple: 'bg-purple-500/20 text-purple-300',
    green: 'bg-green-500/20 text-green-300',
    yellow: 'bg-yellow-500/20 text-yellow-300',
    red: 'bg-red-500/20 text-red-300',
  };

  return (
    <span className={`badge ${colors[color] || colors.blue}`}>{children}</span>
  );
}

function getDifficultyColor(difficulty) {
  switch (difficulty) {
    case 'Easy':
      return 'green';
    case 'Medium':
      return 'yellow';
    case 'Hard':
      return 'red';
    default:
      return 'blue';
  }
}
