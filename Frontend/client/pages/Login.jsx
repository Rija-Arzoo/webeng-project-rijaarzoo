import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--c-bg)' }}>
      {/* Left panel – decorative */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden"
           style={{ background: 'var(--c-sidebar)' }}>
        <div className="absolute inset-0"
             style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, rgba(45,91,227,.25) 0%, transparent 55%)' }} />
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                 style={{ background: 'var(--c-accent)' }}>
              <i className="fas fa-graduation-cap"></i>
            </div>
            <span className="font-display font-bold text-xl text-white tracking-tight">AlumniNet</span>
          </Link>
        </div>
        <div className="relative z-10">
          <blockquote className="text-xl font-display font-semibold leading-relaxed mb-6"
                      style={{ color: '#e4e4e7' }}>
            "The right mentor can compress years of trial-and-error into months of focused growth."
          </blockquote>
          <p className="text-sm" style={{ color: '#71717a' }}>— AlumniNet Community</p>
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex -space-x-2">
            {['SC','AK','JB'].map((av,i) => (
              <div key={i} className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold"
                   style={{ borderColor: '#18181b', background: `hsl(${i*50+200},70%,48%)` }}>{av}</div>
            ))}
          </div>
          <p className="text-sm" style={{ color: '#a1a1aa' }}>Join 10,000+ members</p>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-in">

          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center gap-2.5 justify-center mb-8 no-underline">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
                 style={{ background: 'var(--c-accent)' }}>
              <i className="fas fa-graduation-cap"></i>
            </div>
            <span className="font-display font-bold text-lg tracking-tight" style={{ color: 'var(--c-text)' }}>AlumniNet</span>
          </Link>

          <h1 className="font-display font-extrabold mb-1" style={{ fontSize: '1.75rem', letterSpacing: '-0.025em', color: 'var(--c-text)' }}>
            Welcome back
          </h1>
          <p className="mb-8 text-sm" style={{ color: 'var(--c-text-2)' }}>
            Sign in to your account to continue
          </p>

          {error && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl mb-5 text-sm font-medium"
                 style={{ background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--c-danger)' }}>
              <i className="fas fa-circle-exclamation flex-shrink-0"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--c-text-2)' }}>
                Email address
              </label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                     placeholder="you@university.edu" className="input-field" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-2)' }}>
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-medium" style={{ color: 'var(--c-accent)' }}>
                  Forgot password?
                </Link>
              </div>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                     placeholder="••••••••" className="input-field" />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input id="remember" type="checkbox"
                     className="w-4 h-4 rounded border-gray-300 accent-blue-600 cursor-pointer" />
              <label htmlFor="remember" className="text-sm cursor-pointer" style={{ color: 'var(--c-text-2)' }}>
                Keep me signed in
              </label>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 text-base">
              {loading ? (
                <><span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> Signing in…</>
              ) : (
                <>Sign In <i className="fas fa-arrow-right text-sm"></i></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--c-text-2)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold" style={{ color: 'var(--c-accent)' }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
