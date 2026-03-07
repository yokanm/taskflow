import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  Platform,
  type TouchableOpacityProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends TouchableOpacityProps {
  variant?: Variant;
  size?: Size;
  label: string;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  variant = 'primary',
  size = 'lg',
  label,
  loading,
  fullWidth,
  icon,
  style,
  disabled,
  ...rest
}: Props) {
  const t = useAppTheme();

  const bg: Record<Variant, string> = {
    primary:   t.accent,
    secondary: t.surface,
    ghost:     'transparent',
    danger:    '#EF4444',
  };

  const textColor: Record<Variant, string> = {
    primary:   '#FFF',
    secondary: t.textPrimary,
    ghost:     t.accent,
    danger:    '#FFF',
  };

  const pv: Record<Size, number> = { sm: 8,  md: 12, lg: 15 };
  const ph: Record<Size, number> = { sm: 16, md: 20, lg: 24 };
  const fs: Record<Size, number> = { sm: 13, md: 14, lg: 15 };

  // Replace deprecated shadow* props with boxShadow (web) or platform-appropriate
  const shadowStyle = Platform.select({
    web: {
      // @ts-ignore
      boxShadow: variant === 'primary'
        ? `0 4px 14px ${t.accentShadow}`
        : variant === 'danger'
          ? '0 4px 14px rgba(239,68,68,0.3)'
          : 'none',
    },
    default: {
      // Native: use elevation only (shadow* props deprecated in RN 0.76)
      elevation: variant === 'primary' ? 6 : variant === 'danger' ? 4 : 0,
    },
  });

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled ?? loading}
      style={[
        styles.base,
        {
          backgroundColor:  bg[variant],
          paddingVertical:  pv[size],
          paddingHorizontal: ph[size],
          borderWidth:  variant === 'secondary' ? 1.5 : 0,
          borderColor:  t.border,
          opacity:      disabled ? 0.5 : 1,
          alignSelf:    fullWidth ? 'stretch' : 'auto',
        },
        shadowStyle,
        // Web hover handled via CSS – add transition for polish
        Platform.OS === 'web' && {
          // @ts-ignore
          transition: 'opacity 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease',
          cursor: disabled ? 'not-allowed' : 'pointer',
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor[variant]} size="small" />
      ) : (
        <View style={styles.row}>
          {icon ? <View style={{ marginRight: 6 }}>{icon}</View> : null}
          <Text
            style={{
              color:        textColor[variant],
              fontSize:     fs[size],
              fontWeight:   '600',
              letterSpacing: 0.1,
            }}
          >
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius:    12,
    alignItems:      'center',
    justifyContent:  'center',
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
  },
});
