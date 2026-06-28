import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Zap } from 'lucide-react';

export default function Register() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await signUp(email, password); setDone(true); }
    catch (err) { setError(err.message || 'Registration failed.'); }
    finally { setLoading(false); }
  };

  if (done) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-sm w-full text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><Zap className="w-6 h-6 text-green-600" /></div>
        <h2 className="text-xl font-bold text-[#1E3A5F] mb-2">Check your email</h2>
        <p className="text-slate-500 text-sm">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.</p>
        <Link to="/login" className="mt-6 block text-[#1E3A5F] font-medium hover:underline text-sm">Go to Sign In</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[#1E3A5F] flex items-center justify-center"><Zap className="w-5 h-5 text-[#F59E0B]" /></div>
          <span className="font-bold text-[#1E3A5F] text-xl">AS/NZS Test Results</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h1 className="text-xl font-bold text-[#1E3A5F] mb-1">Create free account</h1>
          <p className="text-slate-500 text-sm mb-6">For Australian & NZ electricians.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30" placeholder="At least 6 characters" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-[#1E3A5F] hover:bg-[#162d4a] text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60">
              {loading ? 'Creating account…' : 'Create Free Account'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}<Link to="/login" className="text-[#1E3A5F] font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}