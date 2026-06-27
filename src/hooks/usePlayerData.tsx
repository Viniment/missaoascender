import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { VALID_PUNISHMENT_CATEGORIES, normalizePlayerStateForToday } from '@/lib/gameStore';
import type { PlayerState } from '@/lib/gameStore';
import type { Json } from '@/integrations/supabase/types';

export function usePlayerData(
  state: PlayerState,
  setState: (updater: (prev: PlayerState) => PlayerState) => void,
  defaultState: PlayerState,
) {
  const { user } = useAuth();
  const loaded = useRef(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();
  const lastSaved = useRef<string>('');

  // Load data from Supabase on login
  useEffect(() => {
    if (!user || loaded.current) return;

    const load = async () => {
      const { data } = await supabase
        .from('player_data')
        .select('game_state')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.game_state && typeof data.game_state === 'object' && !Array.isArray(data.game_state) && Object.keys(data.game_state as object).length > 0) {
        const saved = data.game_state as Record<string, unknown>;
        const merged = normalizePlayerStateForToday({ ...defaultState, ...saved } as PlayerState);
        // Filter out invalid punishment categories (e.g. legacy "Controle")
        if (Array.isArray(merged.punishments)) {
          merged.punishments = merged.punishments.filter(p => VALID_PUNISHMENT_CATEGORIES.includes(p.category));
        }
        // Cleanup: remove disabled tabs of features that no longer exist in the app
        const REMOVED_TABS = ['visualizar', 'affirmations', 'urge-surfing', 'identity', 'stoic', 'challenges'];
        if (Array.isArray(merged.disabledTabs)) {
          merged.disabledTabs = merged.disabledTabs.filter(t => !REMOVED_TABS.includes(t));
        }
        setState(() => merged);
      } else if (!data) {
        // Garante que existe uma linha para esse usuário (cobre contas antigas sem trigger).
        await supabase.from('player_data').insert({ user_id: user.id, game_state: {} as unknown as Json });
      }

      // Also load profile name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setState(prev => ({
          ...prev,
          name: profile.display_name || prev.name,
          avatar: profile.avatar_url ? `${profile.avatar_url}?t=${Date.now()}` : prev.avatar,
        }));
      }

      loaded.current = true;
    };

    load();
  }, [user, setState, defaultState]);

  // Auto-save to Supabase with debounce
  useEffect(() => {
    if (!user || !loaded.current) return;

    const stateJson = JSON.stringify(state);
    if (stateJson === lastSaved.current) return;

    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(async () => {
      lastSaved.current = stateJson;
      const { error } = await supabase
        .from('player_data')
        .upsert(
          { user_id: user.id, game_state: state as unknown as Json },
          { onConflict: 'user_id' },
        );
      if (error) console.error('[player_data] save error:', error);
    }, 800); // debounce

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [state, user]);

  // Reset loaded flag on logout
  useEffect(() => {
    if (!user) {
      loaded.current = false;
      lastSaved.current = '';
    }
  }, [user]);

  const resetProgress = useCallback(async () => {
    if (!user) return;
    const resetState = { ...defaultState, name: state.name, avatar: state.avatar };
    setState(() => resetState);
    await supabase
      .from('player_data')
      .upsert(
        { user_id: user.id, game_state: resetState as unknown as Json },
        { onConflict: 'user_id' },
      );
  }, [user, setState, defaultState, state.name, state.avatar]);

  const deleteAccount = useCallback(async () => {
    if (!user) return;
    // Delete player data and profile (cascade will handle on user delete)
    await supabase.from('player_data').delete().eq('user_id', user.id);
    await supabase.from('profiles').delete().eq('user_id', user.id);
    await supabase.auth.signOut();
  }, [user]);

  return { resetProgress, deleteAccount, loaded: loaded.current };
}
