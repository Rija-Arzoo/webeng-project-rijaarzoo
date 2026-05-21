import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/apiService.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, fetchUserProfile, logout } = useAuth();

  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showDanger, setShowDanger] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [securityForm, setSecurityForm] = useState({
    q1: 'What is the name of your first school?',
    a1: '',
    q2: 'What is your best friend’s first name?',
    a2: '',
  });

  const [form, setForm] = useState({
    profilePicture: '',
    bio: '',
    location: '',
    skills: '',
    university: '',
    department: '',
    studentId: '',
    batchYear: '',
    graduationYear: '',
    company: '',
    industry: '',
    title: '',
    headline: '',
  });

  useEffect(() => {
    // Seed UI from existing profile (loaded via getMe in AuthContext)
    setUploadResult(null);
    setForm({
      profilePicture: profile?.profilePicture || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      skills: (profile?.skills || []).join(', '),
      university: profile?.university || '',
      department: profile?.department || '',
      studentId: profile?.studentId || '',
      batchYear: profile?.batchYear || '',
      graduationYear: profile?.graduationYear || '',
      company: profile?.company || '',
      industry: profile?.industry || '',
      title: profile?.title || '',
      headline: profile?.headline || '',
    });
  }, [profile]);

  const resumeSkills = useMemo(() => profile?.resumeSkills || [], [profile]);
  const suggestedIndustry = profile?.resumeSuggestedIndustry || null;
  const suggestedTopics = profile?.resumeSuggestedTopics || [];

  const handleField = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleSaveSecurityQuestions = async () => {
    try {
      setError('');
      if (!securityForm.a1.trim() || !securityForm.a2.trim()) {
        setError('Please answer both security questions');
        return;
      }
      if (securityForm.q1 === securityForm.q2) {
        setError('Please choose two different security questions');
        return;
      }
      setSavingSecurity(true);
      await api.auth.updateProfile({
        securityQuestions: [
          { question: securityForm.q1, answer: securityForm.a1 },
          { question: securityForm.q2, answer: securityForm.a2 },
        ],
      });
      setSecurityForm((p) => ({ ...p, a1: '', a2: '' }));
      await fetchUserProfile();
      setShowSecurity(false);
    } catch (err) {
      setError(err.message || 'Could not update security questions');
    } finally {
      setSavingSecurity(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setError('');
      if (!deletePassword.trim()) {
        setError('Please enter your password to delete your account');
        return;
      }
      setDeleting(true);
      await api.auth.deleteMyAccount(deletePassword);
      logout();
      navigate('/');
    } catch (err) {
      setError(err.message || 'Account deletion failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setError('');
      setSuccess('');
      const skillsArr = form.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await api.auth.updateProfile({
        profilePicture: form.profilePicture || undefined,
        bio: form.bio || undefined,
        location: form.location || undefined,
        skills: skillsArr,
        university: form.university || undefined,
        department: form.department || undefined,
        studentId: user?.role === 'student' ? form.studentId || undefined : undefined,
        batchYear: user?.role === 'student' ? Number(form.batchYear) || undefined : undefined,
        graduationYear: form.graduationYear ? Number(form.graduationYear) : undefined,
        company: user?.role === 'alumni' ? form.company || undefined : undefined,
        industry: user?.role === 'alumni' ? form.industry || undefined : undefined,
        title: user?.role === 'alumni' ? form.title || undefined : undefined,
        headline: user?.role === 'alumni' ? form.headline || undefined : undefined,
      });
      await fetchUserProfile();
      setSuccess('Profile updated successfully.');
      window.setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err.message || 'Profile update failed');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      setError('Please choose a PDF resume file');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const result = await api.auth.uploadResume(resumeFile);
      setUploadResult(result);
      await fetchUserProfile(); // refresh resumeSkills/insights in context
    } catch (err) {
      setError(err.message || 'Resume upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleProfileImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Profile image must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      handleField('profilePicture', reader.result?.toString() || '');
      setError('');
    };
    reader.onerror = () => setError('Could not read the selected image');
    reader.readAsDataURL(file);
  };

  const handlePromoteToAlumni = async () => {
    try {
      setPromoting(true);
      setError('');
      await api.auth.updateProfile({
        graduationYear: form.graduationYear ? Number(form.graduationYear) : undefined,
        promoteToAlumni: true,
      });
      await fetchUserProfile();
    } catch (err) {
      setError(err.message || 'Could not switch role to alumni');
    } finally {
      setPromoting(false);
    }
  };

  const applyToMentorSearch = () => {
    const skillsParam = (resumeSkills || []).join(',');
    const industryParam = suggestedIndustry || '';
    const searchParam = '';
    navigate(`/mentors?industry=${encodeURIComponent(industryParam)}&skills=${encodeURIComponent(skillsParam)}&search=${encodeURIComponent(searchParam)}`);
  };

  return (
    <>
    <div className="space-y-6 sm:space-y-8 animate-slide-in">
      <header>
        <h1 className="section-title mb-2 sm:mb-3">Profile</h1>
        <p className="section-subtitle text-base sm:text-lg">
          Upload your resume to get tailored mentorship insights.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2">
          <div className="space-y-6 sm:space-y-8">
            <div className="card p-5 sm:p-7 sm:rounded-3xl">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-4">
                Public Profile
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Profile Picture URL
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowImagePreview(true)}
                      className="focus:outline-none"
                      title="Open profile image"
                    >
                      <img
                        src={form.profilePicture || user?.profilePicture || 'https://via.placeholder.com/64'}
                        alt="Profile preview"
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                      />
                    </button>
                    <input
                      value={form.profilePicture}
                      onChange={(e) => handleField('profilePicture', e.target.value)}
                      placeholder="https://..."
                      className="input-field"
                    />
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Or upload image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                      className="block w-full text-sm text-slate-700 bg-slate-50 border-2 border-slate-100 rounded-xl p-3"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => handleField('bio', e.target.value)}
                    rows={4}
                    className="input-field resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Location
                  </label>
                  <input
                    value={form.location}
                    onChange={(e) => handleField('location', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Skills (comma separated)
                  </label>
                  <input
                    value={form.skills}
                    onChange={(e) => handleField('skills', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
                      University
                    </label>
                    <input
                      value={form.university}
                      onChange={(e) => handleField('university', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Department
                    </label>
                    <input
                      value={form.department}
                      onChange={(e) => handleField('department', e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                {user?.role === 'student' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Student ID
                      </label>
                      <input
                        value={form.studentId}
                        onChange={(e) => handleField('studentId', e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Batch Year
                      </label>
                      <input
                        type="number"
                        min="1990"
                        max="2100"
                        value={form.batchYear}
                        onChange={(e) => handleField('batchYear', e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    min="1990"
                    max="2100"
                    value={form.graduationYear}
                    onChange={(e) => handleField('graduationYear', e.target.value)}
                    className="input-field"
                  />
                </div>

                {user?.role === 'alumni' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Company
                        </label>
                        <input
                          value={form.company}
                          onChange={(e) => handleField('company', e.target.value)}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Industry
                        </label>
                        <input
                          value={form.industry}
                          onChange={(e) => handleField('industry', e.target.value)}
                          className="input-field"
                          placeholder="e.g., Technology"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Title
                        </label>
                        <input
                          value={form.title}
                          onChange={(e) => handleField('title', e.target.value)}
                          className="input-field"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Headline
                      </label>
                      <input
                        value={form.headline}
                        onChange={(e) => handleField('headline', e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </>
                )}

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 text-red-700 text-xs sm:text-sm font-medium">
                    <i className="fas fa-exclamation-circle mr-2" />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border-l-4 border-green-600 rounded-lg p-3 text-green-800 text-xs sm:text-sm font-semibold">
                    <i className="fas fa-check-circle mr-2" />
                    {success}
                  </div>
                )}

                <button
                  onClick={handleSaveProfile}
                  className="w-full py-3 sm:py-4 bg-indigo-600 hover:bg-indigo-800 text-white text-shadow-indigo font-bold rounded-xl transition-all active:scale-95"
                >
                  Save Profile
                </button>

                {user?.role === 'student' && (
                  <button
                    onClick={handlePromoteToAlumni}
                    disabled={promoting}
                    className="w-full py-3 sm:py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-all active:scale-95 disabled:opacity-60"
                  >
                    {promoting ? 'Switching role...' : 'I have graduated - switch me to Alumni'}
                  </button>
                )}

                {/* Security + Danger Zone */}
                <div className="mt-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-black text-slate-900">Account security</div>
                      <div className="text-xs text-slate-500 font-medium mt-1">
                        Manage security questions (used for password reset).
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSecurity((v) => !v)}
                      className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold hover:bg-slate-100 active:scale-95 transition-all"
                    >
                      {showSecurity ? 'Hide' : 'Update'}
                    </button>
                  </div>

                  {showSecurity && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Question 1
                        </label>
                        <select
                          value={securityForm.q1}
                          onChange={(e) => setSecurityForm((p) => ({ ...p, q1: e.target.value }))}
                          className="input-field cursor-pointer"
                        >
                          <option>What is the name of your first school?</option>
                          <option>What is your best friend’s first name?</option>
                          <option>What city were you born in?</option>
                          <option>What was the name of your first pet?</option>
                          <option>What is your favorite book?</option>
                        </select>
                        <input
                          value={securityForm.a1}
                          onChange={(e) => setSecurityForm((p) => ({ ...p, a1: e.target.value }))}
                          className="input-field mt-2"
                          placeholder="Answer"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Question 2
                        </label>
                        <select
                          value={securityForm.q2}
                          onChange={(e) => setSecurityForm((p) => ({ ...p, q2: e.target.value }))}
                          className="input-field cursor-pointer"
                        >
                          <option>What is your best friend’s first name?</option>
                          <option>What is the name of your first school?</option>
                          <option>What is the name of your favorite teacher?</option>
                          <option>What is the name of the street you grew up on?</option>
                          <option>What was your childhood nickname?</option>
                        </select>
                        <input
                          value={securityForm.a2}
                          onChange={(e) => setSecurityForm((p) => ({ ...p, a2: e.target.value }))}
                          className="input-field mt-2"
                          placeholder="Answer"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <button
                          type="button"
                          onClick={handleSaveSecurityQuestions}
                          disabled={savingSecurity}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-800 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-60"
                        >
                          {savingSecurity ? 'Saving…' : 'Save security questions'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-2 rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-black text-red-800">Danger zone</div>
                      <div className="text-xs text-red-700/80 font-medium mt-1">
                        Delete your account permanently. This cannot be undone.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDanger((v) => !v)}
                      className="px-4 py-2 rounded-xl bg-white border border-red-200 text-red-800 font-black hover:bg-red-100 active:scale-95 transition-all"
                    >
                      {showDanger ? 'Cancel' : 'Delete'}
                    </button>
                  </div>

                  {showDanger && (
                    <div className="mt-4 space-y-3">
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className="input-field border-red-200 bg-white focus:ring-red-100"
                        placeholder="Confirm with your password"
                      />
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-all active:scale-95 disabled:opacity-60"
                      >
                        {deleting ? 'Deleting…' : 'Permanently delete my account'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card p-5 sm:p-7 sm:rounded-3xl">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-4">
                Resume Upload (PDF)
              </h2>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Select PDF
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-slate-700 bg-slate-50 border-2 border-slate-100 rounded-xl p-3"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    We extract skills/keywords from your resume and suggest mentoring focus areas.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={uploading || !resumeFile}
                  className="w-full py-3 sm:py-4 bg-indigo-600 hover:bg-indigo-800 text-white text-shadow-indigo font-bold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <i className="fas fa-spinner animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <i className="fas fa-file-pdf" />
                      Upload & Get Suggestions
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div>
          <div className="card bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl border-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <i className="fas fa-brain text-6xl" />
            </div>

            <div className="relative z-10">
              <h2 className="text-xl sm:text-2xl font-black mb-3">Resume Insights</h2>

              {(!suggestedIndustry && resumeSkills.length === 0 && suggestedTopics.length === 0) ? (
                <div className="text-slate-200 text-sm sm:text-base">
                  Upload your PDF to see skill-based mentorship suggestions.
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs uppercase font-bold text-indigo-200 tracking-wider mb-2">
                      Suggested Industry
                    </div>
                    <div className="text-white font-black text-base sm:text-lg">{suggestedIndustry}</div>
                  </div>

                  <div>
                    <div className="text-xs uppercase font-bold text-indigo-200 tracking-wider mb-2">
                      Skills detected
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {resumeSkills.length === 0 ? (
                        <span className="text-slate-300 text-sm">No clear skills detected</span>
                      ) : (
                        resumeSkills.map((s) => (
                          <span
                            key={s}
                            className="inline-block px-3 py-1 bg-white/10 border border-white/15 rounded-full text-xs font-bold"
                          >
                            {s}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase font-bold text-indigo-200 tracking-wider mb-2">
                      Mentorship focus
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-slate-200 text-sm sm:text-base">
                      {suggestedTopics.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={applyToMentorSearch}
                    className="w-full py-3 sm:py-4 bg-indigo-600 hover:bg-indigo-800 text-white text-shadow-indigo font-bold rounded-xl transition-all active:scale-95"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <i className="fas fa-magnifying-glass" />
                      Find mentors matching my resume
                    </span>
                  </button>
                </div>
              )}

              {uploadResult?.success && (
                <div className="mt-4 text-xs text-slate-300">
                  Updated {new Date().toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    {showImagePreview && (
      <div
        className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
        onClick={() => setShowImagePreview(false)}
      >
        <img
          src={form.profilePicture || user?.profilePicture || 'https://via.placeholder.com/300'}
          alt="Profile full size"
          className="max-h-[85vh] max-w-[85vw] rounded-2xl shadow-2xl border border-white/20"
        />
      </div>
    )}
    </>
  );
}

