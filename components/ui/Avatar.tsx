/**
 * @file components/ui/Avatar.tsx
 * @description Reusable avatar component supporting initials and image upload.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { Icon } from '@/components/ui/Icon';

interface AvatarProps {
  name?: string;
  color?: string;
  imageUri?: string | null;
  size?: number;
  onPress?: () => void;
  showEditBadge?: boolean;
}

export function Avatar({
  name,
  color,
  imageUri,
  size = 48,
  onPress,
  showEditBadge = false,
}: AvatarProps) {
  const t = useAppTheme();

  const initials =
    name
      ?.split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '??';

  const avatarColor = color ?? t.accent;
  const fontSize = Math.floor(size * 0.35);
  const badgeSize = Math.floor(size * 0.32);

  const content = (
    <View style={[styles.container, { width: size, height: size }]}>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: avatarColor,
            },
          ]}
        >
          <Text style={{ fontSize, fontWeight: '700', color: 'white' }}>
            {initials}
          </Text>
        </View>
      )}

      {showEditBadge && (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: t.accent,
              bottom: 0,
              right: 0,
            },
          ]}
        >
          <Icon name="camera" size={badgeSize * 0.5} color="white" strokeWidth={2.5} />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
});
