import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, BackHandler, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TOAST_DURATION = 3000; // ms visible
const ANIM_IN = 220;
const ANIM_OUT = 280;

const TYPE_CONFIG: Record<ToastType, { bg: string; iconName: string }> = {
  success: { bg: '#1A5C2A', iconName: 'checkmark-circle' },
  error:   { bg: '#B71C1C', iconName: 'close-circle' },
  warning: { bg: '#C84B00', iconName: 'warning' },
  info:    { bg: '#0D3B8A', iconName: 'information-circle' },
};

// ─── Single Toast ─────────────────────────────────────────────────────────────

const ToastRow: React.FC<{ item: ToastItem; onDone: () => void }> = ({ item, onDone }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: ANIM_IN, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(translateY, { toValue: 0, duration: ANIM_IN, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();

    const hide = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: ANIM_OUT, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(translateY, { toValue: 10, duration: ANIM_OUT, useNativeDriver: Platform.OS !== 'web' }),
      ]).start(onDone);
    }, TOAST_DURATION);

    return () => clearTimeout(hide);
  }, []);

  const { bg, iconName } = TYPE_CONFIG[item.type];

  return (
    <Animated.View
      style={[styles.toast, { backgroundColor: bg }, { opacity, transform: [{ translateY }] }]}
    >
      <Ionicons name={iconName as any} size={20} color="#FFF" style={styles.toastIcon} />
      <Text style={styles.toastText} numberOfLines={3}>{item.message}</Text>
    </Animated.View>
  );
};

// ─── Context + Provider ───────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    setToasts(prev => {
      // Cap at 3 simultaneous toasts — drop oldest
      const capped = prev.length >= 3 ? prev.slice(1) : prev;
      return [...capped, { id, message, type }];
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Clear toasts on back press (native only — BackHandler not available on web)
  useEffect(() => {
    if (Platform.OS === 'web' || toasts.length === 0) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setToasts([]);
      return false;
    });
    return () => sub.remove();
  }, [toasts.length]);

  const toastList = toasts.map(item => (
    <ToastRow key={item.id} item={item} onDone={() => removeToast(item.id)} />
  ));

  return (
    <ToastContext.Provider value={{ showToast }}>
      <View style={styles.root}>
        {children}
        {toasts.length > 0 && (
          <View
            style={[styles.container, Platform.OS === 'web' && styles.webContainer]}
            pointerEvents="none"
          >
            {toastList}
          </View>
        )}
      </View>
    </ToastContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  return useContext(ToastContext);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    ...Platform.select({ web: { position: 'relative' } as any }),
  },
  container: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    gap: 8,
    zIndex: 9999,
    elevation: 9999,
  },
  webContainer: {
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    ...Platform.select({
      web: { boxShadow: '0px 4px 8px rgba(0,0,0,0.35)' } as any,
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 10 },
    }),
  },
  toastIcon: {
    marginRight: 10,
    flexShrink: 0,
  },
  toastText: {
    flex: 1,
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
  },
});
