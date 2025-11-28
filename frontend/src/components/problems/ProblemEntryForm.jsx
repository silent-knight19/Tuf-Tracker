import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Check, AlertCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { analyzeProblem } from '../../utils/aiService';
import toast from 'react-hot-toast';

export default function ProblemEntryForm({ onSuccess }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    userNotes: '',
    difficulty: '', // Optional override
  });
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [step, setStep] = useState('form'); // form, analyzing, results

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      toast.error('Title and description are required');
      return;
    }

    setLoading(true);
    setStep('analyzing');

    try {
      // Step 1: Get AI analysis
      const aiResponse = await analyzeProblem({
        title: formData.title,
        url: formData.url,
        description: formData.description,
        userNotes: formData.userNotes,
      });

      if (!aiResponse.success) {
        throw new Error(aiResponse.error || 'Failed to analyze problem');
      }

      setAiAnalysis(aiResponse.data);
      setStep('results');

      // Step 2: Calculate next revision date (1 day from now)
      const nextRevisionDate = new Date();
      nextRevisionDate.setDate(nextRevisionDate.getDate() + 1);

      // Step 3: Save to Firestore
      const problemData = {
        userId: user.uid,
        title: formData.title,
        url: formData.url || '',
        description: formData.description,
        userNotes: formData.userNotes || '',

        // AI-generated metadata
        topic: aiResponse.data.topic,
        pattern: aiResponse.data.pattern,
        difficulty: formData.difficulty || aiResponse.data.difficulty,
        subtopic: aiResponse.data.subtopic || '',
        companyTags: aiResponse.data.companyTags || [],
        keyTakeaways: aiResponse.data.keyTakeaways || [],
        mistakes: aiResponse.data.mistakes || [],
        improvementSuggestions: aiResponse.data.improvementSuggestions || [],
        revisionHint: aiResponse.data.revisionHint || '',
        relatedProblems: aiResponse.data.relatedProblems || [],

        // Dates and revision tracking
        firstPracticedDate: serverTimestamp(),
        lastRevisionDate: null,
        revisionCount: 0,
        nextRevisionDate: nextRevisionDate,
        revisionHistory: [],

        // Metadata
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'questions'), problemData);

      // Update user stats
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'stats.totalProblems': increment(1),
      });

      toast.success('Problem added successfully! 🎉');
      
      // Reset form
      setTimeout(() => {
        setFormData({
          title: '',
          url: '',
          description: '',
          userNotes: '',
          difficulty: '',
        });
        setAiAnalysis(null);
        setStep('form');
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Error adding problem:', error);
      toast.error(error.message || 'Failed to add problem');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'analyzing') {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="mb-6"
        >
          <Sparkles className="w-16 h-16 text-primary-400" />
        </motion.div>
        <h3 className="text-2xl font-semibold mb-2">AI is analyzing your problem...</h3>
        <p className="text-gray-400">This may take a few seconds</p>
      </div>
    );
  }

  if (step === 'results' && aiAnalysis) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-green-500/20 p-2 rounded-full">
            <Check className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold">Analysis Complete!</h3>
            <p className="text-gray-400">Problem saved to your tracker</p>
          </div>
        </div>

        <div className="grid gap-4">
          <InfoCard label="Topic" value={aiAnalysis.topic} />
          <InfoCard label="Pattern" value={aiAnalysis.pattern} />
          <InfoCard label="Difficulty" value={aiAnalysis.difficulty} />
          {aiAnalysis.subtopic && (
            <InfoCard label="Subtopic" value={aiAnalysis.subtopic} />
          )}
          {aiAnalysis.companyTags?.length > 0 && (
            <InfoCard 
              label="Company Tags" 
              value={aiAnalysis.companyTags.join(', ')} 
            />
          )}
        </div>

        {aiAnalysis.keyTakeaways?.length > 0 && (
          <div className="glass-card p-4">
            <h4 className="font-semibold mb-2 text-primary-400">Key Takeaways</h4>
            <ul className="space-y-1">
              {aiAnalysis.keyTakeaways.map((takeaway, idx) => (
                <li key={idx} className="text-sm text-gray-300">• {takeaway}</li>
              ))}
            </ul>
          </div>
        )}

        {aiAnalysis.improvementSuggestions?.length > 0 && (
          <div className="glass-card p-4">
            <h4 className="font-semibold mb-2 text-purple-400">Improvement Suggestions</h4>
            <ul className="space-y-1">
              {aiAnalysis.improvementSuggestions.map((suggestion, idx) => (
                <li key={idx} className="text-sm text-gray-300">• {suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        {aiAnalysis.revisionHint && (
          <div className="glass-card p-4 border-l-4 border-primary-500">
            <h4 className="font-semibold mb-2">💡 Revision Hint</h4>
            <p className="text-sm text-gray-300">{aiAnalysis.revisionHint}</p>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">
          Problem Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="input-field"
          placeholder="e.g., Two Sum"
          required
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Problem URL</label>
        <input
          type="url"
          name="url"
          value={formData.url}
          onChange={handleChange}
          className="input-field"
          placeholder="https://leetcode.com/problems/two-sum/"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Problem Description <span className="text-red-400">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="input-field min-h-[120px] resize-y"
          placeholder="Paste or describe the problem here..."
          required
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Your Notes & Approach</label>
        <textarea
          name="userNotes"
          value={formData.userNotes}
          onChange={handleChange}
          className="input-field min-h-[100px] resize-y"
          placeholder="Your thoughts, approach, difficulties faced, mistakes made..."
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Difficulty (Optional - AI will suggest)
        </label>
        <select
          name="difficulty"
          value={formData.difficulty}
          onChange={handleChange}
          className="input-field"
          disabled={loading}
        >
          <option value="">Let AI decide</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles size={20} />
            Save & Analyze with AI
          </>
        )}
      </button>
    </form>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="glass-card p-3 flex items-center justify-between">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="font-semibold text-primary-400">{value}</span>
    </div>
  );
}
