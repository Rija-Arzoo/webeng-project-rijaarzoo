import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const HOW_IT_WORKS_VIDEO = '/videos/how-it-works.mp4';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!videoOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setVideoOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => videoRef.current?.play?.(), 100);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
  }, [videoOpen]);

  const openVideo = () => setVideoOpen(true);
  const closeVideo = () => {
    videoRef.current?.pause?.();
    setVideoOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 overflow-hidden">

      {/* ── Navigation ── */}
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-200/80'
          : 'bg-white/70 backdrop-blur-md border-b border-transparent'
      }`}>
        <div className="container-max py-3 sm:py-4 flex justify-between items-center">

          {/* Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 text-white p-2 sm:p-2.5 rounded-xl shadow-md shadow-indigo-500/30 flex items-center justify-center">
              <i className="fas fa-network-wired text-sm sm:text-base"></i>
            </div>
            <span className="font-black text-lg sm:text-xl tracking-tight text-slate-900 hidden sm:inline">
              Alumni<span className="text-indigo-600">Net</span>
            </span>
          </div>

          {/* Nav links (desktop) */}
          <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-500">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#testimonials" className="hover:text-indigo-600 transition-colors">Stories</a>
            <a href="#stats" className="hover:text-indigo-600 transition-colors">Network</a>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/login"
              className="font-semibold text-slate-600 hover:text-indigo-600 transition-colors text-xs sm:text-sm px-2 py-1">
              Sign In
            </Link>
            <Link to="/register"
              className="bg-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm
                         hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-105
                         transition-all duration-200 shadow-md text-shadow-none">
              Join Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="relative pt-28 sm:pt-36 pb-16 sm:pb-24">
        {/* Background blobs */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-24 sm:top-40 left-1/2 -translate-x-1/2 w-72 h-72 sm:w-[480px] sm:h-[480px]
                          bg-indigo-300 rounded-full blur-3xl opacity-15 animate-pulse"></div>
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute top-1/2 -left-32 w-64 h-64 bg-violet-100 rounded-full blur-3xl opacity-20"></div>
        </div>

        <div className="container-max text-center relative">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5
                          bg-indigo-50 border border-indigo-200/70 text-indigo-600
                          rounded-full text-xs sm:text-sm font-bold tracking-wider uppercase
                          mb-7 sm:mb-9 hover:bg-indigo-100 transition-colors cursor-default shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse inline-block"></span>
            Exclusive Academic Network
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900
                         mb-5 sm:mb-7 tracking-tight leading-[1.08]">
            The Future of{' '}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
              Mentorship
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 sm:mb-14 leading-relaxed font-medium">
            Connect with elite alumni mentors and accelerate your career at the world's most innovative tech companies.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-5 mb-14 sm:mb-20">
            <Link
              to="/register"
              className="btn-primary text-white text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-5 rounded-2xl
                         hover:!text-white focus:!text-white hover:shadow-2xl hover:shadow-indigo-500/25
                         hover:scale-105 transition-all duration-200"
            >
              <i className="fas fa-rocket mr-2.5" aria-hidden="true"></i>
              Start Your Journey
            </Link>
            <button
              type="button"
              onClick={openVideo}
              className="btn-outline text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-5 rounded-2xl
                         hover:shadow-lg transition-all duration-200"
              aria-haspopup="dialog"
              aria-expanded={videoOpen}
            >
              <i className="fas fa-play-circle mr-2.5" aria-hidden="true"></i>
              How it Works
            </button>
          </div>

          {/* How it Works video modal */}
          {videoOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-900/80 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-label="How AlumniNet works"
              onClick={closeVideo}
            >
              <div
                className="relative w-full max-w-4xl bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={closeVideo}
                  className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-black/50 text-white
                             hover:bg-black/70 flex items-center justify-center transition-colors"
                  aria-label="Close video"
                >
                  <i className="fas fa-times"></i>
                </button>
                <video
                  ref={videoRef}
                  className="w-full aspect-video bg-black"
                  controls
                  playsInline
                  preload="metadata"
                  src={HOW_IT_WORKS_VIDEO}
                >
                  <track kind="captions" />
                  Your browser does not support video playback.
                </video>
                <p className="px-4 py-3 text-sm text-slate-400 text-center">
                  See how students connect with alumni mentors in three simple steps.
                </p>
              </div>
            </div>
          )}

          {/* Trusted by strip */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-16 sm:mb-20">
            <div className="flex -space-x-2.5">
              {[
                { init: 'SC', hue: '230' },
                { init: 'AK', hue: '270' },
                { init: 'JB', hue: '200' },
                { init: 'MR', hue: '320' },
                { init: '+', hue: '250' },
              ].map(({ init, hue }, i) => (
                <div key={i}
                     className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center
                                text-white text-xs font-bold shadow-sm"
                     style={{ background: `hsl(${hue}, 65%, 52%)` }}>
                  {init === '+' ? '9k' : init}
                </div>
              ))}
            </div>
            <p className="text-sm font-semibold text-slate-500">
              Trusted by <span className="text-slate-800 font-bold">10,000+</span> students & alumni
            </p>
          </div>

          {/* Feature Cards */}
          <div id="features" className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: 'fas fa-chart-line',
                title: 'Fast Growth',
                desc: 'Accelerate your career with personalized guidance from industry experts who\'ve done it before.',
                color: 'from-indigo-500 to-indigo-600',
              },
              {
                icon: 'fas fa-globe-asia',
                title: 'Global Network',
                desc: 'Connect with mentors from top tech companies and innovative startups across the world.',
                color: 'from-violet-500 to-indigo-500',
              },
              {
                icon: 'fas fa-lightbulb',
                title: 'Real Insights',
                desc: 'Get real-world advice and practical strategies that textbooks simply don\'t teach.',
                color: 'from-indigo-400 to-cyan-500',
              },
            ].map((feature, idx) => (
              <div key={idx}
                   className="card p-6 sm:p-8 rounded-2xl sm:rounded-3xl group cursor-default
                              hover:shadow-xl hover:shadow-indigo-100/60 hover:-translate-y-1 transition-all duration-300">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${feature.color}
                                 text-white flex items-center justify-center text-xl sm:text-2xl mb-5
                                 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                  <i className={feature.icon}></i>
                </div>
                <h3 className="font-black text-slate-900 mb-2 text-base sm:text-lg tracking-tight">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Stats Bar ── */}
      <section id="stats" className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-500 py-14 sm:py-18">
          {/* subtle pattern */}
          <div className="absolute inset-0 opacity-10"
               style={{
                 backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                 backgroundSize: '28px 28px',
               }}></div>
          <div className="container-max relative">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 text-center text-white">
              {[
                { number: '500+', label: 'Verified Mentors', icon: 'fa-user-tie' },
                { number: '10K+', label: 'Success Stories',  icon: 'fa-star' },
                { number: '50+',  label: 'Top Companies',    icon: 'fa-building' },
              ].map((stat, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-1">
                    <i className={`fas ${stat.icon} text-white text-lg`}></i>
                  </div>
                  <p className="text-4xl sm:text-5xl font-black tracking-tight">{stat.number}</p>
                  <p className="text-indigo-100 font-semibold text-sm sm:text-base">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-16 sm:py-24 bg-white">
        <div className="container-max">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full
                            text-xs font-black tracking-widest uppercase mb-4 border border-indigo-200/60">
              Student Stories
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              What Mentees Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                name: 'Sarah Chen',
                role: 'Software Engineer @ Google',
                comment: 'My mentor helped me prepare for every interview round. I genuinely could not have landed this role without AlumniNet.',
                avatar: 'SC',
                hue: '230',
              },
              {
                name: 'Alex Kumar',
                role: 'Product Manager @ Apple',
                comment: 'The guidance I received was invaluable. My mentor challenged my thinking and helped me grow beyond what I thought possible.',
                avatar: 'AK',
                hue: '270',
              },
              {
                name: 'Jessica Brown',
                role: 'Data Scientist @ Meta',
                comment: 'Found the perfect mentor who understood exactly where I wanted to go. Six months later I had the offer.',
                avatar: 'JB',
                hue: '200',
              },
            ].map((t, idx) => (
              <div key={idx}
                   className="card p-6 sm:p-8 rounded-2xl hover:shadow-xl hover:shadow-indigo-100/50
                              hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4">
                {/* Stars */}
                <div className="flex gap-1 text-amber-400 text-xs">
                  {[...Array(5)].map((_, i) => <i key={i} className="fas fa-star"></i>)}
                </div>
                {/* Quote */}
                <p className="text-slate-600 text-sm leading-relaxed italic flex-1">
                  "{t.comment}"
                </p>
                {/* Author */}
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
                       style={{ background: `linear-gradient(135deg, hsl(${t.hue},65%,52%), hsl(${parseInt(t.hue)+30},65%,58%))` }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="py-16 sm:py-24 bg-slate-50 border-t border-slate-200">
        <div className="container-max">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full
                            text-xs font-black tracking-widest uppercase mb-4 border border-indigo-200/60">
              Simple Process
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Get Started in 3 Steps
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-0.5
                            bg-gradient-to-r from-transparent via-indigo-300 to-transparent"></div>
            {[
              { step: '01', icon: 'fa-user-plus', title: 'Create Profile', desc: 'Sign up as a student or alumni in under 2 minutes.' },
              { step: '02', icon: 'fa-magnifying-glass', title: 'Find Your Mentor', desc: 'Browse by industry, skills, or company to find the perfect match.' },
              { step: '03', icon: 'fa-comments', title: 'Start Growing', desc: 'Send a request, connect, and begin your mentorship journey.' },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-500
                                text-white flex items-center justify-center text-2xl mb-5 shadow-lg shadow-indigo-500/25 z-10">
                  <i className={`fas ${s.icon}`}></i>
                </div>
                <span className="text-xs font-black text-indigo-400 tracking-widest mb-2">{s.step}</span>
                <h3 className="font-black text-slate-900 text-lg mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 sm:py-24 relative overflow-hidden">
        {/* glow */}
        <div className="absolute inset-0 pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(ellipse at 60% 50%, rgba(99,102,241,0.18) 0%, transparent 65%)' }}></div>
        <div className="container-max text-center relative">
          <div className="inline-block px-4 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-full
                          text-xs font-black tracking-widest uppercase mb-6 border border-indigo-500/30">
            Join Today
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-5 tracking-tight leading-tight">
            Ready to Transform<br className="hidden sm:block" /> Your Career?
          </h2>
          <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Join thousands of students connecting with mentors and achieving their professional goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register"
              className="bg-indigo-600 text-white px-10 sm:px-14 py-4 sm:py-5 rounded-2xl font-bold
                         text-base sm:text-lg text-shadow-none hover:bg-indigo-500 hover:scale-105
                         transition-all duration-200 hover:shadow-2xl hover:shadow-indigo-500/30 inline-block">
              <i className="fas fa-rocket mr-2.5"></i>
              Get Started Free
            </Link>
            <Link to="/login"
              className="border-2 border-slate-600 text-slate-300 px-10 sm:px-14 py-4 sm:py-5 rounded-2xl
                         font-bold text-base sm:text-lg hover:border-slate-400 hover:text-white
                         transition-all duration-200 inline-block">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 text-slate-400 py-14 sm:py-16">
        <div className="container-max">
          {/* Top row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand col */}
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 text-white p-2 rounded-xl shadow-md">
                  <i className="fas fa-network-wired text-sm"></i>
                </div>
                <span className="font-black text-lg text-white tracking-tight">
                  Alumni<span className="text-indigo-400">Net</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-500 max-w-xs">
                Connecting students with accomplished alumni mentors to build meaningful careers.
              </p>
              {/* Social icons */}
              <div className="flex gap-3 mt-5">
                {['fa-twitter', 'fa-linkedin', 'fa-github'].map(ic => (
                  <a key={ic} href="#"
                     className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-indigo-600
                                flex items-center justify-center transition-colors duration-200">
                    <i className={`fab ${ic} text-sm text-slate-400 hover:text-white`}></i>
                  </a>
                ))}
              </div>
            </div>

            {/* Link cols */}
            {[
              { title: 'Product',   items: ['Features', 'Pricing', 'Security', 'Changelog'] },
              { title: 'Company',   items: ['About', 'Blog', 'Careers', 'Press'] },
              { title: 'Legal',     items: ['Privacy', 'Terms', 'Cookie Policy', 'Contact'] },
            ].map((col, idx) => (
              <div key={idx}>
                <h3 className="font-bold text-white text-sm mb-4 tracking-wide">{col.title}</h3>
                <ul className="space-y-2.5">
                  {col.items.map((item, i) => (
                    <li key={i}>
                      <a href="#"
                         className="text-slate-500 hover:text-indigo-400 transition-colors text-sm">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom row */}
          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-xs sm:text-sm">
              © 2024 AlumniNet. All rights reserved.
            </p>
            <p className="text-slate-600 text-xs sm:text-sm flex items-center gap-1.5">
              Made with <i className="fas fa-heart text-rose-500 text-xs"></i> for mentorship
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
