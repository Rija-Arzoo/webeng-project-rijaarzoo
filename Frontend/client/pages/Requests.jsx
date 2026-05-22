import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/apiService.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const STATUSES = ['pending', 'accepted', 'rejected'];

export default function Requests() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('pending');
  const [error, setError] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.requests.getUserRequests(user.id, user.role);
      setRequests(data);
    } catch (e) {
      setError(e.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filtered = useMemo(() => {
    return requests.filter((r) => r.status === activeStatus);
  }, [requests, activeStatus]);

  const handleUpdateStatus = async (id, status) => {
    await api.requests.updateStatus(id, status);
    await loadRequests();
  };

  const handleCancelOrDelete = async (id) => {
    await api.requests.cancel(id);
    await loadRequests();
  };

  return (
    <div className="space-y-5 sm:space-y-7 animate-slide-in">
      <header className="space-y-1">
        <h1 className="section-title">Requests</h1>
        <p className="section-subtitle text-base sm:text-lg">
          Pending requests and their outcomes based on role permissions.
        </p>
      </header>

      <div className="card p-5 sm:p-7 sm:rounded-3xl">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setActiveStatus(s)}
              className={`px-3 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                activeStatus === s
                  ? 'bg-indigo-700 text-white text-shadow-indigo shadow-md shadow-indigo-500/30'
                  : 'bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-500">
            <i className="fas fa-spinner animate-spin mr-2" />
            Loading...
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-slate-500">
            <div className="inline-flex items-center justify-center gap-2">
              <i className="fas fa-inbox" />
              No {activeStatus} requests.
            </div>
            <div className="text-xs text-slate-400 mt-2">
              {activeStatus === 'pending' && user.role === 'student'
                ? 'Discover mentors and send requests.'
                : activeStatus === 'pending' && user.role === 'alumni'
                  ? 'Wait for student requests and approve them.'
                  : 'Nothing to do here yet.'}
            </div>
            {activeStatus === 'pending' && user.role === 'student' && (
              <div className="mt-4">
                <button
                  className="btn-primary text-xs sm:text-sm"
                  onClick={() => navigate('/mentors')}
                >
                  <i className="fas fa-compass mr-2" />
                  Find mentors
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filtered.map((req) => (
              <div
                key={req.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={req.sender?.profilePicture}
                      alt=""
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover shadow-md flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">
                        {req.sender?.name}
                      </p>
                      <p className="text-xs text-slate-600 mt-1 truncate">
                        {user.role === 'alumni' ? 'Student message: ' : 'Your message: '}
                        {req.topic}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {req.status === 'pending' && user.role === 'student' && (
                      <button
                        onClick={() => handleCancelOrDelete(req.id)}
                        className="px-4 py-2 rounded-xl font-bold text-xs sm:text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                      >
                        <i className="fas fa-ban mr-2" />
                        Cancel
                      </button>
                    )}

                    {req.status === 'pending' && user.role === 'alumni' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'accepted')}
                          className="px-4 py-2 rounded-xl font-bold text-xs sm:text-sm bg-indigo-600 text-white text-shadow-indigo hover:bg-indigo-800 hover:shadow-indigo-500/30 transition-all"
                        >
                          <i className="fas fa-check mr-2" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'rejected')}
                          className="px-4 py-2 rounded-xl font-bold text-xs sm:text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                        >
                          <i className="fas fa-times mr-2" />
                          Decline
                        </button>
                        <button
                          onClick={() => handleCancelOrDelete(req.id)}
                          className="px-4 py-2 rounded-xl font-bold text-xs sm:text-sm bg-red-50 text-red-700 hover:bg-red-100 transition-all"
                        >
                          <i className="fas fa-trash mr-2" />
                          Delete
                        </button>
                      </>
                    )}

                    {req.status !== 'pending' && (
                      <span
                        className={`px-3 py-2 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider ${
                          req.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-700'
                            : req.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {req.status}
                      </span>
                    )}

                    <button
                      onClick={() => navigate('/chat')}
                      className="px-3 py-2 rounded-xl font-bold text-xs sm:text-sm bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                      title="Open your messages"
                    >
                      <i className="fas fa-envelope mr-2" />
                      Messages
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

