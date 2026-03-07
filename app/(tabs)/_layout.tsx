/**
 * @file app/(tabs)/_layout.tsx
 * @description Bottom tab bar layout for the main app screens.
 * Uses Expo Router's Tabs component with custom tab bar styling.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useAppTheme } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Tab icons ────────────────────────────────────────────────────────────────

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  index:    { active: '⊞', inactive: '⊟' },
  tasks:    { active: '✓', inactive: '☐' },
  projects: { active: '◈', inactive: '◇' },
  profile:  { active: '●', inactive: '○' },
};

const TAB_LABELS: Record<string, string> = {
  index:    'Home',
  tasks:    'Tasks',
  projects: 'Projects',
  profile:  'Profile',
};

// ─── Custom tab bar ───────────────────────────────────────────────────────────

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const t       = useAppTheme();
  const insets  = useSafeAreaInsets();

  return (
    <View style={[
      styles.tabBar,
      {
        backgroundColor:   t.surface,
        borderTopColor:    t.border,
        paddingBottom:     insets.bottom || 8,
        shadowColor:       '#000',
      },
    ]}>
      {state.routes.map((route, index) => {
        const isFocused  = state.index === index;
        const routeName  = route.name;
        const icons      = TAB_ICONS[routeName] ?? { active: '●', inactive: '○' };
        const label      = TAB_LABELS[routeName] ?? routeName;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            {/* Active pill indicator */}
            {isFocused ? (
              <View style={[styles.pill, { backgroundColor: t.accentLight }]}>
                <Text style={{ fontSize: 16, color: t.accent }}>{icons.active}</Text>
              </View>
            ) : (
              <Text style={{ fontSize: 16, color: t.textTertiary }}>{icons.inactive}</Text>
            )}
            <Text style={[
              styles.tabLabel,
              { color: isFocused ? t.accent : t.textTertiary, fontWeight: isFocused ? '700' : '500' },
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"    options={{ title: 'Home'     }} />
      <Tabs.Screen name="tasks"    options={{ title: 'Tasks'    }} />
      <Tabs.Screen name="projects" options={{ title: 'Projects' }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profile'  }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar:   {
    flexDirection:  'row',
    borderTopWidth: 1,
    paddingTop:     8,
    shadowOffset:   { width: 0, height: -4 },
    shadowOpacity:  0.06,
    shadowRadius:   12,
    elevation:      12,
  },
  tabItem:  { flex: 1, alignItems: 'center', gap: 3 },
  pill:     { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, letterSpacing: 0.3 },
});
