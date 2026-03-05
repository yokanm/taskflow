import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface Props { size?: number; progress: number; color?: string; label?: string; }

export function ProgressRing({ size = 84, progress, color = '#FFFFFF', label }: Props) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.2)" strokeWidth={8} fill="none" />
        <Circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={8} fill="none"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
      </Svg>
      <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: size > 70 ? 18 : 14, fontWeight: '700', color, lineHeight: size > 70 ? 22 : 18 }}>
          {progress}%
        </Text>
        {label && <Text style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 }}>
          {label}
        </Text>}
      </View>
    </View>
  );
}
