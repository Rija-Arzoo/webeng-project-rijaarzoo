import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    university: '',
    department: '',
    degreeLevel: 'BS',
    studentId: '',
    batchYear: '',
    graduationYear: '',
    securityQ1: 'What is the name of your first school?',
    securityA1: '',
    securityQ2: 'What is your best friend’s first name?',
    securityA2: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.name.trim()) {
      setError('Full name is required');
      return;
    }
    
    if (!form.email.trim()) {
      setError('Email is required');
      return;
    }

    if (!form.password || form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!form.university.trim() || !form.department.trim()) {
      setError('University and department are required');
      return;
    }
    if (form.role === 'student' && !form.studentId.trim()) {
      setError('Student ID is required for students');
      return;
    }
    if (form.role === 'student' && !form.batchYear) {
      setError('Batch year is required for students');
      return;
    }
    if (form.role === 'alumni' && !form.graduationYear) {
      setError('Graduation year is required for alumni');
      return;
    }
    if (!form.securityA1.trim() || !form.securityA2.trim()) {
      setError('Please answer both security questions');
      return;
    }
    if (form.securityQ1 === form.securityQ2) {
      setError('Please choose two different security questions');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        university: form.university.trim(),
        department: form.department.trim(),
        degreeLevel: form.degreeLevel,
        studentId: form.role === 'student' ? form.studentId.trim() : undefined,
        batchYear: form.role === 'student' ? Number(form.batchYear) : undefined,
        graduationYear: form.graduationYear ? Number(form.graduationYear) : undefined,
        securityQuestions: [
          { question: form.securityQ1, answer: form.securityA1 },
          { question: form.securityQ2, answer: form.securityA2 },
        ],
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{ background: 'var(--c-bg)' }}>
      <div className="w-full max-w-3xl animate-fade-in">
        {/* Header */}
        <div className="text-center mb-7">
          <Link to="/" className="inline-flex items-center gap-2.5 justify-center mb-6 no-underline">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                 style={{ background: 'var(--c-accent)' }}>
              <i className="fas fa-graduation-cap text-sm"></i>
            </div>
            <span className="font-display font-bold text-lg tracking-tight" style={{ color: 'var(--c-text)' }}>AlumniNet</span>
          </Link>
          <h1 className="font-display font-extrabold mb-2" style={{ fontSize: '1.9rem', letterSpacing: '-0.025em', color: 'var(--c-text)' }}>
            Create your account
          </h1>
          <p className="text-sm" style={{ color: 'var(--c-text-2)' }}>
            Join the network — it's completely free
          </p>
        </div>

        {/* Card */}
        <div className="card p-6 sm:p-8" style={{ borderRadius: '20px' }}>
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl mb-5 text-sm font-medium"
                 style={{ background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--c-danger)' }}>
              <i className="fas fa-circle-exclamation flex-shrink-0"></i>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {/* Name */}
              <div className="md:col-span-2">
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--c-text-2)' }}>
                Full Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="John Doe"
                required
                value={form.name}
                onChange={handleChange}
                className="input-field text-sm py-2.5"
              />
              </div>

              {/* Email */}
              <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--c-text-2)' }}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="you@university.edu"
                required
                value={form.email}
                onChange={handleChange}
                className="input-field text-sm py-2.5"
              />
              </div>

              {/* Password */}
              <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--c-text-2)' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                required
                value={form.password}
                onChange={handleChange}
                className="input-field text-sm py-2.5"
              />
              <p className="text-xs mt-1.5" style={{ color: 'var(--c-text-3)' }}>Minimum 6 characters</p>
              </div>

              {/* Role Selection */}
              <div>
              <label htmlFor="role" className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--c-text-2)' }}>
                I am a...
              </label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                className="input-field cursor-pointer text-sm py-2.5"
              >
                <option value="student">Student</option>
                <option value="alumni">Alumni</option>
              </select>
              </div>

              <div>
                <label htmlFor="university" className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--c-text-2)' }}>
                  University
                </label>
                <input
                  id="university"
                  type="text"
                  name="university"
                  placeholder="Your University"
                  required
                  value={form.university}
                  onChange={handleChange}
                  className="input-field text-sm py-2.5"
                />
              </div>

              <div>
                <label htmlFor="department" className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--c-text-2)' }}>
                  Department
                </label>
                <input
                  id="department"
                  type="text"
                  name="department"
                  placeholder="Computer Science"
                  required
                  value={form.department}
                  onChange={handleChange}
                  className="input-field text-sm py-2.5"
                />
              </div>

              <div>
                <label htmlFor="degreeLevel" className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--c-text-2)' }}>
                  Degree
                </label>
                <select
                  id="degreeLevel"
                  name="degreeLevel"
                  value={form.degreeLevel}
                  onChange={handleChange}
                  className="input-field cursor-pointer text-sm py-2.5"
                >
                  <option value="BS">BS</option>
                  <option value="MS">MS</option>
                  <option value="PHD">PhD</option>
                </select>
              </div>

              {/* Security Questions */}
              <div className="md:col-span-2 mt-2">
                <div className="rounded-xl p-4 sm:p-5" style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-display font-bold" style={{ color: 'var(--c-text)' }}>Security questions</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--c-text-3)' }}>
                        Used for password reset without your old password.
                      </div>
                    </div>
                    <div className="badge text-xs">
                      Required
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--c-text-2)' }}>
                        Question 1
                      </label>
                      <select
                        name="securityQ1"
                        value={form.securityQ1}
                        onChange={handleChange}
                        className="input-field cursor-pointer text-sm py-2.5"
                      >
                        <option>What is the name of your first school?</option>
                        <option>What is your best friend’s first name?</option>
                        <option>What city were you born in?</option>
                        <option>What is your mother’s maiden name?</option>
                        <option>What was the name of your first pet?</option>
                      </select>
                      <input
                        name="securityA1"
                        value={form.securityA1}
                        onChange={handleChange}
                        className="input-field text-sm py-2.5 mt-2"
                        placeholder="Answer"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--c-text-2)' }}>
                        Question 2
                      </label>
                      <select
                        name="securityQ2"
                        value={form.securityQ2}
                        onChange={handleChange}
                        className="input-field cursor-pointer text-sm py-2.5"
                      >
                        <option>What is your best friend’s first name?</option>
                        <option>What is the name of your first school?</option>
                        <option>What is the name of your favorite teacher?</option>
                        <option>What is your favorite book?</option>
                        <option>What is the name of the street you grew up on?</option>
                      </select>
                      <input
                        name="securityA2"
                        value={form.securityA2}
                        onChange={handleChange}
                        className="input-field text-sm py-2.5 mt-2"
                        placeholder="Answer"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {form.role === 'student' && (
                <>
                  <div>
                    <label htmlFor="studentId" className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--c-text-2)' }}>
                      Student ID
                    </label>
                    <input
                      id="studentId"
                      type="text"
                      name="studentId"
                      placeholder="e.g. 22CS1042"
                      required
                      value={form.studentId}
                      onChange={handleChange}
                      className="input-field text-sm py-2.5"
                    />
                  </div>

                  <div>
                    <label htmlFor="batchYear" className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--c-text-2)' }}>
                      Batch Year
                    </label>
                    <input
                      id="batchYear"
                      type="number"
                      name="batchYear"
                      placeholder="2023"
                      min="1990"
                      max="2100"
                      required
                      value={form.batchYear}
                      onChange={handleChange}
                      className="input-field text-sm py-2.5"
                    />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="graduationYear" className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--c-text-2)' }}>
                  Graduation Year {form.role === 'alumni' ? '' : '(optional)'}
                </label>
                <input
                  id="graduationYear"
                  type="number"
                  name="graduationYear"
                  placeholder="2026"
                  min="1990"
                  max="2100"
                  required={form.role === 'alumni'}
                  value={form.graduationYear}
                  onChange={handleChange}
                  className="input-field text-sm py-2.5"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-4 text-base">
              {loading ? (
                <><span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> Creating account…</>
              ) : (
                <>Create My Account <i className="fas fa-arrow-right text-sm"></i></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--c-text-2)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold" style={{ color: 'var(--c-accent)' }}>Sign in</Link>
          </p>
        </div>

        <p className="mt-5 text-center text-xs" style={{ color: 'var(--c-text-3)' }}>
          By joining you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}