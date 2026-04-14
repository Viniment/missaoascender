import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlayerCard from '@/components/PlayerCard';
import SystemPanel from '@/components/SystemPanel';
import MissionsPanel from '@/components/MissionsPanel';
import PomodoroTimer from '@/components/PomodoroTimer';
import HabitsPanel from '@/components/HabitsPanel';
import JournalPanel from '@/components/JournalPanel';
import AwakeningPage from '@/components/AwakeningPage';
import RewardsShop from '@/components/RewardsShop';
import VisualizarPanel from '@/components/VisualizarPanel';

import ChallengesPanel from '@/components/ChallengesPanel';
import AchievementsPanel from '@/components/AchievementsPanel';
import AchievementUnlockOverlay from '@/components/AchievementUnlockOverlay';
import FailureProtocolAlert from '@/components/FailureProtocolAlert';
import { useGame } from '@/lib/GameContext';
import { Swords, Sparkles, BookOpen, Eye, Gift, Shield, Timer, Menu, X, Settings, Trophy, HelpCircle, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { id: 'missions', label: 'Missões', icon: Swords },
  { id: 'habits', label: 'Hábitos', icon: Sparkles },
  { id: 'challenges', label: 'Desafios', icon: Shield },
  { id: 'achievements', label: 'Conquistas', icon: Trophy },
  { id: 'journal', label: 'Diário', icon: BookOpen },
  { id: 'timer', label: 'Timer', icon: Timer },
  { id: 'visualizar', label: 'Visualizar', icon: Eye },
  { id: 'awakening', label: 'Despertar', icon: Eye },
  { id: 'rewards', label: 'Loja', icon: Gift },
] as const;

type TabId = typeof TABS[number]['id'];

export default function Index() {
  const { newlyUnlocked, dismissAchievement, state } = useGame();
  const hasBgPomodoro = !!(state.pomodoroStartedAt && state.pomodoroDuration && state.pomodoroMode);
  const [activeTab, setActiveTab] = useState<TabId>(hasBgPomodoro ? 'timer' : 'missions');
  const [mobileMenu, setMobileMenu] = useState(false);
  const navigate = useNavigate();
  const disabledTabs = state.disabledTabs || [];
  const visibleTabs = TABS.filter(tab => !disabledTabs.includes(tab.id));

  const renderContent = () => {
    switch (activeTab) {
      case 'missions': return <MissionsPanel />;
      case 'habits': return <HabitsPanel />;
      case 'challenges': return <ChallengesPanel />;
      case 'achievements': return <AchievementsPanel />;
      case 'journal': return <JournalPanel />;
      case 'timer': return <PomodoroTimer />;
      case 'visualizar': return <VisualizarPanel />;
      case 'awakening': return <AwakeningPage />;
      case 'rewards': return <RewardsShop />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => setActiveTab('missions')}
            className="font-display text-lg tracking-widest text-primary glow-text-purple hover:opacity-80 transition-opacity"
          >
            ⟐ ASCENSÃO
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/help')}
              className="text-muted-foreground hover:text-primary transition-colors"
              title="Ajuda"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="text-muted-foreground hover:text-primary transition-colors"
              title="Configurações"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              className="md:hidden text-foreground"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-1">
            {visibleTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-body transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary border-glow'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileMenu && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border bg-background"
            >
              <div className="grid grid-cols-4 gap-1 p-2">
                {visibleTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setMobileMenu(false); }}
                    className={`flex flex-col items-center gap-1 py-2 rounded-md text-xs transition-colors ${
                      activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left sidebar - Player */}
          <div className="lg:col-span-3 space-y-4">
            <PlayerCard />
            <FailureProtocolAlert />
            <div className="hidden lg:block">
              <SystemPanel />
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-6">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </div>

          {/* Right sidebar - System */}
          <div className="lg:col-span-3 space-y-4">
            <div className="lg:hidden">
              <SystemPanel />
            </div>
          </div>
        </div>
      </div>

      {/* Achievement unlock overlay */}
      <AchievementUnlockOverlay achievement={newlyUnlocked} onDismiss={dismissAchievement} />
    </div>
  );
}
