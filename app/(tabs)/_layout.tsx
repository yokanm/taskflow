import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import * as Haptics from 'expo-haptics';

function TabIcon({ focused, label, icon }: { focused: boolean; label: string; icon: string }) {
  const t = useAppTheme();
  return (
    <View style={{ alignItems: 'center', gap: 3 }}>
      <View style={{ width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
        backgroundColor: focused ? t.accentLight : 'transparent' }}>
        <Text style={{ fontSize: 16, color: focused ? t.accent : t.textTertiary }}>{icon}</Text>
      </View>
      <Text style={{ fontSize: 10, fontWeight: focused ? '600' : '500',
        color: focused ? t.accent : t.textTertiary }}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();

  const tabBarStyle = {
    backgroundColor: t.surface,
    borderTopColor: t.border,
    borderTopWidth: 1,
    height: 60 + insets.bottom,
    paddingBottom: insets.bottom,
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  };

  const handlePress = () => {
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarShowLabel: false,
      }}
      screenListeners={{ tabPress: handlePress }}
    >
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Home" icon="⌂" /> }} />
      <Tabs.Screen name="tasks" options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Tasks" icon="☑" /> }} />
      <Tabs.Screen name="projects" options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Projects" icon="⊞" /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Profile" icon="◉" /> }} />
    </Tabs>
  );
}
