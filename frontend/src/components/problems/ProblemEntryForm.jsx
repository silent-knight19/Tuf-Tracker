import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Check, AlertCircle, Target } from 'lucide-react';
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
          className="mb-6 bg-primary-500/10 p-4 rounded-full"
        >
          <Sparkles className="w-12 h-12 text-primary-400" />
        </motion.div>
        <h3 className="text-2xl font-bold text-dark-100 mb-2">AI is analyzing your problem...</h3>
        <p className="text-dark-400">This may take a few seconds</p>
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
        <div className="flex items-center gap-4 mb-8 bg-accent-mint/10 p-4 rounded-xl border border-accent-mint/20">
          <div className="bg-accent-mint/20 p-2 rounded-full">
            <Check className="w-6 h-6 text-accent-mint" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-dark-100">Analysis Complete!</h3>
            <p className="text-dark-400 text-sm">Problem saved to your tracker</p>
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
          <div className="glass-card p-5">
            <h4 className="font-semibold mb-3 text-primary-400 flex items-center gap-2">
              <Sparkles size={16} /> Key Takeaways
            </h4>
            <ul className="space-y-2">
              {aiAnalysis.keyTakeaways.map((takeaway, idx) => (
                <li key={idx} className="text-sm text-dark-200 flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-primary-400 flex-shrink-0" />
                  {takeaway}
                </li>
              ))}
            </ul>
          </div>
        )}

        {aiAnalysis.improvementSuggestions?.length > 0 && (
          <div className="glass-card p-5">
            <h4 className="font-semibold mb-3 text-accent-purple flex items-center gap-2">
              <Target size={16} /> Improvement Suggestions
            </h4>
            <ul className="space-y-2">
              {aiAnalysis.improvementSuggestions.map((suggestion, idx) => (
                <li key={idx} className="text-sm text-dark-200 flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-accent-purple flex-shrink-0" />
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        {aiAnalysis.revisionHint && (
          <div className="glass-card p-5 border-l-4 border-primary-500 bg-primary-500/5">
            <h4 className="font-semibold mb-2 text-dark-100">💡 Revision Hint</h4>
            <p className="text-sm text-dark-300 leading-relaxed">{aiAnalysis.revisionHint}</p>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-2">
          Problem Title <span className="text-accent-rose">*</span>
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
        <label className="block text-sm font-medium text-dark-200 mb-2">Problem URL</label>
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
        <label className="block text-sm font-medium text-dark-200 mb-2">
          Problem Description <span className="text-accent-rose">*</span>
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
        <label className="block text-sm font-medium text-dark-200 mb-2">Your Notes & Approach</label>
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
        <label className="block text-sm font-medium text-dark-200 mb-2">
          Difficulty (Optional - AI will suggest)
        </label>
        <div className="relative">
          <select
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            className="input-field appearance-none"
            disabled={loading}
          >
            <option value="">Let AI decide</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-dark-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary group"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
            Save & Analyze with AI
          </>
        )}
      </button>
    </form>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="glass-card p-4 flex items-center justify-between group hover:border-dark-600 transition-colors">
      <span className="text-sm text-dark-400 font-medium">{label}</span>
      <span className="font-semibold text-primary-400 group-hover:text-primary-300 transition-colors">{value}</span>
    </div>
  );
}
