import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/apiService.jsx';
import { prefetchAfterLogin } from '../services/prefetch.js';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const menu = [
    { label: 'Dashboard', path: '/dashboard', icon: 'fa-gauge-high' },
    { label: 'Requests', path: '/requests', icon: 'fa-inbox' },
    { label: 'Find Mentors', path: '/mentors', icon: 'fa-compass', studentOnly: true },
    { label: 'Messages', path: '/chat', icon: 'fa-message' },
    { label: 'Profile', path: '/profile', icon: 'fa-circle-user' },
  ];

  const filteredMenu = menu.filter(i => !i.studentOnly || user?.role === 'student');

  useEffect(() => {
    if (user) prefetchAfterLogin(user);
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (!user) return undefined;
    const onChat = location.pathname.includes('/chat');

    const loadUnread = async () => {
      if (document.visibilityState === 'hidden' || onChat) return;
      try {
        const res = await api.chats.getUnreadTotal();
        setUnreadMessages(res.total || 0);
      } catch {
        /* ignore */
      }
    };

    if (!onChat) loadUnread();
    const id = setInterval(() => {
      if (!location.pathname.includes('/chat')) loadUnread();
    }, 120000);

    const onVisible = () => {
      if (document.visibilityState === 'visible' && !location.pathname.includes('/chat')) {
        loadUnread();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user, location.pathname]);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '??';

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: 'var(--c-bg)' }}>

      {/* ── Mobile Top Bar ── */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3"
           style={{ background: 'var(--c-sidebar)', borderBottom: '1px solid #27272a' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
               style={{ background: 'var(--c-accent)' }}>
            <i className="fas fa-graduation-cap"></i>
          </div>
          <span className="font-display font-bold text-white text-base tracking-tight">AlumniNet</span>
        </div>
        <button onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: '#a1a1aa', background: showMobileSidebar ? '#27272a' : 'transparent' }}>
          <i className={`fas fa-${showMobileSidebar ? 'xmark' : 'bars'} text-base`}></i>
        </button>
      </div>

      {/* ── Mobile Overlay ── */}
      {showMobileSidebar && (
        <div className="md:hidden fixed inset-0 z-20 top-14 bg-black/60 backdrop-blur-sm"
             onClick={() => setShowMobileSidebar(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
                        transition-transform duration-300
                        fixed top-14 md:top-0 left-0
                        h-[calc(100vh-56px)] md:h-screen
                        w-60 md:w-64
                        flex flex-col
                        z-20 md:z-30`}
             style={{ background: 'var(--c-sidebar)', borderRight: '1px solid #27272a' }}>

        {/* Logo */}
        <div className="hidden md:flex items-center gap-3 px-5 py-6 mb-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm"
               style={{ background: 'var(--c-accent)', boxShadow: '0 2px 12px rgba(45,91,227,.4)' }}>
            <i className="fas fa-graduation-cap"></i>
          </div>
          <span className="font-display font-bold text-white text-lg tracking-tight">AlumniNet</span>
        </div>

        {/* Label */}
        <div className="px-5 pb-2">
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#52525b' }}>
            Navigation
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {filteredMenu.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path}
                    onClick={() => setShowMobileSidebar(false)}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}>
                <i className={`fas ${item.icon} w-5 text-center text-sm`}></i>
                <span className="flex-1">{item.label}</span>
                {item.path === '/chat' && unreadMessages > 0 && (
                  <span className="min-w-5 h-5 px-1.5 rounded-full text-white text-xs font-bold flex items-center justify-center"
                        style={{ background: '#ef4444', fontSize: '0.68rem' }}>
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="px-3 pb-5 mt-4" style={{ borderTop: '1px solid #27272a', paddingTop: '1rem' }}>
          <div className="flex items-center gap-3 px-2 mb-3">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt=""
                   className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                   style={{ border: '2px solid #3f3f46' }} />
            ) : (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                   style={{ background: 'linear-gradient(135deg, var(--c-accent), #7b8ef5)' }}>
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate" style={{ color: '#e4e4e7' }}>{user?.name}</p>
              <p className="text-xs capitalize" style={{ color: '#71717a' }}>{user?.role}</p>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/'); setShowMobileSidebar(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ color: '#71717a', background: 'transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#27272a'; e.currentTarget.style.color = '#f87171'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#71717a'; }}>
            <i className="fas fa-arrow-right-from-bracket text-sm"></i>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content (sidebar is fixed on md+; this column scrolls alone) ── */}
      <main className="flex-1 min-h-0 md:min-h-screen w-full md:ml-64 overflow-y-auto">
        <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
