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
import AffirmationsPanel from '@/components/AffirmationsPanel';

import ChallengesPanel from '@/components/ChallengesPanel';
import AchievementsPanel from '@/components/AchievementsPanel';
import UrgeSurfingPanel from '@/components/UrgeSurfingPanel';
import StoicPanel from '@/components/StoicPanel';
import MirrorPanel from '@/components/MirrorPanel';
import CounselPanel from '@/components/CounselPanel';
import MonsterIndicator from '@/components/MonsterIndicator';
import AchievementUnlockOverlay from '@/components/AchievementUnlockOverlay';
import FailureProtocolAlert from '@/components/FailureProtocolAlert';
import AppSidebar from '@/components/AppSidebar';
import { useGame } from '@/lib/GameContext';
import { Menu, Settings, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { TAB_GROUPS, CORE_TAB_IDS, type TabId } from '@/lib/tabs';
import { cn } from '@/lib/utils';

export default function Index() {
  const { newlyUnlocked, dismissAchievement, state } = useGame();
  const hasBgPomodoro = !!(state.pomodoroStartedAt && state.pomodoroDuration && state.pomodoroMode);
  const [activeTab, setActiveTab] = useState<TabId>(hasBgPomodoro ? 'timer' : 'missions');
  const [mobileMenu, setMobileMenu] = useState(false);
  const navigate = useNavigate();
  const disabledTabs = (state.disabledTabs || []).filter(id => !CORE_TAB_IDS.includes(id as TabId));
  const isVisible = (id: TabId) => !disabledTabs.includes(id);
  const visibleGroups = TAB_GROUPS
    .map(g => ({ ...g, tabs: g.tabs.filter(t => isVisible(t.id)) }))
    .filter(g => g.tabs.length > 0);

  const renderContent = () => {
    switch (activeTab) {
      case 'missions': return <MissionsPanel />;
      case 'habits': return <HabitsPanel />;
      case 'challenges': return <ChallengesPanel />;
      case 'achievements': return <AchievementsPanel />;
      case 'mirror': return <MirrorPanel />;
      case 'counsel': return <CounselPanel />;
      case 'journal': return <JournalPanel />;
      case 'stoic': return <StoicPanel />;
      case 'affirmations': return <AffirmationsPanel />;
      case 'timer': return <PomodoroTimer />;
      case 'urge-surfing': return <UrgeSurfingPanel />;
      case 'visualizar': return <VisualizarPanel />;
      case 'awakening': return <AwakeningPage />;
      case 'rewards': return <RewardsShop />;
    }
  };

  const handleSelectTab = (id: TabId) => {
    setActiveTab(id);
    setMobileMenu(false);
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <AppSidebar activeTab={activeTab} onSelect={setActiveTab} />
        </div>

        <SidebarInset className="flex-1 min-w-0 bg-background">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
            <div className="px-4 h-14 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <SidebarTrigger className="hidden md:inline-flex text-muted-foreground hover:text-primary" />
                <button
                  onClick={() => setActiveTab('missions')}
                  className="md:hidden font-display text-lg tracking-widest text-primary glow-text-purple hover:opacity-80 transition-opacity shrink-0"
                >
                  ⟐ ASCENSÃO
                </button>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => navigate('/help')}
                  className="text-muted-foreground hover:text-primary transition-colors p-1.5"
                  title="Ajuda"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="text-muted-foreground hover:text-primary transition-colors p-1.5"
                  title="Configurações"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  className="md:hidden text-foreground p-1.5"
                  onClick={() => setMobileMenu(true)}
                  aria-label="Abrir menu"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
            </div>
          </header>

          {/* Mobile bottom sheet menu */}
          <Sheet open={mobileMenu} onOpenChange={setMobileMenu}>
            <SheetContent side="bottom" className="h-[85vh] bg-background border-border p-0 flex flex-col">
              <SheetHeader className="px-5 py-4 border-b border-border shrink-0">
                <SheetTitle className="font-display text-base tracking-widest text-primary glow-text-purple text-left">
                  NAVEGAÇÃO
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
                {visibleGroups.map(group => (
                  <div key={group.id}>
                    <p className="font-display text-[10px] tracking-[0.2em] text-foreground/40 uppercase px-3 mb-2">
                      {group.label}
                    </p>
                    <div className="space-y-1">
                      {group.tabs.map(tab => {
                        const active = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => handleSelectTab(tab.id)}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all border-l-2',
                              active
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'border-transparent text-foreground hover:bg-secondary/60'
                            )}
                          >
                            <div className={cn(
                              'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                              active ? 'bg-primary/20 text-primary' : 'bg-secondary text-foreground/60'
                            )}>
                              <tab.icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-display tracking-wider">{tab.label}</p>
                              <p className="text-[11px] text-foreground/50 truncate">{tab.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {/* Content */}
          <div className="px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left - Player */}
              <div className="lg:col-span-3 space-y-4">
                <PlayerCard />
                <MonsterIndicator />
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

              {/* Right - System (mobile only here) */}
              <div className="lg:col-span-3 space-y-4">
                <div className="lg:hidden">
                  <SystemPanel />
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>

        {/* Achievement unlock overlay */}
        <AchievementUnlockOverlay achievement={newlyUnlocked} onDismiss={dismissAchievement} />
      </div>
    </SidebarProvider>
  );
}
