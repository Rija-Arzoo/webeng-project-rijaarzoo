import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/apiService.jsx';

export default function MentorCard({ mentor, profile }) {
  const [showModal, setShowModal] = useState(false);
  const [goalStatement, setGoalStatement] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSendRequest = async () => {
    if (!goalStatement.trim() || goalStatement.length < 20) {
      setError('Goal statement must be at least 20 characters long');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await api.requests.send(mentor._id, goalStatement);
      setSuccess(true);
      setGoalStatement('');
      setTimeout(() => { setShowModal(false); setSuccess(false); }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const initials = mentor.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '??';

  return (
    <>
      <div className="card rounded-2xl p-5 flex flex-col h-full group transition-all duration-200 cursor-default">

        {/* Header */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="relative flex-shrink-0">
            {mentor.profilePicture ? (
              <img src={mentor.profilePicture} alt={mentor.name}
                   className="w-14 h-14 rounded-xl object-cover"
                   style={{ border: '2px solid var(--c-border)' }} />
            ) : (
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                   style={{ background: 'linear-gradient(135deg, var(--c-accent), #7b8ef5)' }}>
                {initials}
              </div>
            )}
            {profile?.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white"
                   style={{ background: 'var(--c-success)' }}>
                <i className="fas fa-check text-white" style={{ fontSize: '0.55rem' }}></i>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-bold text-base truncate leading-tight group-hover:text-blue-600 transition-colors"
                style={{ color: 'var(--c-text)' }}>
              {mentor.name}
            </h3>
            <p className="text-xs mt-0.5 truncate font-medium" style={{ color: 'var(--c-text-3)' }}>
              {mentor.title || 'Alumni Member'}
            </p>
            {mentor.company && (
              <p className="text-xs mt-1 font-medium" style={{ color: 'var(--c-accent)' }}>
                {mentor.company}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        <p className="text-sm leading-relaxed line-clamp-2 flex-1 mb-4" style={{ color: 'var(--c-text-2)' }}>
          {profile?.bio || 'Experienced mentor ready to help guide your career forward.'}
        </p>

        {/* Skills */}
        {profile?.skills?.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.slice(0, 3).map(s => (
                <span key={s} className="badge text-xs">{s}</span>
              ))}
              {profile.skills.length > 3 && (
                <span className="badge text-xs" style={{ background: 'var(--c-bg)', color: 'var(--c-text-3)' }}>
                  +{profile.skills.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Industry tag */}
        {profile?.industry && (
          <div className="flex items-center gap-1.5 mb-4">
            <i className="fas fa-briefcase text-xs" style={{ color: 'var(--c-text-3)' }}></i>
            <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>{profile.industry}</span>
          </div>
        )}

        {/* CTA */}
        <button onClick={() => setShowModal(true)} className="btn-primary w-full py-2.5 text-sm mt-auto">
          Request Mentorship
        </button>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fade-in"
             style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden animate-scale-in"
               style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: '0 24px 64px rgba(0,0,0,.18)' }}>

            {/* Modal Header */}
            <div className="px-6 pt-6 pb-5 flex items-start justify-between"
                 style={{ borderBottom: '1px solid var(--c-border)' }}>
              <div className="flex items-center gap-3">
                {mentor.profilePicture ? (
                  <img src={mentor.profilePicture} alt="" className="w-11 h-11 rounded-xl object-cover"
                       style={{ border: '1.5px solid var(--c-border)' }} />
                ) : (
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                       style={{ background: 'linear-gradient(135deg, var(--c-accent), #7b8ef5)' }}>
                    {initials}
                  </div>
                )}
                <div>
                  <p className="font-display font-bold" style={{ color: 'var(--c-text)' }}>
                    Connect with {mentor.name.split(' ')[0]}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-3)' }}>
                    {profile?.headline || mentor.title || 'Alumni Mentor'}
                  </p>
                </div>
              </div>
              <button onClick={() => { setShowModal(false); setError(null); setSuccess(false); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      style={{ color: 'var(--c-text-3)', background: 'transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--c-bg)'; e.currentTarget.style.color = 'var(--c-text)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--c-text-3)'; }}>
                <i className="fas fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {success ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                       style={{ background: '#dcfce7' }}>
                    <i className="fas fa-check text-xl" style={{ color: 'var(--c-success)' }}></i>
                  </div>
                  <p className="font-display font-bold text-lg mb-1" style={{ color: 'var(--c-text)' }}>Request Sent!</p>
                  <p className="text-sm" style={{ color: 'var(--c-text-2)' }}>
                    {mentor.name} will review your request shortly.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Link to={`/people/${mentor._id}`}
                        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline w-fit">
                    <i className="fas fa-arrow-up-right-from-square text-xs"></i>
                    View full profile
                  </Link>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                           style={{ color: 'var(--c-text-2)' }}>
                      What are your mentorship goals? <span style={{ color: 'var(--c-danger)' }}>*</span>
                    </label>
                    <textarea value={goalStatement}
                              onChange={e => { setGoalStatement(e.target.value); setError(null); }}
                              placeholder="Share your career goals, the skills you want to develop, or specific topics you'd like guidance on…"
                              rows={4}
                              className="input-field resize-none text-sm" />
                    <p className="text-xs mt-1.5" style={{ color: goalStatement.length < 20 ? 'var(--c-text-3)' : 'var(--c-success)' }}>
                      {goalStatement.length}/500 characters (min. 20)
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium"
                         style={{ background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--c-danger)' }}>
                      <i className="fas fa-circle-exclamation flex-shrink-0"></i>
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 py-2.5 text-sm">
                      Cancel
                    </button>
                    <button onClick={handleSendRequest}
                            disabled={loading || goalStatement.length < 20}
                            className="btn-primary flex-1 py-2.5 text-sm">
                      {loading ? (
                        <><span className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> Sending…</>
                      ) : (
                        <><i className="fas fa-paper-plane text-xs"></i> Send Request</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
