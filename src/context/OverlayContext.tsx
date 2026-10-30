import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { View } from 'react-native';

export interface OverlayItem {
  id: string;
  component: React.ReactNode;
}

export interface OverlayContextType {
  blurTargetRef: React.RefObject<View | null>;
  registerOverlay: (id: string, component: React.ReactNode) => void;
  unregisterOverlay: (id: string) => void;
  overlays: OverlayItem[];
}

const OverlayContext = createContext<OverlayContextType | undefined>(undefined);

export const OverlayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const blurTargetRef = useRef<View>(null);

  const registerOverlay = useCallback((id: string, component: React.ReactNode) => {
    setOverlays((prev) => {
      const idx = prev.findIndex((o) => o.id === id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { id, component };
        return next;
      }
      return [...prev, { id, component }];
    });
  }, []);

  const unregisterOverlay = useCallback((id: string) => {
    setOverlays((prev) => prev.filter((o) => o.id !== id));
  }, []);

  return (
    <OverlayContext.Provider value={{ blurTargetRef, registerOverlay, unregisterOverlay, overlays }}>
      {children}
    </OverlayContext.Provider>
  );
};

export const useOverlay = () => {
  const context = useContext(OverlayContext);
  if (!context) {
    throw new Error('useOverlay must be used within an OverlayProvider');
  }
  return context;
};
