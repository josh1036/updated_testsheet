import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Zap } from 'lucide-react';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await signIn(email, password); navigate('/dashboard'); }
    catch (err) { setError(err.message || 'Invalid email or password.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[#1E3A5F] flex items-center justify-center"><Zap className="w-5 h-5 text-[#F59E0B]" /></div>
          <span className="font-bold text-[#1E3A5F] text-xl">AS/NZS Test Results</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h1 className="text-xl font-bold text-[#1E3A5F] mb-1">Sign in</h1>
          <p className="text-slate-500 text-sm mb-6">Welcome back, electrician.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30" placeholder="••••••••" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-[#1E3A5F] hover:bg-[#162d4a] text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <div className="mt-4 text-center text-sm text-slate-500">
            <Link to="/forgot-password" className="text-[#1E3A5F] hover:underline">Forgot password?</Link>
          </div>
        </div>
        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{' '}<Link to="/register" className="text-[#1E3A5F] font-medium hover:underline">Create one free</Link>
        </p>
      </div>
    </div>
  );
}