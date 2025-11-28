import Navbar from '../components/layout/Navbar';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-primary-500 to-purple-500 p-3 rounded-xl">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Analytics</h1>
          </div>
          <p className="text-gray-400">Track your progress and identify weak areas</p>
        </motion.div>

        <div className="glass-card p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Analytics Coming Soon</h3>
          <p className="text-gray-400">
            We're building comprehensive analytics including:
          </p>
          <ul className="text-sm text-gray-500 mt-4 space-y-2">
            <li>• Topic-wise progress breakdown</li>
            <li>• Pattern distribution charts</li>
            <li>• AI-powered weakness detection</li>
            <li>• Heatmaps and activity visualizations</li>
            <li>• Personalized learning paths</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
