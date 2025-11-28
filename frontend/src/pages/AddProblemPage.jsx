import Navbar from '../components/layout/Navbar';
import ProblemEntryForm from '../components/problems/ProblemEntryForm';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

export default function AddProblemPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-gradient-to-br from-primary-500 to-purple-500 p-2 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Add New Problem</h1>
          </div>
          <p className="text-sm text-gray-400">
            Log your DSA problem and let AI analyze it for you
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 md:p-6"
        >
          <ProblemEntryForm />
        </motion.div>
      </div>
    </div>
  );
}
