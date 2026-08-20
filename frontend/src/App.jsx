import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Sidebar } from './components/Sidebar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { ResumePage } from './pages/ResumePage';
import { AIInterviewPage } from './pages/AIInterviewPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { JobTrackerPage } from './pages/JobTrackerPage';
import { DsaTrackerPage } from './pages/DsaTrackerPage';
import { ChatMentorPage } from './pages/ChatMentorPage';
import { CodingProfilesPage } from './pages/CodingProfilesPage';
import { LeetCodeIntelligencePage } from './pages/LeetCodeIntelligencePage';
import { GitHubIntelligencePage } from './pages/GitHubIntelligencePage';
import { ProfilePage } from './pages/ProfilePage';
import { PracticePage } from './pages/PracticePage';
import { SharedChatPage } from './pages/SharedChatPage';
import { loginUser, registerUser, googleLoginUser } from './services/auth.api';
import { setSession } from './app/store';
import { api } from './services/api';
import { queryClient } from './app/queryClient';
import { TopNav } from './components/TopNav';
import { Footer } from './components/Footer';

function GmailCallbackHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('code');
    if (code) {
      api.get(`/gmail/callback?code=${code}`).then(() => {
        navigate('/profile');
      }).catch(() => {
        navigate('/profile');
      });
    } else {
      navigate('/profile');
    }
  }, [location, navigate]);

  return (
    <div className="flex h-screen items-center justify-center p-6 text-center font-medium text-[#6F7068]">
      Connecting Gmail OAuth Account...
    </div>
  );
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isChatMentor = location.pathname === '/chat-mentor';
  const isWorkspace =
    !['/', '/login', '/register', '/forgot-password'].includes(location.pathname) &&
    !location.pathname.startsWith('/shared/chat');

  // Hide footer on full-page chat workspace
  const showFooter = isWorkspace && !isChatMentor;

  async function handleLoginSubmit(formData) {
    setLoading(true);
    try {
      const data = await loginUser(formData);
      queryClient.clear();
      dispatch(setSession({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken }));
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(formData) {
    setLoading(true);
    try {
      const data = await registerUser(formData);
      queryClient.clear();
      dispatch(setSession({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken }));
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth(payload) {
    setLoading(true);
    try {
      const body = typeof payload === 'string' ? { credential: payload } : payload;
      const data = await googleLoginUser(body);
      queryClient.clear();
      dispatch(setSession({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken }));
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`${isChatMentor ? 'h-screen overflow-hidden' : 'min-h-screen'} bg-[#F8F6F0] text-[#20211E] font-sans antialiased selection:bg-[#E8F0EA] selection:text-[#315B45]`}>
      {isWorkspace ? <Sidebar /> : null}
      <div className={isWorkspace ? (isChatMentor ? 'lg:pl-60 h-screen flex flex-col overflow-hidden' : 'lg:pl-60 min-h-screen flex flex-col') : 'min-h-screen flex flex-col'}>
        {isWorkspace && <TopNav />}
        <div className={`flex-1 flex flex-col min-h-0 ${isChatMentor ? 'h-full overflow-hidden' : ''}`}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/resume" element={<ProtectedRoute><ResumePage /></ProtectedRoute>} />
            <Route path="/job-tracker" element={<ProtectedRoute><JobTrackerPage /></ProtectedRoute>} />
            <Route path="/interview-prep" element={<ProtectedRoute><AIInterviewPage /></ProtectedRoute>} />
            <Route path="/interview-prep/:id" element={<ProtectedRoute><AIInterviewPage /></ProtectedRoute>} />
            <Route path="/coding-profiles" element={<ProtectedRoute><CodingProfilesPage /></ProtectedRoute>} />
            <Route path="/coding-profiles/leetcode" element={<ProtectedRoute><LeetCodeIntelligencePage /></ProtectedRoute>} />
            <Route path="/coding-profiles/github" element={<ProtectedRoute><GitHubIntelligencePage /></ProtectedRoute>} />
            <Route path="/leetcode" element={<Navigate to="/coding-profiles/leetcode" replace />} />
            <Route path="/dsa-tracker" element={<ProtectedRoute><DsaTrackerPage /></ProtectedRoute>} />
            <Route path="/practice/:topic" element={<ProtectedRoute><PracticePage /></ProtectedRoute>} />
            <Route path="/roadmap" element={<ProtectedRoute><RoadmapPage /></ProtectedRoute>} />
            <Route path="/chat-mentor" element={<ProtectedRoute><ChatMentorPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/shared/chat/:token" element={<SharedChatPage />} />
            <Route path="/gmail/callback" element={<GmailCallbackHandler />} />
            <Route path="/login" element={<AuthPage title="Welcome back" mode="login" loading={loading} onSubmit={handleLoginSubmit} onGoogleAuth={handleGoogleAuth} />} />
            <Route path="/register" element={<AuthPage title="Create your account" mode="register" loading={loading} onSubmit={handleRegisterSubmit} onGoogleAuth={handleGoogleAuth} />} />
            <Route path="/forgot-password" element={<AuthPage title="Reset your password" mode="forgot-password" />} />
          </Routes>
        </div>
        {showFooter && <Footer />}
      </div>
    </div>
  );
}
