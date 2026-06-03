import { useWindowDimensions } from 'react-native';

/**
 * Returns number of grid columns based on current viewport width.
 * Mobile  (<640px)  → 1
 * Tablet  (<1024px) → 2
 * Desktop (>=1024px)→ 3
 */
export function useColumns(): 1 | 2 | 3 {
  const { width } = useWindowDimensions();
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

/** True when viewport is wider than mobile */
export function useIsWide(): boolean {
  const { width } = useWindowDimensions();
  return width >= 640;
}
