import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { View, StyleSheet } from 'react-native';

export interface OverlayItem {
  id: string;
  component: React.ReactNode;
}

export interface OverlayContextType {
  blurTargetRef: React.RefObject<View | null>;
  setOverlay: (id: string, component: React.ReactNode) => void;
  removeOverlay: (id: string) => void;
  overlays: OverlayItem[];
}

const OverlayContext = createContext<OverlayContextType | undefined>(undefined);

export const OverlayProvider: React.FC<{
  children: React.ReactNode;
  blurTargetRef?: React.RefObject<View | null>;
}> = ({ children, blurTargetRef: externalBlurTargetRef }) => {
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const internalBlurTargetRef = useRef<View>(null);
  const blurTargetRef = externalBlurTargetRef || internalBlurTargetRef;

  const setOverlay = useCallback((id: string, component: React.ReactNode) => {
    setOverlays((prev) => {
      const idx = prev.findIndex((o) => o.id === id);
      if (idx >= 0) {
        if (prev[idx].component === component) return prev;
        const next = [...prev];
        next[idx] = { id, component };
        return next;
      }
      return [...prev, { id, component }];
    });
  }, []);

  const removeOverlay = useCallback((id: string) => {
    setOverlays((prev) => {
      if (!prev.some((o) => o.id === id)) return prev;
      return prev.filter((o) => o.id !== id);
    });
  }, []);

  const value = useMemo(
    () => ({
      blurTargetRef,
      setOverlay,
      removeOverlay,
      overlays,
    }),
    [blurTargetRef, setOverlay, removeOverlay, overlays]
  );

  return <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>;
};

export const useOverlay = () => {
  const context = useContext(OverlayContext);
  if (!context) {
    return {
      blurTargetRef: { current: null } as React.RefObject<View | null>,
      setOverlay: () => {},
      removeOverlay: () => {},
      overlays: [],
    };
  }
  return context;
};

/**
 * OverlayHost is rendered as a SIBLING to BlurTargetView.
 * It mounts all active overlays (sheets, floating dialogs, speed dials) above BlurTargetView.
 */
export const OverlayHost: React.FC = () => {
  const { overlays } = useOverlay();

  if (overlays.length === 0) return null;

  return (
    <View style={styles.hostContainer} pointerEvents="box-none">
      {overlays.map((item) => (
        <React.Fragment key={item.id}>{item.component}</React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  hostContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    elevation: 9999,
  },
});
