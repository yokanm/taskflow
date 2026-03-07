/**
 * @file app/(tabs)/_layout.tsx
 * @description Bottom tab bar with Lucide icons, Search tab added.
 */

import { useAppTheme } from '@/context/ThemeContext';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  CheckSquare,
  FolderOpen,
  Search,
  User,
} from 'lucide-react-native';

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabRoute = 'index' | 'tasks' | 'projects' | 'search' | 'profile';

const TAB_CONFIG: Record<
  TabRoute,
  { label: string; Icon: React.ComponentType<any> }
> = {
  index:    { label: 'Home',     Icon: Home },
  tasks:    { label: 'Tasks',    Icon: CheckSquare },
  projects: { label: 'Projects', Icon: FolderOpen },
  search:   { label: 'Search',   Icon: Search },
  profile:  { label: 'Profile',  Icon: User },
};

// ─── Tab item with scale animation ────────────────────────────────────────────

function TabItem({
  routeName,
  isFocused,
  onPress,
}: {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
}) {
  const t = useAppTheme();
  const scale = React.useRef(new Animated.Value(1)).current;

  const cfg = TAB_CONFIG[routeName as TabRoute] ?? {
    label: routeName,
    Icon: Home,
  };

  const handlePress = () => {
    // Bounce animation on tap
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.88,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 8,
      }),
    ]).start();
    onPress();
  };

  const iconColor = isFocused ? t.accent : t.textTertiary;
  const iconSize = 22;

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.tabItem}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.iconWrap,
          {
            transform: [{ scale }],
            backgroundColor: isFocused ? t.accentLight : 'transparent',
            paddingHorizontal: isFocused ? 16 : 0,
          },
        ]}
      >
        <cfg.Icon
          size={iconSize}
          color={iconColor}
          strokeWidth={isFocused ? 2.5 : 1.8}
        />
      </Animated.View>

      <Text
        style={[
          styles.tabLabel,
          {
            color: isFocused ? t.accent : t.textTertiary,
            fontWeight: isFocused ? '700' : '400',
          },
        ]}
      >
        {cfg.label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Custom tab bar ───────────────────────────────────────────────────────────

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: t.surface,
          borderTopColor: t.border,
          paddingBottom: insets.bottom || 10,
          ...(Platform.OS === 'web'
            ? { boxShadow: '0px -2px 16px rgba(0,0,0,0.06)' }
            : {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: 12,
              }),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabItem
            key={route.key}
            routeName={route.name}
            isFocused={isFocused}
            onPress={onPress}
          />
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
      <Tabs.Screen name="index"    options={{ title: 'Home' }} />
      <Tabs.Screen name="tasks"    options={{ title: 'Tasks' }} />
      <Tabs.Screen name="projects" options={{ title: 'Projects' }} />
      <Tabs.Screen name="search"   options={{ title: 'Search' }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  iconWrap: {
    paddingVertical: 5,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
