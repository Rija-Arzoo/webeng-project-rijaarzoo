import React, { useMemo, useState } from 'react';
import { api } from '../services/apiService.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useMentorshipRequests } from '../hooks/useMentorshipRequests.js';
import { requestRowId } from '../utils/requestList.js';

const CAREER_TIPS = [
  'Connect with one alumni in your target industry this week.',
  'Update your skills list to improve mentor matching.',
  'Send a clear goal when requesting mentorship — specificity gets faster replies.',
  'Review your profile headline — mentors scan it first.',
];

function hasResumeInsights(profile) {
  return Boolean(
    profile?.resumeInsightSummary ||
      profile?.resumeSuggestedIndustry ||
      profile?.resumeSkills?.length ||
      profile?.resumeSuggestedTopics?.length
  );
}

const statusConfig = {
  accepted: { label: 'Accepted', bg: '#dcfce7', color: '#16a34a' },
  rejected: { label: 'Declined', bg: '#fee2e2', color: '#dc2626' },
  pending:  { label: 'Pending',  bg: '#fef9c3', color: '#a16207' },
};

export default function Dashboard() {
  const { user, profile, fetchUserProfile, patchProfile } = useAuth();
  const {
    requests,
    loading,
    refreshing,
    cancellingIds,
    handleUpdateStatus,
    handleCancelOrDelete,
  } = useMentorshipRequests(user);

  const [aiTip] = useState(
    () => CAREER_TIPS[Math.floor(Math.random() * CAREER_TIPS.length)]
  );
  const [insightsRefreshing, setInsightsRefreshing] = useState(false);

  const resumeInsights = useMemo(() => {
    if (!hasResumeInsights(profile)) return null;
    return {
      industry: profile.resumeSuggestedIndustry,
      skills: profile.resumeSkills || [],
      topics: profile.resumeSuggestedTopics || [],
      summary: profile.resumeInsightSummary || '',
    };
  }, [profile]);

  const handleRefreshInsights = async () => {
    setInsightsRefreshing(true);
    try {
      if (profile?.resumeUploadedAt) {
        const result = await api.auth.refreshResumeInsights();
        if (result.profile) patchProfile(result.profile);
      }
      await fetchUserProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setInsightsRefreshing(false);
    }
  };

  const handleAction = async (id, status) => {
    try {
      await handleUpdateStatus(id, status);
    } catch (err) {
      console.error(err);
    }
  };

  const requestsLoading = loading && requests.length === 0;
  const acceptedCount = requests.filter(r => r.status === 'accepted').length;
  const pendingCount  = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6 pb-10 animate-fade-in">

      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--c-text-3)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="section-title">Good to see you, {user.name?.split(' ')[0]} 👋</h1>
          <p className="section-subtitle mt-1.5 text-sm">Here's what's happening in your network.</p>
        </div>
      </header>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Connections', value: acceptedCount, icon: 'fa-link', color: 'var(--c-accent)' },
          { label: 'Pending Requests', value: pendingCount, icon: 'fa-hourglass-half', color: 'var(--c-warn)' },
          { label: 'Total Requests', value: requests.length, icon: 'fa-inbox', color: 'var(--c-text-2)', className: 'col-span-2 sm:col-span-1' },
        ].map(({ label, value, icon, color, className }) => (
          <div key={label} className={`card p-5 flex items-center gap-4 ${className || ''}`}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{ background: `${color}15`, color }}>
              <i className={`fas ${icon} text-sm`}></i>
            </div>
            <div>
              <p className="font-display font-bold text-2xl leading-none" style={{ color: 'var(--c-text)' }}>{value}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: 'var(--c-text-3)' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Requests */}
        <div className="lg:col-span-2 card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-lg" style={{ color: 'var(--c-text)' }}>
              Mentorship Requests
            </h2>
            <span className="badge flex items-center gap-2">
              {requests.length} total
              {refreshing && (
                <i className="fas fa-spinner fa-spin text-xs opacity-60" aria-hidden="true" />
              )}
            </span>
          </div>

          {requestsLoading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Loading requests">
              {[0, 1].map((i) => (
                <div key={i} className="rounded-xl p-4 animate-pulse"
                     style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border)', height: '5.5rem' }} />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                   style={{ background: 'var(--c-bg)' }}>
                <i className="fas fa-inbox text-2xl" style={{ color: 'var(--c-text-3)' }}></i>
              </div>
              <p className="font-semibold mb-1" style={{ color: 'var(--c-text-2)' }}>No requests yet</p>
              <p className="text-sm" style={{ color: 'var(--c-text-3)' }}>Your mentorship connections will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => {
                const rid = requestRowId(req);
                const s = statusConfig[req.status] || statusConfig.pending;
                return (
                  <div key={rid} className="rounded-xl p-4 transition-all"
                       style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border)' }}
                       onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-border-md)'; e.currentTarget.style.background = 'var(--c-surface)'; }}
                       onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.background = 'var(--c-bg)'; }}>

                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {req.sender?.profilePicture ? (
                          <img src={req.sender.profilePicture} alt=""
                               className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                               style={{ border: '1.5px solid var(--c-border)' }} />
                        ) : (
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                               style={{ background: 'linear-gradient(135deg, var(--c-accent), #7b8ef5)' }}>
                            {req.sender?.name?.split(' ').map(n=>n[0]).join('').slice(0,2) || '??'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: 'var(--c-text)' }}>
                            {req.sender?.name}
                          </p>
                          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--c-text-3)' }}>
                            {req.topic}
                          </p>

                          {user.role === 'alumni' && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {req.sender?.resumeSuggestedIndustry && (
                                <span className="badge">{req.sender.resumeSuggestedIndustry}</span>
                              )}
                              {req.sender?.resumeSkills?.slice(0,3).map(skill => (
                                <span key={skill} className="badge" style={{ background: 'var(--c-bg)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }}>{skill}</span>
                              ))}
                            </div>
                          )}

                          {user.role === 'student' && req.sender?.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {req.sender.skills.slice(0,3).map(skill => (
                                <span key={skill} className="badge" style={{ background: 'var(--c-bg)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }}>{skill}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {req.status === 'pending' && user.role === 'student' && (
                          <button
                            type="button"
                            onClick={() => handleCancelOrDelete(rid)}
                            disabled={cancellingIds.has(rid)}
                            className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-50 disabled:pointer-events-none"
                          >
                            <i className="fas fa-ban text-xs"></i> Cancel
                          </button>
                        )}
                        {req.status === 'pending' && user.role === 'alumni' && (
                          <>
                            <button onClick={() => handleAction(rid, 'accepted')}
                                    className="btn-primary text-xs px-3 py-1.5">
                              <i className="fas fa-check text-xs"></i> Accept
                            </button>
                            <button onClick={() => handleAction(rid, 'rejected')}
                                    className="btn-secondary text-xs px-3 py-1.5">
                              Decline
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelOrDelete(rid)}
                              disabled={cancellingIds.has(rid)}
                              className="text-xs px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none"
                                    style={{ color: 'var(--c-danger)', background: '#fee2e210' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#fee2e210'; }}
                            >
                              <i className="fas fa-trash text-xs"></i>
                            </button>
                          </>
                        )}
                        {req.status !== 'pending' && (
                          <span className="px-3 py-1.5 rounded-full text-xs font-semibold"
                                style={{ background: s.bg, color: s.color }}>
                            {s.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <aside>
          <div className="card p-6 rounded-2xl relative overflow-hidden h-full"
               style={{ background: 'var(--c-sidebar)', border: '1px solid #27272a' }}>
            <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
              <i className="fas fa-brain text-9xl mt-4 mr-4" style={{ color: '#fff' }}></i>
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: 'rgba(45,91,227,.25)', color: '#93a8f5' }}>
                  <i className="fas fa-lightbulb text-sm"></i>
                </div>
                <h3 className="font-display font-bold text-base" style={{ color: '#e4e4e7' }}>AI Career Insights</h3>
              </div>
              {resumeInsights ? (
                <div className="flex-1 space-y-3 text-sm" style={{ color: '#a1a1aa' }}>
                  {resumeInsights.summary && (
                    <p className="leading-relaxed text-zinc-300">{resumeInsights.summary}</p>
                  )}
                  {resumeInsights.industry && (
                    <p>
                      <span className="font-semibold text-zinc-300">Industry:</span>{' '}
                      {resumeInsights.industry}
                    </p>
                  )}
                  {resumeInsights.skills.length > 0 && (
                    <div>
                      <p className="font-semibold text-zinc-300 mb-1.5">Skills from resume</p>
                      <div className="flex flex-wrap gap-1.5">
                        {resumeInsights.skills.slice(0, 6).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: 'rgba(255,255,255,.08)', color: '#e4e4e7' }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {resumeInsights.topics.length > 0 && (
                    <div>
                      <p className="font-semibold text-zinc-300 mb-1">Mentorship focus</p>
                      <ul className="list-disc pl-4 space-y-1">
                        {resumeInsights.topics.slice(0, 3).map((topic) => (
                          <li key={topic}>{topic}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm leading-relaxed flex-1" style={{ color: '#a1a1aa' }}>
                  {aiTip}
                  <span className="block mt-3 text-xs text-zinc-500">
                    Upload your resume on Profile to unlock personalized insights here.
                  </span>
                </p>
              )}
              <button
                type="button"
                onClick={handleRefreshInsights}
                disabled={insightsRefreshing}
                className="btn-primary w-full mt-5 py-2.5 text-sm disabled:opacity-60"
              >
                <i className={`fas fa-rotate text-xs${insightsRefreshing ? ' fa-spin' : ''}`}></i>
                {insightsRefreshing ? ' Refreshing…' : ' Refresh Insights'}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
