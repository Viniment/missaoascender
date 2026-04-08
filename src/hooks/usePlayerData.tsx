import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
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
        .single();

      if (data?.game_state && typeof data.game_state === 'object' && !Array.isArray(data.game_state)) {
        const saved = data.game_state as Record<string, unknown>;
        // Merge with defaults to ensure all fields exist
        setState(() => ({ ...defaultState, ...saved } as PlayerState));
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
          avatar: profile.avatar_url || prev.avatar,
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
      await supabase
        .from('player_data')
        .update({ game_state: state as unknown as Json })
        .eq('user_id', user.id);
    }, 1000); // 1s debounce

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
      .update({ game_state: resetState as unknown as Json })
      .eq('user_id', user.id);
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
