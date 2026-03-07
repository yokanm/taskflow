import { useAppTheme } from '@/context/ThemeContext';
import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  error,
  rightIcon,
  leftIcon,
  containerStyle,
  style,
  multiline,
  numberOfLines,
  ...rest
}: Props) {
  const t = useAppTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? '#EF4444' : focused ? t.accent : t.border;

  // Web uses boxShadow; native uses shadow* props (deprecated in RN 0.76+)
  const focusShadow = Platform.select({
    web: {
      // @ts-ignore – boxShadow is web-only
      boxShadow: focused
        ? `0 0 0 3px ${t.accent}28`
        : error
          ? `0 0 0 3px #EF444428`
          : 'none',
    },
    default: {},
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text
          style={[
            styles.label,
            { color: focused ? t.accent : t.textSecondary },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: t.surface2,
            borderColor,
            borderWidth: focused ? 2 : 1.5,
          },
          focusShadow,
          // On web, add a subtle inner background shift on focus
          Platform.OS === 'web' && focused
            ? { backgroundColor: t.surface }
            : {},
        ]}
      >
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}

        <TextInput
          style={[
            styles.input,
            {
              color: t.textPrimary,
              // Web: ensure proper box model and no browser outline
              ...(Platform.select({
                web: {
                  // @ts-ignore
                  outline: 'none',
                  // @ts-ignore
                  outlineStyle: 'none',
                  // @ts-ignore
                  minHeight: multiline ? (numberOfLines ?? 3) * 24 : undefined,
                  // @ts-ignore
                  resize: 'none',
                },
                default: {},
              }) as any),
            },
            multiline && styles.multiline,
            style,
          ]}
          placeholderTextColor={t.textTertiary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          numberOfLines={numberOfLines}
          // Android: prevent keyboard from covering the input
          {...(Platform.OS === 'android'
            ? {
                importantForAutofill: 'yes',
                textAlignVertical: multiline ? 'top' : 'center',
              }
            : {})}
          {...rest}
        />

        {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorDot}>●</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    // Consistent vertical padding – web and native
    paddingVertical: Platform.OS === 'web' ? 12 : 13,
    // Smooth border color transition on web
    ...(Platform.select({
      web: {
        // @ts-ignore
        transition:
          'border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
        // @ts-ignore
        cursor: 'text' as any,
      },
      default: {},
    }) as any),
  },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 0, // remove default Android padding
    margin: 0,
    // Web: remove browser default styles
    ...Platform.select({
      web: {
        // @ts-ignore
        border: 'none',
        background: 'transparent',
        fontFamily: 'inherit',
        fontSize: 14,
        lineHeight: '1.5',
      },
    }),
  },
  multiline: {
    minHeight: 72,
    paddingTop: 4,
    paddingBottom: 4,
    textAlignVertical: 'top',
  },
  leftIcon: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIcon: {
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  errorDot: {
    fontSize: 5,
    color: '#EF4444',
    lineHeight: 14,
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    flex: 1,
  },
});
