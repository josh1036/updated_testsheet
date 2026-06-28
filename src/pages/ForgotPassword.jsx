import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await resetPassword(email); } catch {}
    setDone(true); setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-sm w-full">
        <h1 className="text-xl font-bold text-[#1E3A5F] mb-1">Reset password</h1>
        {done ? (
          <p className="text-slate-500 text-sm mt-3">If that email exists, a reset link has been sent. Check your inbox.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30" />
            <button type="submit" disabled={loading} className="w-full bg-[#1E3A5F] text-white font-medium py-2.5 rounded-lg text-sm disabled:opacity-60">
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}
        <Link to="/login" className="mt-4 block text-center text-sm text-[#1E3A5F] hover:underline">Back to Sign In</Link>
      </div>
    </div>
  );
}