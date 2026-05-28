import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/apiService.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import MentorCard from '../components/MentorCard.jsx';

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Consulting',
  'Manufacturing', 'Retail', 'Media & Entertainment', 'Transportation',
];

const SKILLS_OPTIONS = [
  'AI', 'Python', 'JavaScript', 'C++', 'React', 'Node.js', 'Go', 
  'Systems Design', 'Project Management', 'Data Science', 
  'Machine Learning', 'Leadership', 'Strategy',
];

export default function MentorFinder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiRanked, setAiRanked] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // If redirected from Profile, hydrate filters from URL.
  useEffect(() => {
    const industry = searchParams.get('industry') || '';
    const skillsParam = searchParams.get('skills') || '';
    const search = searchParams.get('search') || '';

    const skillsArr = skillsParam
      ? skillsParam
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    setSelectedIndustry(industry);
    setSelectedSkills(skillsArr);
    setSearchTerm(search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.mentors.getAll({
        industry: selectedIndustry,
        skill: selectedSkills.length > 0 ? selectedSkills[0] : '',
        search: searchTerm,
      });
      setMentors(response.mentors || []);
      setAiRanked(Boolean(response.aiRanked));
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch mentors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMentors();
    }, 120);
    return () => clearTimeout(timer);
  }, [selectedIndustry, selectedSkills, searchTerm]);

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
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-50 to-indigo-50 -mx-6 md:-mx-10 px-4 sm:px-6 md:px-12 py-6 sm:py-8 mb-6 sm:mb-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="section-title">Discover Your Mentor</h1>
          <p className="section-subtitle text-sm sm:text-base max-w-2xl">
            Connect with experienced alumni mentors from leading companies worldwide
          </p>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-6xl mx-auto">
        {/* Mobile Filter Toggle */}
        <div className="md:hidden mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full py-3 px-4 btn-primary text-shadow-indigo font-bold rounded-lg flex items-center justify-between hover:bg-indigo-800 hover:shadow-indigo-500/30 transition-all"
          >
            <span><i className="fas fa-filter mr-2"></i>Filters</span>
            <i className={`fas fa-chevron-${showFilters ? 'up' : 'down'}`}></i>
          </button>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className={`md:col-span-1 ${showFilters ? 'block' : 'hidden'} md:block`}>
            <div className="card p-5 sm:p-6 sticky top-8">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <i className="fas fa-filter text-indigo-600"></i>
                Filters
              </h2>

              <div className="space-y-5">
                {/* Search */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Search
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Name or headline"
                    className="input-field text-sm"
                  />
                </div>

                {/* Industry Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Industry
                  </label>
                  <select
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="">All Industries</option>
                    {INDUSTRIES.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Skills Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Skills ({selectedSkills.length})
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {SKILLS_OPTIONS.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => handleSkillToggle(skill)}
                        className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                          selectedSkills.includes(skill)
                            ? 'btn-primary text-shadow-indigo shadow-md hover:bg-indigo-800 hover:shadow-indigo-500/30'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full btn-secondary text-sm"
                  >
                    <i className="fas fa-times mr-2"></i>
                    Clear All
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="md:col-span-3">
            {/* Result Count */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="loading-spinner w-5 h-5"></div>
                    Loading Mentors...
                  </span>
                ) : (
                  <>
                    {mentors.length} Mentor{mentors.length !== 1 ? 's' : ''} Found
                    {aiRanked && (
                      <span className="ml-2 text-sm font-semibold text-indigo-600">
                        · Ranked for your profile (Gemini)
                      </span>
                    )}
                  </>
                )}
              </h2>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-8 p-4 sm:p-6 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <p className="font-bold text-red-700 text-sm sm:text-base">Error loading mentors</p>
                <p className="text-red-600 text-xs sm:text-sm mt-1">{error}</p>
              </div>
            )}

            {/* Loading Skeleton */}
            {loading && (
              <div className="responsive-grid">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-slate-200 rounded-2xl h-80 animate-pulse" />
                ))}
              </div>
            )}

            {/* Mentors Grid */}
            {!loading && mentors.length > 0 && (
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

            {/* Empty State */}
            {!loading && mentors.length === 0 && (
              <div className="card p-12 sm:p-16 text-center border-dashed">
                <i className="fas fa-search text-slate-300 text-5xl sm:text-6xl mb-4"></i>
                <p className="text-lg sm:text-xl font-bold text-slate-600 mb-2">No mentors found</p>
                <p className="text-slate-500 text-sm sm:text-base">Try adjusting your filters or search criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}