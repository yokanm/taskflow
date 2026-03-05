import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, interpolate } from 'react-native-reanimated';
import { useAppTheme } from '@/context/ThemeContext';

interface Props { width?: number | string; height?: number; borderRadius?: number; style?: object; }

export function Skeleton({ width = '100%', height = 16, borderRadius = 6, style }: Props) {
  const t = useAppTheme();
  const anim = useSharedValue(0);
  React.useEffect(() => {
    anim.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, [anim]);
  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(anim.value, [0, 1], [0.5, 1]),
  }));
  return (
    <Animated.View style={[{ width: width as number, height, borderRadius, backgroundColor: t.border }, animStyle, style]} />
  );
}

export function TaskSkeleton() {
  const t = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Skeleton width={20} height={20} borderRadius={6} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton height={14} />
        <Skeleton width="60%" height={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 8, flexDirection: 'row', gap: 10 },
});
