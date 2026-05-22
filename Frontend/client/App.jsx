import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

const Layout = lazy(() => import('./components/Layout.jsx'));
const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const MentorFinder = lazy(() => import('./pages/MentorFinder.jsx'));
const ChatInterface = lazy(() => import('./pages/ChatInterface.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Requests = lazy(() => import('./pages/Requests.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const PublicProfile = lazy(() => import('./pages/PublicProfile.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </Router>
    </AuthProvider>
  );
}
