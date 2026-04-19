import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { TAB_GROUPS, CORE_TAB_IDS, type TabId } from '@/lib/tabs';
import { useGame } from '@/lib/GameContext';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  activeTab: TabId;
  onSelect: (id: TabId) => void;
}

export default function AppSidebar({ activeTab, onSelect }: AppSidebarProps) {
  const { state } = useGame();
  const { state: sidebarState } = useSidebar();
  const collapsed = sidebarState === 'collapsed';
  const disabledTabs = (state.disabledTabs || []).filter(
    (id) => !CORE_TAB_IDS.includes(id as TabId)
  );
  const isVisible = (id: TabId) => !disabledTabs.includes(id);
  const visibleGroups = TAB_GROUPS
    .map((g) => ({ ...g, tabs: g.tabs.filter((t) => isVisible(t.id)) }))
    .filter((g) => g.tabs.length > 0);

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="h-14 border-b border-border flex items-center justify-center px-3">
        <span
          className={cn(
            'font-display text-primary glow-text-purple tracking-widest transition-all',
            collapsed ? 'text-base' : 'text-base'
          )}
        >
          {collapsed ? '⟐' : '⟐ ASCENSÃO'}
        </span>
      </SidebarHeader>
      <SidebarContent className="bg-background">
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.id}>
            <SidebarGroupLabel className="font-display text-[10px] tracking-[0.2em] text-foreground/40 uppercase">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.tabs.map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <SidebarMenuItem key={tab.id}>
                      <SidebarMenuButton
                        onClick={() => onSelect(tab.id)}
                        tooltip={tab.label}
                        isActive={active}
                        className={cn(
                          'group/item relative h-9 transition-all border-l-2 rounded-md',
                          active
                            ? 'bg-primary/15 border-primary text-primary hover:bg-primary/20 hover:text-primary'
                            : 'border-transparent text-foreground/80 hover:bg-secondary hover:text-foreground'
                        )}
                      >
                        <tab.icon className="w-4 h-4 shrink-0" />
                        <span className="font-display text-sm tracking-wider truncate">
                          {tab.label}
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
