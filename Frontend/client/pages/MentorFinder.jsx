import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/apiService.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import MentorCard from '../components/MentorCard.jsx';
import { readMentorsSessionCache, writeMentorsSessionCache } from '../utils/mentorCache.js';

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Consulting',
  'Manufacturing', 'Retail', 'Media & Entertainment', 'Transportation',
];

const SKILLS_OPTIONS = [
  'AI', 'Python', 'JavaScript', 'C++', 'React', 'Node.js', 'Go',
  'Systems Design', 'Project Management', 'Data Science',
  'Machine Learning', 'Leadership', 'Strategy',
];

function buildQueryString(industry, skills, search) {
  const params = new URLSearchParams();
  if (industry) params.append('industry', industry);
  if (skills.length > 0) params.append('skill', skills[0]);
  if (search) params.append('search', search);
  return params.toString();
}

export default function MentorFinder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const queryString = useMemo(
    () => buildQueryString(selectedIndustry, selectedSkills, searchTerm),
    [selectedIndustry, selectedSkills, searchTerm]
  );

  const cachedBoot = readMentorsSessionCache(queryString);
  const [mentors, setMentors] = useState(() => cachedBoot?.mentors || []);
  const [aiRanked, setAiRanked] = useState(() => Boolean(cachedBoot?.aiRanked));
  const [loading, setLoading] = useState(() => !cachedBoot?.mentors?.length);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const fetchGen = useRef(0);

  useEffect(() => {
    const industry = searchParams.get('industry') || '';
    const skillsParam = searchParams.get('skills') || '';
    const search = searchParams.get('search') || '';
    setSelectedIndustry(industry);
    setSelectedSkills(
      skillsParam ? skillsParam.split(',').map((s) => s.trim()).filter(Boolean) : []
    );
    setSearchTerm(search);
  }, [searchParams]);

  useEffect(() => {
    if (user?.role !== 'student') navigate('/dashboard');
  }, [user, navigate]);

  useEffect(() => {
    const boot = readMentorsSessionCache(queryString);
    if (boot?.mentors?.length) {
      setMentors(boot.mentors);
      setAiRanked(Boolean(boot.aiRanked));
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    if (!user || user.role !== 'student') return undefined;

    const gen = ++fetchGen.current;
    const hasData = mentors.length > 0;
    if (!hasData) setLoading(true);
    else setRefreshing(true);

    const timer = setTimeout(async () => {
      try {
        setError(null);
        const response = await api.mentors.getAll({
          industry: selectedIndustry,
          skill: selectedSkills[0] || '',
          search: searchTerm,
        });
        if (gen !== fetchGen.current) return;
        setMentors(response.mentors || []);
        setAiRanked(Boolean(response.aiRanked));
        writeMentorsSessionCache(queryString, response);
      } catch (err) {
        if (gen !== fetchGen.current) return;
        setError(err.message);
      } finally {
        if (gen === fetchGen.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }, hasData ? 400 : 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedIndustry, selectedSkills, searchTerm, queryString]);

  const handleSkillToggle = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const clearFilters = () => {
    setSelectedIndustry('');
    setSelectedSkills([]);
    setSearchTerm('');
    setSearchParams({});
  };

  const hasActiveFilters = selectedIndustry || selectedSkills.length > 0 || searchTerm;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-slate-50 to-indigo-50 -mx-6 md:-mx-10 px-4 sm:px-6 md:px-12 py-6 sm:py-8 mb-6 sm:mb-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="section-title">Discover Your Mentor</h1>
          <p className="section-subtitle text-sm sm:text-base max-w-2xl">
            Connect with experienced alumni mentors from leading companies worldwide
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="md:hidden mb-6">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full py-3 px-4 btn-primary font-bold rounded-lg flex items-center justify-between"
          >
            <span><i className="fas fa-filter mr-2"></i>Filters</span>
            <i className={`fas fa-chevron-${showFilters ? 'up' : 'down'}`}></i>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className={`md:col-span-1 ${showFilters ? 'block' : 'hidden'} md:block`}>
            <div className="card p-5 sm:p-6 sticky top-8">
              <h2 className="text-lg font-black text-slate-900 mb-4">
                <i className="fas fa-filter text-indigo-600 mr-2"></i>Filters
              </h2>
              <div className="space-y-5">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Name or headline"
                  className="input-field text-sm w-full"
                />
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="input-field text-sm w-full"
                >
                  <option value="">All Industries</option>
                  {INDUSTRIES.map((industry) => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  {SKILLS_OPTIONS.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleSkillToggle(skill)}
                      className={`px-3 py-2 text-xs font-bold rounded-lg ${
                        selectedSkills.includes(skill) ? 'btn-primary' : 'bg-slate-100'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
                {hasActiveFilters && (
                  <button type="button" onClick={clearFilters} className="w-full btn-secondary text-sm">
                    Clear All
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="mb-6 flex items-center gap-3">
              <h2 className="text-lg font-black text-slate-900">
                {loading && !mentors.length
                  ? 'Loading mentors…'
                  : `${mentors.length} Mentor${mentors.length !== 1 ? 's' : ''} Found`}
              </h2>
              {refreshing && mentors.length > 0 && (
                <i className="fas fa-sync fa-spin text-slate-400 text-sm" aria-hidden="true" />
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {loading && !mentors.length && (
              <div className="responsive-grid">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-slate-200 rounded-2xl h-80 animate-pulse" />
                ))}
              </div>
            )}

            {mentors.length > 0 && (
              <div className="responsive-grid">
                {mentors.map((mentor) => (
                  <MentorCard
                    key={mentor.user?._id || mentor._id}
                    mentor={mentor.user || mentor}
                    profile={mentor.profile}
                  />
                ))}
              </div>
            )}

            {!loading && !mentors.length && (
              <div className="card p-12 text-center border-dashed">
                <p className="font-bold text-slate-600">No mentors found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
