import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';

interface Props extends TextInputProps {
  label?: string; error?: string; rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode; containerStyle?: object;
}

export function Input({ label, error, rightIcon, leftIcon, containerStyle, style, ...rest }: Props) {
  const t = useAppTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      {label && <Text style={{ fontSize: 12, fontWeight: '600', color: t.textSecondary, marginBottom: 6, letterSpacing: 0.2 }}>{label}</Text>}
      <View style={[styles.wrap, {
        backgroundColor: t.surface2, borderColor: error ? '#EF4444' : focused ? t.accent : t.border,
        borderWidth: 1.5,
        shadowColor: focused ? t.accent : error ? '#EF4444' : 'transparent',
        shadowOpacity: focused || error ? 0.15 : 0, shadowRadius: 8, elevation: 0,
      }]}>
        {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, { color: t.textPrimary, flex: 1 }, style]}
          placeholderTextColor={t.textTertiary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {rightIcon && <View style={{ marginLeft: 8 }}>{rightIcon}</View>}
      </View>
      {error && <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 5 }}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
  input: { fontSize: 14 },
});
