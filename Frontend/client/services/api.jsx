// Mock Backend Logic mimicking the MERN Controllers
const DB_KEYS = {
  USERS: 'alumni_db_users',
  PROFILES: 'alumni_db_profiles',
  REQUESTS: 'alumni_db_requests',
  CHATS: 'alumni_db_chats'
};

const getDB = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const setDB = (key, val) => localStorage.setItem(key, JSON.stringify(val));

// Initialize mock DB if empty
if (!localStorage.getItem(DB_KEYS.USERS)) {
  const initialAlumni = [
    { id: 'a1', name: 'Dr. Sarah Chen', email: 'sarah.chen@university.edu', role: 'alumni', profilePicture: 'https://i.pravatar.cc/150?u=sarah' },
    { id: 'a2', name: 'Marcus Miller', email: 'm.miller@tech.edu', role: 'alumni', profilePicture: 'https://i.pravatar.cc/150?u=marcus' }
  ];
  const initialProfiles = [
    { userId: 'a1', headline: 'AI Researcher at DeepMind', bio: 'Helping students navigate the AI landscape with deep technical insights.', company: 'DeepMind', education: 'PhD Stanford', skills: ['Python', 'AI', 'NLP'], isVerified: true },
    { userId: 'a2', headline: 'Senior Dev at Stripe', bio: '7+ years in fintech architecture and systems design.', company: 'Stripe', education: 'MS MIT', skills: ['Systems', 'Node.js', 'Go'], isVerified: true }
  ];
  setDB(DB_KEYS.USERS, initialAlumni);
  setDB(DB_KEYS.PROFILES, initialProfiles);
  setDB(DB_KEYS.REQUESTS, []);
}

export const api = {
  auth: {
    login: async (email, password) => {
      const users = getDB(DB_KEYS.USERS);
      const user = users.find(u => u.email === email);
      if (!user) throw new Error('User not found. Check your email or register a new account.');
      return user;
    },
    register: async (data) => {
      const users = getDB(DB_KEYS.USERS);
      if (!data.email.endsWith('.edu')) throw new Error('.edu email required');
      const newUser = { id: Date.now().toString(), ...data, profilePicture: `https://i.pravatar.cc/150?u=${data.name}` };
      users.push(newUser);
      setDB(DB_KEYS.USERS, users);
      return newUser;
    }
  },
  mentors: {
    search: async (q) => {
      const users = getDB(DB_KEYS.USERS).filter(u => u.role === 'alumni');
      const profiles = getDB(DB_KEYS.PROFILES);
      return users.map(u => ({ ...u, profile: profiles.find(p => p.userId === u.id) }))
                  .filter(m => !q || m.name.toLowerCase().includes(q.toLowerCase()) || m.profile?.headline.toLowerCase().includes(q.toLowerCase()));
    }
  },
  requests: {
    send: async (menteeId, mentorId, topic, note) => {
      const reqs = getDB(DB_KEYS.REQUESTS);
      const newReq = { id: Date.now().toString(), menteeId, mentorId, topic, note, status: 'pending', timestamp: new Date().toISOString() };
      reqs.push(newReq);
      setDB(DB_KEYS.REQUESTS, reqs);
      return newReq;
    },
    getUserRequests: async (userId, role) => {
      const reqs = getDB(DB_KEYS.REQUESTS);
      const users = getDB(DB_KEYS.USERS);
      return reqs.filter(r => role === 'alumni' ? r.mentorId === userId : r.menteeId === userId)
                 .map(r => ({ ...r, sender: users.find(u => u.id === (role === 'alumni' ? r.menteeId : r.mentorId)) }));
    },
    updateStatus: async (id, status) => {
      const reqs = getDB(DB_KEYS.REQUESTS);
      const idx = reqs.findIndex(r => r.id === id);
      if (idx !== -1) {
        reqs[idx].status = status;
        setDB(DB_KEYS.REQUESTS, reqs);
      }
    }
  }
};