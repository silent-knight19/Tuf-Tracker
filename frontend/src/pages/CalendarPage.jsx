import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle, ExternalLink, Clock } from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../utils/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';

export default function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateProblems, setSelectedDateProblems] = useState([]);

  // Fetch all problems for the user
  useEffect(() => {
    const fetchProblems = async () => {
      if (!user) return;
      
      try {
        const q = query(
          collection(db, 'questions'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const problemsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamp to Date object
          date: doc.data().firstPracticedDate?.toDate() || doc.data().createdAt?.toDate() || new Date()
        }));
        
        setProblems(problemsData);
      } catch (error) {
        console.error("Error fetching problems:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [user]);

  // Filter problems for the selected date
  useEffect(() => {
    const filtered = problems.filter(problem => 
      isSameDay(problem.date, selectedDate)
    );
    setSelectedDateProblems(filtered);
  }, [selectedDate, problems]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper to check if a day has any problems
  const getDayActivity = (day) => {
    const count = problems.filter(p => isSameDay(p.date, day)).length;
    if (count === 0) return null;
    if (count <= 2) return 'bg-accent-mint/40';
    if (count <= 5) return 'bg-accent-mint/70';
    return 'bg-accent-mint';
  };

  return (
    <div className="min-h-screen bg-dark-950 text-dark-100 pb-16">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex flex-col lg:flex-row gap-4">
          
          {/* Calendar Section */}
          <div className="lg:w-2/3">
            <div className="glass-card p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-dark-100">
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-1">
                  <button 
                    onClick={prevMonth}
                    className="p-1.5 hover:bg-dark-700 rounded-full transition-colors text-dark-400 hover:text-dark-100"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={nextMonth}
                    className="p-1.5 hover:bg-dark-700 rounded-full transition-colors text-dark-400 hover:text-dark-100"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-dark-400 text-xs font-medium py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((day, idx) => {
                  const activityClass = getDayActivity(day);
                  const isSelected = isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isTodayDate = isToday(day);

                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        aspect-square rounded-lg flex flex-col items-center justify-center relative
                        transition-all duration-200 border
                        ${isSelected 
                          ? 'border-primary-500 bg-primary-500/10 shadow-[0_0_15px_rgba(56,189,248,0.2)]' 
                          : 'border-transparent hover:bg-dark-800'
                        }
                        ${!isCurrentMonth && 'opacity-30'}
                      `}
                    >
                      <span className={`
                        text-xs font-medium mb-0.5
                        ${isTodayDate ? 'text-primary-400 font-bold' : 'text-dark-300'}
                      `}>
                        {format(day, 'd')}
                      </span>
                      
                      {/* Activity Dot */}
                      {activityClass && (
                        <div className={`w-1.5 h-1.5 rounded-full ${activityClass} shadow-sm`} />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Side Panel - Selected Date Details */}
          <div className="lg:w-1/3">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-4 h-full min-h-[400px]"
            >
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-dark-700/50">
                <div className="bg-primary-500/10 p-2 rounded-lg">
                  <CalendarIcon className="text-primary-400" size={20} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-dark-100">
                    {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE')}
                  </h3>
                  <p className="text-dark-400 text-xs">{format(selectedDate, 'MMMM d, yyyy')}</p>
                </div>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  </div>
                ) : selectedDateProblems.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-dark-400 mb-2">
                      {selectedDateProblems.length} problem{selectedDateProblems.length !== 1 ? 's' : ''} solved
                    </p>
                    <AnimatePresence mode='popLayout'>
                      {selectedDateProblems.map((problem) => (
                        <motion.div
                          key={problem.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-dark-900/50 rounded-lg p-4 hover:border-dark-600 transition-colors border border-dark-700/50"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-medium text-dark-100 line-clamp-1">{problem.title}</h4>
                            <span className={`
                              text-xs px-2 py-0.5 rounded-full
                              ${problem.difficulty === 'Easy' ? 'bg-accent-mint/10 text-accent-mint' : 
                                problem.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' : 
                                'bg-accent-rose/10 text-accent-rose'}
                            `}>
                              {problem.difficulty}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-3 text-xs text-dark-400">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {format(problem.date, 'h:mm a')}
                            </span>
                            {problem.topic && (
                              <span className="bg-dark-800 px-2 py-0.5 rounded text-dark-300 border border-dark-700">
                                {problem.topic}
                              </span>
                            )}
                          </div>

                          {problem.url && (
                            <a 
                              href={problem.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-primary-400 mt-3 hover:text-primary-300 transition-colors"
                            >
                              View Problem <ExternalLink size={10} />
                            </a>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="bg-dark-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-dark-700/50">
                      <CalendarIcon className="text-dark-600" size={32} />
                    </div>
                    <p className="text-dark-400 font-medium">No activity on this day</p>
                    <p className="text-sm text-dark-500 mt-1">Solve a problem to fill this empty space!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

