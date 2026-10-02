import React, { useState, useEffect } from 'react';
import { Sidebar, NavigationPage } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { WifiOff, AlertTriangle, Key, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { updateSupabaseCredentials } from '@/integrations/supabase/client';

interface AppLayoutProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  onOpenCreateTask: () => void;
  onOpenSearch: () => void;
  todayProgress: {
    total: number;
    completed: number;
    remaining: number;
    percent: number;
  };
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPage,
  onNavigate,
  onOpenCreateTask,
  onOpenSearch,
  todayProgress,
  children,
}) => {
  const { isConfigured, isDemoUser, enterDemoMode } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim() && customKey.trim()) {
      updateSupabaseCredentials(customUrl.trim(), customKey.trim());
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-canvas)]">
      {/* Desktop & Tablet Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        todayProgress={{
          total: todayProgress.total,
          completed: todayProgress.completed,
          percent: todayProgress.percent,
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Offline Banner */}
        {!isOnline && (
          <div className="w-full bg-amber-500 text-white text-xs py-1.5 px-4 flex items-center justify-center gap-2 font-medium shrink-0 shadow-sm z-30">
            <WifiOff className="w-3.5 h-3.5" />
            <span>You are currently offline. Changes are saved locally and will synchronize when reconnected.</span>
          </div>
        )}

        {/* Supabase unconfigured notification bar (if user hasn't added Supabase credentials yet) */}
        {!isConfigured && !isDemoUser && (
          <div className="w-full bg-indigo-600 text-white text-xs py-2 px-4 flex flex-wrap items-center justify-between gap-2 font-medium shrink-0 shadow-sm z-30">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-200 shrink-0" />
              <span>
                Supabase credentials not configured in <code className="bg-indigo-800/80 px-1.5 py-0.5 rounded text-[11px]">.env</code>.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                className="underline underline-offset-2 hover:text-indigo-200"
              >
                Connect Supabase Now
              </button>
              <span>or</span>
              <button
                type="button"
                onClick={enterDemoMode}
                className="bg-white text-indigo-700 hover:bg-indigo-50 px-2.5 py-1 rounded-md text-xs font-semibold shadow-sm transition-colors"
              >
                Explore Demo Mode
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <Header
          onOpenSearch={onOpenSearch}
          onOpenSettings={() => onNavigate('settings')}
          todayProgress={todayProgress}
        />

        {/* Page Content Body (scrollable) */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-24 md:pb-8">
          <div className="max-w-5xl mx-auto w-full">
            {children}
          </div>
        </main>

        {/* Mobile Fixed Bottom Navigation */}
        <BottomNav
          currentPage={currentPage}
          onNavigate={onNavigate}
          onOpenCreateTask={onOpenCreateTask}
          todayRemainingCount={todayProgress.remaining}
        />
      </div>

      {/* Supabase Connection Setup Modal */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title="Connect Your Supabase Project"
        description="Enter your Supabase Project URL and Anon/Publishable Key to enable real-time cloud sync."
      >
        <form onSubmit={handleSaveCredentials} className="flex flex-col gap-4">
          <Input
            label="Supabase URL"
            placeholder="https://xyzcompany.supabase.co"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            required
          />
          <Input
            label="Supabase Anon / Public Key"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            type="password"
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value)}
            required
          />
          <div className="p-3 bg-[var(--bg-subtle)] rounded-xl text-xs text-[var(--text-secondary)] leading-relaxed">
            <p className="font-medium text-[var(--text-primary)] mb-1">Where do I find these?</p>
            In your Supabase Dashboard: go to <strong>Project Settings</strong> → <strong>API</strong> and copy the <em>Project URL</em> and <em>anon public</em> key.
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="secondary" onClick={() => setShowConfigModal(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save & Connect
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
