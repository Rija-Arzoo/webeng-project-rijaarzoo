import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/apiService.jsx';
import { geminiService } from '../services/geminiService.js';

const statusConfig = {
  accepted: { label: 'Accepted', bg: '#dcfce7', color: '#16a34a' },
  rejected: { label: 'Declined', bg: '#fee2e2', color: '#dc2626' },
  pending:  { label: 'Pending',  bg: '#fef9c3', color: '#a16207' },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [aiTip, setAiTip] = useState('Consulting career strategist...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.requests.getUserRequests(user.id, user.role);
        setRequests(data);
        const tip = await geminiService.getCareerInsight(user.role, user.name);
        setAiTip(tip);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [user]);

  const handleAction = async (id, status) => {
    try {
      await api.requests.updateStatus(id, status);
      const data = await api.requests.getUserRequests(user.id, user.role);
      setRequests(data);
    } catch (err) { console.error(err); }
  };

  const handleCancelOrDelete = async (id) => {
    try {
      await api.requests.cancel(id);
      const data = await api.requests.getUserRequests(user.id, user.role);
      setRequests(data);
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-sm" style={{ color: 'var(--c-text-3)' }}>Loading your dashboard…</p>
        </div>
      </div>
    );
  }

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
            <span className="badge">{requests.length} total</span>
          </div>

          {requests.length === 0 ? (
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
                const s = statusConfig[req.status] || statusConfig.pending;
                return (
                  <div key={req.id} className="rounded-xl p-4 transition-all"
                       style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border)' }}
                       onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-border-md)'; e.currentTarget.style.background = 'var(--c-surface)'; }}
                       onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.background = 'var(--c-bg)'; }}>

                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      {/* Left – sender info */}
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

                          {/* Resume tags for alumni view */}
                          {user.role === 'alumni' && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {req.sender?.resumeSuggestedIndustry && (
                                <span className="badge">{req.sender.resumeSuggestedIndustry}</span>
                              )}
                              {req.sender?.resumeSkills?.slice(0,3).map(s => (
                                <span key={s} className="badge" style={{ background: 'var(--c-bg)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }}>{s}</span>
                              ))}
                            </div>
                          )}

                          {/* Skills for student view */}
                          {user.role === 'student' && req.sender?.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {req.sender.skills.slice(0,3).map(s => (
                                <span key={s} className="badge" style={{ background: 'var(--c-bg)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }}>{s}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right – status / actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {req.status === 'pending' && user.role === 'student' && (
                          <button onClick={() => handleCancelOrDelete(req.id)}
                                  className="btn-secondary text-xs px-3 py-1.5">
                            <i className="fas fa-ban text-xs"></i> Cancel
                          </button>
                        )}
                        {req.status === 'pending' && user.role === 'alumni' && (
                          <>
                            <button onClick={() => handleAction(req.id, 'accepted')}
                                    className="btn-primary text-xs px-3 py-1.5">
                              <i className="fas fa-check text-xs"></i> Accept
                            </button>
                            <button onClick={() => handleAction(req.id, 'rejected')}
                                    className="btn-secondary text-xs px-3 py-1.5">
                              Decline
                            </button>
                            <button onClick={() => handleCancelOrDelete(req.id)}
                                    className="text-xs px-2 py-1.5 rounded-lg transition-colors"
                                    style={{ color: 'var(--c-danger)', background: '#fee2e210' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#fee2e210'}>
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

        {/* AI Insights */}
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
              <p className="text-sm leading-relaxed flex-1" style={{ color: '#a1a1aa' }}>
                {aiTip}
              </p>
              <button className="btn-primary w-full mt-5 py-2.5 text-sm">
                <i className="fas fa-rotate text-xs"></i> Refresh Insights
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
