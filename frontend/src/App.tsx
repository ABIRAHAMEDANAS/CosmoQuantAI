import React, { useState, useCallback, useEffect } from 'react';
import PublicWebsite from '@/pages/public/PublicWebsite';
import AppDashboard from '@/pages/app/AppDashboard';
import LoginTransition from '@/pages/app/LoginTransition';
import SignUpFormModal from '@/pages/public/SignUpFormModal';
import LoginFormModal from '@/pages/public/LoginFormModal';
import ForgotPasswordModal from '@/pages/public/ForgotPasswordModal';
import ResetPasswordScreen from '@/pages/public/ResetPasswordScreen';
import { AppView } from '@/types';

// AppState Enum আপডেট
enum AppState {
  PUBLIC,
  SHOW_SIGNUP_MODAL,
  SHOW_LOGIN_MODAL,
  SHOW_FORGOT_PASSWORD_MODAL,
  RESET_PASSWORD_SCREEN,
  LOGGING_IN_TRANSITION,
  LOGGED_IN,
}

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.PUBLIC);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [activeSettingsSection, setActiveSettingsSection] = useState<string | null>(null);

  useEffect(() => {
    // ✅ এই অংশটি আবার চালু (Uncomment) করে দিন
    // এটি চেক করবে লোকাল স্টোরেজে টোকেন আছে কি না।
    // টোকেন থাকলে সরাসরি ড্যাশবোর্ডে নিয়ে যাবে (রিফ্রেশ দিলেও)।
    const token = localStorage.getItem('accessToken');
    if (token) {
      setAppState(AppState.LOGGED_IN);
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const resetTokenParam = searchParams.get('token');

    if (resetTokenParam) {
      setResetToken(resetTokenParam);
      setAppState(AppState.RESET_PASSWORD_SCREEN);
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  const handleForgotPasswordInitiate = useCallback(() => {
    setAppState(AppState.SHOW_FORGOT_PASSWORD_MODAL);
  }, []);

  const handleResetSuccess = useCallback(() => {
    setAppState(AppState.SHOW_LOGIN_MODAL);
  }, []);

  const handleBackToLogin = useCallback(() => {
    setAppState(AppState.SHOW_LOGIN_MODAL);
  }, []);

  const handleLoginInitiate = useCallback(() => {
    setAppState(AppState.SHOW_LOGIN_MODAL);
  }, []);

  const handleSignUpInitiate = useCallback(() => {
    setAppState(AppState.SHOW_SIGNUP_MODAL);
  }, []);

  // সাইনআপ থেকে লগইন মোডালে যাওয়ার জন্য
  const switchToLogin = useCallback(() => {
    setAppState(AppState.SHOW_LOGIN_MODAL);
  }, []);

  // লগইন থেকে সাইনআপ মোডালে যাওয়ার জন্য
  const switchToSignUp = useCallback(() => {
    setAppState(AppState.SHOW_SIGNUP_MODAL);
  }, []);

  // লগইন বা সাইনআপ সফল হওয়ার পর (API কল সাকসেস হলে)
  const handleAuthSuccess = useCallback(() => {
    setAppState(AppState.LOGGING_IN_TRANSITION);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('accessToken'); // টোকেন মুছে ফেলুন
    setAppState(AppState.PUBLIC);
    setCurrentView(AppView.DASHBOARD);
    // পেজ রিফ্রেশ করে দিলে সব ক্লিন হয়ে যাবে (Context reset)
    window.location.reload();
  }, []);

  const handleNavigation = useCallback((view: AppView, section?: string) => {
    setCurrentView(view);
    setActiveSettingsSection(section || null);
  }, []);

  const renderContent = () => {
    switch (appState) {
      case AppState.SHOW_FORGOT_PASSWORD_MODAL:
        return (
          <>
            <PublicWebsite onLogin={handleLoginInitiate} onSignUp={handleSignUpInitiate} />
            <ForgotPasswordModal
              onClose={() => setAppState(AppState.PUBLIC)}
              onBackToLogin={handleBackToLogin}
            />
          </>
        );

      case AppState.RESET_PASSWORD_SCREEN:
        if (!resetToken) return <PublicWebsite onLogin={handleLoginInitiate} onSignUp={handleSignUpInitiate} />;
        return <ResetPasswordScreen token={resetToken} onResetSuccess={handleResetSuccess} />;

      // সাইনআপ মোডাল রেন্ডারিং
      case AppState.SHOW_SIGNUP_MODAL:
        return (
          <>
            <PublicWebsite onLogin={handleLoginInitiate} onSignUp={handleSignUpInitiate} />
            <SignUpFormModal
              onClose={() => setAppState(AppState.PUBLIC)}
              onRegister={handleAuthSuccess} // সাকসেস হলে ট্রানজিশন হবে
            />
          </>
        );

      // লগইন মোডাল রেন্ডারিং (নতুন)
      case AppState.SHOW_LOGIN_MODAL:
        return (
          <>
            <PublicWebsite onLogin={handleLoginInitiate} onSignUp={handleSignUpInitiate} />
            <LoginFormModal
              onClose={() => setAppState(AppState.PUBLIC)}
              onLoginSuccess={handleAuthSuccess}
              onSwitchToSignup={switchToSignUp}
              onSwitchToForgotPassword={handleForgotPasswordInitiate}
            />
          </>
        );

      case AppState.LOGGING_IN_TRANSITION:
        return <LoginTransition onAnimationComplete={() => setAppState(AppState.LOGGED_IN)} />;

      case AppState.LOGGED_IN:
        return (
          <AppDashboard
            currentView={currentView}
            onNavigate={handleNavigation}
            onLogout={handleLogout}
            activeSettingsSection={activeSettingsSection}
          />
        );

      case AppState.PUBLIC:
      default:
        return <PublicWebsite onLogin={handleLoginInitiate} onSignUp={handleSignUpInitiate} />;
    }
  };

  return (
    <div className="min-h-screen font-sans">
      {renderContent()}
    </div>
  );
}

export default App;
