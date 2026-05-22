import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/apiService.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function PublicProfile() {
  const { id } = useParams();
  const { user, loading } = useAuth();

  const [person, setPerson] = useState(null);
  const [error, setError] = useState('');

  const [goalStatement, setGoalStatement] = useState('');
  const [sending, setSending] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);

  const [myRequests, setMyRequests] = useState([]);

  const pendingReq = useMemo(() => {
    if (!myRequests || myRequests.length === 0) return null;
    // For students, sender is the mentor (alumni).
    // For alumni, sender is the student.
    const match = myRequests.find((r) => {
      const senderObjId = r.sender?._id ? r.sender._id.toString() : '';
      const senderId = r.sender?.id ? r.sender.id.toString() : '';
      return senderObjId === id || senderId === id;
    });
    if (!match) return null;
    return match.status === 'pending' ? match : null;
  }, [myRequests, id]);

  const acceptedReq = useMemo(() => {
    if (!myRequests || myRequests.length === 0) return null;
    return (
      myRequests.find((r) => {
        const senderObjId = r.sender?._id ? r.sender._id.toString() : '';
        const senderId = r.sender?.id ? r.sender.id.toString() : '';
        return senderObjId === id || senderId === id;
      }) || null
    );
  }, [myRequests, id]);

  useEffect(() => {
    const loadPerson = async () => {
      setError('');
      try {
        const res = await api.users.getPublicProfile(id);
        setPerson(res.person);
      } catch (e) {
        setError(e.message || 'Failed to load profile');
      }
    };
    loadPerson();
  }, [id]);

  useEffect(() => {
    const loadMyRequests = async () => {
      if (!user) return;
      try {
        const data = await api.requests.getUserRequests(user.id, user.role);
        setMyRequests(data);
      } catch {
        // ignore
      }
    };

    if (!loading) loadMyRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const canConnectAsStudent = user && user.role === 'student' && person?.role === 'alumni';
  const canApproveAsAlumni = user && user.role === 'alumni' && person?.role === 'student';

  const handleConnect = async () => {
    if (!goalStatement.trim() || goalStatement.length < 20) return;
    setSending(true);
    setError('');
    try {
      await api.requests.send(person.id, goalStatement);
      const data = await api.requests.getUserRequests(user.id, user.role);
      setMyRequests(data);
      setGoalStatement('');
    } catch (e) {
      setError(e.message || 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!pendingReq) return;
    setSending(true);
    setError('');
    try {
      await api.requests.updateStatus(pendingReq.id, status);
      const data = await api.requests.getUserRequests(user.id, user.role);
      setMyRequests(data);
    } catch (e) {
      setError(e.message || 'Failed to update request');
    } finally {
      setSending(false);
    }
  };

  const handleCancelDelete = async () => {
    if (!pendingReq) return;
    setSending(true);
    setError('');
    try {
      await api.requests.cancel(pendingReq.id);
      const data = await api.requests.getUserRequests(user.id, user.role);
      setMyRequests(data);
    } catch (e) {
      setError(e.message || 'Failed to cancel/delete request');
    } finally {
      setSending(false);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 text-red-700 text-sm">{error}</div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <>
    <div className="space-y-5 sm:space-y-7 animate-slide-in">
      <header className="space-y-1">
        <h1 className="section-title">Profile</h1>
        <p className="section-subtitle text-base sm:text-lg">
          Review their profile and connect when you are ready.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2">
          <div className="card p-5 sm:p-7 sm:rounded-3xl">
            <div className="flex items-start gap-4">
              <button
                type="button"
                onClick={() => setShowImagePreview(true)}
                className="focus:outline-none"
                title="Open profile image"
              >
                <img
                  src={person.profilePicture || 'https://via.placeholder.com/80'}
                  alt={person.name}
                  className="w-16 h-16 sm:w-16 sm:h-16 rounded-2xl object-cover border border-slate-100 shadow-md"
                />
              </button>
              <div className="min-w-0 flex-1">
                <p className="font-black text-slate-900 text-xl sm:text-2xl truncate">
                  {person.name}
                </p>
                <p className="text-xs sm:text-sm text-indigo-700 font-bold uppercase tracking-wider mt-1 truncate">
                  {person.headline || person.company || (person.role === 'alumni' ? 'Mentor' : 'Student')}
                </p>

                {person.bio && (
                  <p className="text-slate-600 text-sm mt-3 leading-relaxed whitespace-pre-line">
                    {person.bio}
                  </p>
                )}

                {person.location && (
                  <p className="text-xs text-slate-500 mt-2">
                    <i className="fas fa-location-dot mr-2" />
                    {person.location}
                  </p>
                )}

                {person.skills?.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
                      Skills
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {person.skills.slice(0, 10).map((s) => (
                        <span
                          key={s}
                          className="inline-block px-2 py-1 bg-slate-50 border border-slate-100 rounded-full text-xs font-bold text-slate-700"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {person.role === 'student' && person.resumeSuggestedIndustry && (
                  <div className="mt-4">
                    <div className="text-xs uppercase font-bold text-indigo-700 tracking-wider mb-2">
                      Resume Insights
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="text-sm font-black text-slate-900">
                        Suggested industry: {person.resumeSuggestedIndustry}
                      </div>
                      {person.resumeSuggestedTopics?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {person.resumeSuggestedTopics.slice(0, 5).map((t) => (
                            <span
                              key={t}
                              className="inline-block px-2 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-bold"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-slate-100">
              {canConnectAsStudent && (
                <div className="space-y-3">
                  <div className="text-sm font-bold text-slate-900">Send a connection request</div>
                  <textarea
                    className="input-field resize-none"
                    rows={4}
                    value={goalStatement}
                    onChange={(e) => setGoalStatement(e.target.value)}
                    placeholder="Share your goals and why you want to connect (min 20 chars)"
                  />
                  {error && (
                    <div className="text-red-600 text-sm">{error}</div>
                  )}
                  <button
                    disabled={sending || !goalStatement.trim() || goalStatement.length < 20}
                    onClick={handleConnect}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-800 text-white text-shadow-indigo font-bold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <i className="fas fa-spinner animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center gap-2">
                        <i className="fas fa-paper-plane" />
                        Send Request
                      </span>
                    )}
                  </button>
                </div>
              )}

              {canApproveAsAlumni && (
                <div className="space-y-3">
                  <div className="text-sm font-bold text-slate-900">Manage request</div>
                  {pendingReq ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        disabled={sending}
                        onClick={() => handleUpdateStatus('accepted')}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-800 text-white text-shadow-indigo font-bold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <i className="fas fa-check mr-2" />
                        Accept
                      </button>
                      <button
                        disabled={sending}
                        onClick={() => handleUpdateStatus('rejected')}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <i className="fas fa-times mr-2" />
                        Decline
                      </button>
                      <button
                        disabled={sending}
                        onClick={handleCancelDelete}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <i className="fas fa-trash mr-2" />
                        Delete
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-600">
                      {acceptedReq?.status ? `Current status: ${acceptedReq.status}` : 'No pending request from this student.'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="card p-5 sm:p-7 sm:rounded-3xl">
            <div className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-3">
              Quick role info
            </div>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold">Role</span>
                <span className="font-black text-slate-900">{person.role}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold">Verification</span>
                <span className="font-black text-slate-900">{person.isVerified ? 'Verified' : 'Not verified'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold">Resume upload</span>
                <span className="font-black text-slate-900">{person.resumeUploadedAt ? 'Yes' : 'No'}</span>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-500">
              Students upload resumes to power tailored suggestions. Alumni manage mentorship requests based on permissions.
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
          src={person.profilePicture || 'https://via.placeholder.com/300'}
          alt={`${person.name} full size`}
          className="max-h-[85vh] max-w-[85vw] rounded-2xl shadow-2xl border border-white/20"
        />
      </div>
    )}
    </>
  );
}

