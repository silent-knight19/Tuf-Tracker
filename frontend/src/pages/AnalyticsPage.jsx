import Navbar from '../components/layout/Navbar';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-gradient-to-br from-primary-500 to-purple-500 p-2 rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Analytics</h1>
          </div>
          <p className="text-sm text-gray-400">Track your progress and identify weak areas</p>
        </motion.div>

        <div className="glass-card p-8 text-center">
          <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
          <p className="text-sm text-gray-400">
            We're building comprehensive analytics including:
          </p>
          <ul className="text-sm text-gray-500 mt-3 space-y-1.5">
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
