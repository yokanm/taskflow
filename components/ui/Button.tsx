import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View, type TouchableOpacityProps } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends TouchableOpacityProps {
  variant?: Variant; size?: Size; label: string;
  loading?: boolean; fullWidth?: boolean; icon?: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'lg', label, loading, fullWidth, icon, style, disabled, ...rest }: Props) {
  const t = useAppTheme();
  const bg: Record<Variant, string> = { primary: t.accent, secondary: t.surface, ghost: 'transparent', danger: '#EF4444' };
  const textColor: Record<Variant, string> = { primary: '#FFF', secondary: t.textPrimary, ghost: t.accent, danger: '#FFF' };
  const pv: Record<Size, number> = { sm: 8, md: 12, lg: 15 };
  const ph: Record<Size, number> = { sm: 16, md: 20, lg: 24 };
  const fs: Record<Size, number> = { sm: 13, md: 14, lg: 15 };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled || loading}
      style={[styles.base, { backgroundColor: bg[variant], paddingVertical: pv[size], paddingHorizontal: ph[size],
        borderWidth: variant === 'secondary' ? 1.5 : 0, borderColor: t.border,
        opacity: disabled ? 0.5 : 1, alignSelf: fullWidth ? 'stretch' : 'auto',
        shadowColor: variant === 'primary' ? t.accentShadow : 'transparent',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: variant === 'primary' ? 6 : 0,
      }, style]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={textColor[variant]} size="small" /> : (
        <View style={styles.row}>
          {icon && <View style={{ marginRight: 4 }}>{icon}</View>}
          <Text style={{ color: textColor[variant], fontSize: fs[size], fontWeight: '600', letterSpacing: 0.1 }}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
