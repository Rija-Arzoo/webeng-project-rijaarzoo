const DB_KEYS = {
  USERS: 'alumni_pro_users',
  PROFILES: 'alumni_pro_profiles',
  REQUESTS: 'alumni_pro_requests',
};

const getDB = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const setDB = (key, val) => localStorage.setItem(key, JSON.stringify(val));

// Initialize Mock Data
if (!localStorage.getItem(DB_KEYS.USERS)) {
  const initialUsers = [
    { id: 'a1', name: 'Dr. Sarah Chen', email: 'sarah.chen@university.edu', role: 'alumni', profilePicture: 'https://i.pravatar.cc/150?u=sarah' },
    { id: 'a2', name: 'Marcus Miller', email: 'm.miller@tech.edu', role: 'alumni', profilePicture: 'https://i.pravatar.cc/150?u=marcus' }
  ];
  const initialProfiles = [
    { userId: 'a1', company: 'DeepMind', headline: 'AI Research Lead', bio: '7+ years in machine learning. PhD from Stanford. Expert in LLMs.', skills: ['AI', 'Python', 'Research'], isVerified: true },
    { userId: 'a2', company: 'Stripe', headline: 'Staff Engineer', bio: 'Building global economic infrastructure. MS MIT. Systems design specialist.', skills: ['Node.js', 'Go', 'Systems'], isVerified: true }
  ];
  setDB(DB_KEYS.USERS, initialUsers);
  setDB(DB_KEYS.PROFILES, initialProfiles);
  setDB(DB_KEYS.REQUESTS, []);
}

export const api = {
  auth: {
    login: async (email) => {
      const user = getDB(DB_KEYS.USERS).find(u => u.email === email);
      if (!user) throw new Error('User not found. Check your email or register a new account.');
      return user;
    },
    register: async (data) => {
      const users = getDB(DB_KEYS.USERS);
      const newUser = { id: Date.now().toString(), ...data, profilePicture: `https://i.pravatar.cc/150?u=${data.name}` };
      users.push(newUser);
      setDB(DB_KEYS.USERS, users);
      return newUser;
    }
  },
  mentors: {
    search: async (q) => {
      const alumni = getDB(DB_KEYS.USERS).filter(u => u.role === 'alumni');
      const profiles = getDB(DB_KEYS.PROFILES);
      return alumni.map(u => ({ ...u, profile: profiles.find(p => p.userId === u.id) }))
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
      if (idx !== -1) reqs[idx].status = status;
      setDB(DB_KEYS.REQUESTS, reqs);
    }
  },
  chat: {
    getConversations: async (userId) => {
      const reqs = getDB(DB_KEYS.REQUESTS).filter(r => r.status === 'accepted' && (r.menteeId === userId || r.mentorId === userId));
      const users = getDB(DB_KEYS.USERS);
      return reqs.map(r => ({
        id: r.id,
        partner: users.find(u => u.id === (r.menteeId === userId ? r.mentorId : r.menteeId)),
        lastMessage: 'Session active.'
      }));
    },
    getMessages: async () => []
  }
};