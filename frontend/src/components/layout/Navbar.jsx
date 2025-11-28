import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Plus, Repeat, BarChart3, LogOut, User, Calendar, Brain, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const navItems = [
    { path: '/home', icon: <Home size={18} />, label: 'Home' },
    { path: '/progress', icon: <TrendingUp size={18} />, label: 'Progress' },
    { path: '/calendar', icon: <Calendar size={18} />, label: 'Calendar' },
    { path: '/revision', icon: <Repeat size={18} />, label: 'Revision Queue' },
    { path: '/analytics', icon: <BarChart3 size={18} />, label: 'Analytics' },
  ];

  return (
    <nav className="bg-dark-900/80 backdrop-blur-md border-b border-dark-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2 group">
            <div className="bg-primary-500/10 p-1.5 rounded-lg group-hover:bg-primary-500/20 transition-colors">
              <Brain className="w-5 h-5 text-primary-400" />
            </div>
            <span className="text-base font-bold text-dark-100 tracking-tight">
              Tuf-Tracker
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'} text-xs px-2 py-1.5`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-lg border border-transparent hover:border-dark-700 transition-all">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full ring-2 ring-dark-800"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-dark-700 flex items-center justify-center">
                  <User size={14} className="text-dark-300" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-xs font-medium text-dark-200 leading-none">
                  {user?.displayName?.split(' ')[0] || 'User'}
                </span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg text-dark-400 hover:text-accent-rose hover:bg-accent-rose/10 transition-colors"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
