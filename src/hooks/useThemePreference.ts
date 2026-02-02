import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export function useThemePreference(user: User | null) {
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference from database when user logs in
  useEffect(() => {
    const loadThemePreference = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('tema_preferencia')
          .eq('user_id', user.id)
          .single();

        if (!error && data?.tema_preferencia) {
          setTheme(data.tema_preferencia);
        }
      } catch (err) {
        console.error('Error loading theme preference:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, [user, setTheme]);

  // Save theme preference to database when it changes
  const saveThemePreference = async (newTheme: string) => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({ tema_preferencia: newTheme })
        .eq('user_id', user.id);
    } catch (err) {
      console.error('Error saving theme preference:', err);
    }
  };

  // Wrapper for setTheme that also persists to DB
  const setThemeWithPersistence = (newTheme: string) => {
    setTheme(newTheme);
    saveThemePreference(newTheme);
  };

  return {
    theme,
    setTheme: setThemeWithPersistence,
    isLoading,
  };
}
