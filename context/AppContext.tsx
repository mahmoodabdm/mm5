import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import colors from '@/constants/colors';

export type Paper = {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  abstract: string;
  citationCount: number;
  source: 'Semantic Scholar' | 'arXiv';
  url: string;
  savedAt?: string;
  isFallback?: boolean;
};

type ThemeMode = 'system' | 'light' | 'dark';

type AppContextValue = {
  savedPapers: Paper[];
  savePaper: (paper: Paper) => void;
  removePaper: (id: string) => void;
  isSaved: (id: string) => boolean;
  papers: Paper[];
  setPapers: (papers: Paper[]) => void;
  themeMode: ThemeMode;
  isDark: boolean;
  palette: typeof colors.light;
  toggleTheme: () => void;
  registerPaperView: () => boolean;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [savedPapers, setSavedPapers] = useState<Paper[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    void Promise.all([
      AsyncStorage.getItem('albahith.saved'),
      AsyncStorage.getItem('albahith.theme'),
    ]).then(([saved, theme]) => {
      if (saved) {
        try {
          setSavedPapers(JSON.parse(saved) as Paper[]);
        } catch {
          setSavedPapers([]);
        }
      }
      if (theme === 'system' || theme === 'light' || theme === 'dark') {
        setThemeMode(theme);
      }
    });
  }, []);

  const savePaper = (paper: Paper) => {
    setSavedPapers((current) => {
      if (current.some((item) => item.id === paper.id)) return current;
      const next = [{ ...paper, savedAt: new Date().toISOString() }, ...current];
      void AsyncStorage.setItem('albahith.saved', JSON.stringify(next));
      return next;
    });
  };

  const removePaper = (id: string) => {
    setSavedPapers((current) => {
      const next = current.filter((paper) => paper.id !== id);
      void AsyncStorage.setItem('albahith.saved', JSON.stringify(next));
      return next;
    });
  };

  const toggleTheme = () => {
    setThemeMode((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      void AsyncStorage.setItem('albahith.theme', next);
      return next;
    });
  };

  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');
  const palette = isDark ? colors.dark : colors.light;

  const value = useMemo<AppContextValue>(() => ({
    savedPapers,
    savePaper,
    removePaper,
    isSaved: (id) => savedPapers.some((paper) => paper.id === id),
    papers,
    setPapers,
    themeMode,
    isDark,
    palette,
    toggleTheme,
    registerPaperView: () => {
      const next = viewCount + 1;
      setViewCount(next);
      return next % 3 === 0;
    },
  }), [isDark, palette, papers, savedPapers, themeMode, viewCount]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}