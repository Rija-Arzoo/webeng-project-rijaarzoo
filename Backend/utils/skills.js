/** Normalize skill for display/storage (title case variants). */
export const normalizeSkillDisplay = (value) => {
  const raw = (value || '').toString().trim();
  const key = raw.toLowerCase();
  if (key === 'js' || key === 'javascript') return 'JavaScript';
  if (key === 'cpp' || key === 'c++') return 'C++';
  return raw;
};

/** Normalize skill for filter comparison (lowercase). */
export const normalizeSkillFilter = (value) => {
  const key = (value || '').toString().trim().toLowerCase();
  if (key === 'js' || key === 'javascript') return 'javascript';
  if (key === 'cpp' || key === 'c++') return 'c++';
  return key;
};

export const parseSkillsInput = (skills) => {
  if (Array.isArray(skills)) {
    return skills.map(normalizeSkillDisplay).filter(Boolean);
  }
  if (typeof skills === 'string') {
    return skills.split(',').map(normalizeSkillDisplay).filter(Boolean);
  }
  return undefined;
};

export const SKILL_PATTERNS = [
  { skill: 'AI', re: /(ai|artificial intelligence|llm|large language model)/i },
  { skill: 'Machine Learning', re: /(machine learning|\bml\b|deep learning|neural network)/i },
  { skill: 'NLP', re: /\b(nlp|natural language processing)\b/i },
  { skill: 'Data Science', re: /(data science|data scientist)/i },
  { skill: 'Python', re: /\bpython\b/i },
  { skill: 'JavaScript', re: /\bjavascript\b|\bjs\b/i },
  { skill: 'C++', re: /\b(c\+\+|cpp)\b/i },
  { skill: 'React', re: /\breact\b/i },
  { skill: 'Node.js', re: /(node\.?js|nodejs|\bnode\b)/i },
  { skill: 'Go', re: /\bgo\b/i },
  { skill: 'Systems Design', re: /(systems design|system design|architecture|distributed systems)/i },
  { skill: 'Project Management', re: /(project management|agile|scrum)/i },
  { skill: 'Leadership', re: /(leadership|tech lead|team lead|mentorship|leading)/i },
  { skill: 'Strategy', re: /(strategy|strategic|roadmap|planning)/i },
];

export const ALLOWED_RESUME_SKILLS = new Set([
  'AI',
  'Python',
  'JavaScript',
  'C++',
  'React',
  'Node.js',
  'Go',
  'Systems Design',
  'Project Management',
  'Data Science',
  'Machine Learning',
  'Leadership',
  'Strategy',
]);

export const INDUSTRY_PATTERNS = [
  { industry: 'Technology', re: /(software|cloud|backend|frontend|engineering|technology|devops)/i },
  { industry: 'Finance', re: /(finance|fintech|bank|investment|payments|trading|wealth|credit)/i },
  { industry: 'Healthcare', re: /(healthcare|medical|clinical|hospital|pharma|biomedical)/i },
  { industry: 'Education', re: /(education|teaching|university|academia|curriculum|tutor)/i },
  { industry: 'Consulting', re: /(consulting|advisory|consultant|strategy consulting)/i },
  { industry: 'Manufacturing', re: /(manufacturing|industrial|factory|operations)/i },
  { industry: 'Retail', re: /(retail|ecommerce|e-commerce|consumer)/i },
  { industry: 'Media & Entertainment', re: /(media|entertainment|streaming|content|video|podcast)/i },
  { industry: 'Transportation', re: /(transportation|logistics|supply chain|shipping|aviation|mobility)/i },
];

export const extractSkillsFromText = (text) => {
  const found = new Set();
  for (const { skill, re } of SKILL_PATTERNS) {
    if (re.test(text)) found.add(skill);
  }
  return Array.from(found).filter((s) => ALLOWED_RESUME_SKILLS.has(s));
};

export const extractIndustryFromText = (text) => {
  for (const { industry, re } of INDUSTRY_PATTERNS) {
    if (re.test(text)) return industry;
  }
  return 'Technology';
};

export const suggestedTopicsForSkills = (skills, industry) => {
  const topics = [];
  const push = (t) => {
    if (!topics.includes(t)) topics.push(t);
  };

  for (const s of skills) {
    switch (s) {
      case 'AI':
        push('AI career roadmap and portfolio strategy');
        break;
      case 'Machine Learning':
        push('Machine learning project roadmap (end-to-end delivery)');
        break;
      case 'Data Science':
        push('Data science case studies and storytelling for interviews');
        break;
      case 'Python':
        push('Python projects that demonstrate real-world impact');
        break;
      case 'JavaScript':
        push('JavaScript fundamentals + practical hiring readiness');
        break;
      case 'React':
        push('React architecture and portfolio improvements');
        break;
      case 'Node.js':
        push('Backend systems and scalability practice');
        break;
      case 'Go':
        push('Systems programming projects and performance engineering');
        break;
      case 'Systems Design':
        push('Systems design preparation (framework + practice plan)');
        break;
      case 'Project Management':
        push('Agile execution and delivery roadmap planning');
        break;
      case 'Leadership':
        push('Leadership growth: mentoring, influencing, and impact');
        break;
      case 'Strategy':
        push('Career strategy: positioning and long-term roadmap');
        break;
      default:
        break;
    }
  }

  if (topics.length === 0) {
    topics.push(`A ${industry}-focused mentorship plan (portfolio + interview prep).`);
  }

  return topics.slice(0, 4);
};
