import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/apiService.jsx';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState('email'); // email | questions | done
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState(['', '']);
  const [newPassword, setNewPassword] = useState('');

  const canSubmitEmail = useMemo(() => email.trim().length > 3, [email]);
  const canSubmitReset = useMemo(() => {
    return (
      answers[0].trim().length > 0 &&
      answers[1].trim().length > 0 &&
      newPassword.trim().length >= 6
    );
  }, [answers, newPassword]);

  const fetchQuestions = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.forgotPasswordQuestions(email.trim());
      setQuestions(res.questions || []);
      setAnswers(['', '']);
      setStep('questions');
    } catch (err) {
      setError(err.message || 'Could not start password reset');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.auth.resetPasswordWithSecurityQuestions(email.trim(), answers, newPassword);
      setStep('done');
      setTimeout(() => navigate('/login'), 700);
    } catch (err) {
      setError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl mx-auto mb-5 shadow-lg">
            <i className="fas fa-shield-halved"></i>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter mb-2">
            Reset Password
          </h1>
          <p className=" font-medium">
            Verify your identity using your security questions.
          </p>
        </div>

        <div className="card p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 to-indigo-400"></div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-sm font-semibold text-red-700">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </p>
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={fetchQuestions} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-widest  mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="input-field text-sm py-2.5"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !canSubmitEmail}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-base sm:text-lg rounded-2xl hover:shadow-lg active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6 sm:mt-8"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner animate-spin"></i>
                    Checking...
                  </>
                ) : (
                  <>
                    <i className="fas fa-arrow-right"></i>
                    Continue
                  </>
                )}
              </button>

              <div className="text-center text-sm text-slate-600 pt-2">
                Remembered it?{' '}
                <Link to="/login" className="font-bold text-indigo-600 hover:">
                  Sign in
                </Link>
              </div>
            </form>
          )}

          {step === 'questions' && (
            <form onSubmit={resetPassword} className="space-y-4 sm:space-y-5">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="text-xs uppercase font-bold tracking-widest  mb-1">
                  Account
                </div>
                <div className="text-sm font-semibold text-slate-800">{email.trim()}</div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-widest  mb-2">
                  {questions?.[0]?.question || 'Security question 1'}
                </label>
                <input
                  value={answers[0]}
                  onChange={(e) => setAnswers((p) => [e.target.value, p[1]])}
                  className="input-field text-sm py-2.5"
                  placeholder="Your answer"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-widest  mb-2">
                  {questions?.[1]?.question || 'Security question 2'}
                </label>
                <input
                  value={answers[1]}
                  onChange={(e) => setAnswers((p) => [p[0], e.target.value])}
                  className="input-field text-sm py-2.5"
                  placeholder="Your answer"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-widest  mb-2">
                  New password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field text-sm py-2.5"
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !canSubmitReset}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-base sm:text-lg rounded-2xl hover:shadow-lg active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6 sm:mt-8"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner animate-spin"></i>
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-key"></i>
                    Update password
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setStep('email');
                  setQuestions([]);
                  setAnswers(['', '']);
                  setNewPassword('');
                }}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-60"
              >
                Back
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check text-2xl" />
              </div>
              <div className="text-xl font-black text-slate-900 mb-1">Password updated</div>
              <div className="text-slate-600 font-medium">Redirecting you to sign in…</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

