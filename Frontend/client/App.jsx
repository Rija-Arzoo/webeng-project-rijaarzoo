import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import LandingPage from './pages/LandingPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import MentorFinder from './pages/MentorFinder.jsx';
import ChatInterface from './pages/ChatInterface.jsx';
import Profile from './pages/Profile.jsx';
import Requests from './pages/Requests.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import PublicProfile from './pages/PublicProfile.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/people/:id" element={<PublicProfile />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/mentors" element={<MentorFinder />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/chat" element={<ChatInterface />} />
            <Route path="/chat/:conversationId" element={<ChatInterface />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}