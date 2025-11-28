import Navbar from '../components/layout/Navbar';
import ProblemEntryForm from '../components/problems/ProblemEntryForm';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

export default function AddProblemPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-primary-500 to-purple-500 p-3 rounded-xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Add New Problem</h1>
          </div>
          <p className="text-gray-400">
            Log your DSA problem and let AI analyze it for you
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 md:p-8"
        >
          <ProblemEntryForm />
        </motion.div>
      </div>
    </div>
  );
}
