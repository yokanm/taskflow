/**
 * @file components/ui/Icon.tsx
 * @description Unified icon component using lucide-react-native.
 * Replaces all emoji icons throughout the app with proper vector icons.
 */

import React from 'react';
import {
  Home, CheckSquare, FolderOpen, User, Plus, Search,
  ChevronLeft, ChevronRight, X, Eye, EyeOff, Check,
  Bell, Clock, Moon, Sun, Palette, Lock, Globe, LogOut,
  Edit2, Trash2, AlertCircle, Calendar, Flag, Tag,
  ArrowLeft, MoreVertical, Filter, RefreshCw, Star,
  Camera, Image, MapPin, BookOpen, Settings, Shield,
  TrendingUp, Target, Zap, Award, Circle, CheckCircle2,
  Play, Pause, SquareSlash, Info, ChevronDown, ChevronUp,
} from 'lucide-react-native';

export type IconName =
  | 'home' | 'check-square' | 'folder' | 'user' | 'plus' | 'search'
  | 'chevron-left' | 'chevron-right' | 'x' | 'eye' | 'eye-off' | 'check'
  | 'bell' | 'clock' | 'moon' | 'sun' | 'palette' | 'lock' | 'globe' | 'logout'
  | 'edit' | 'trash' | 'alert' | 'calendar' | 'flag' | 'tag'
  | 'arrow-left' | 'more' | 'filter' | 'refresh' | 'star'
  | 'camera' | 'image' | 'map-pin' | 'book' | 'settings' | 'shield'
  | 'trending' | 'target' | 'zap' | 'award' | 'circle' | 'check-circle'
  | 'play' | 'pause' | 'slash' | 'info' | 'chevron-down' | 'chevron-up';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const ICON_MAP: Record<IconName, React.ComponentType<any>> = {
  'home': Home,
  'check-square': CheckSquare,
  'folder': FolderOpen,
  'user': User,
  'plus': Plus,
  'search': Search,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'x': X,
  'eye': Eye,
  'eye-off': EyeOff,
  'check': Check,
  'bell': Bell,
  'clock': Clock,
  'moon': Moon,
  'sun': Sun,
  'palette': Palette,
  'lock': Lock,
  'globe': Globe,
  'logout': LogOut,
  'edit': Edit2,
  'trash': Trash2,
  'alert': AlertCircle,
  'calendar': Calendar,
  'flag': Flag,
  'tag': Tag,
  'arrow-left': ArrowLeft,
  'more': MoreVertical,
  'filter': Filter,
  'refresh': RefreshCw,
  'star': Star,
  'camera': Camera,
  'image': Image,
  'map-pin': MapPin,
  'book': BookOpen,
  'settings': Settings,
  'shield': Shield,
  'trending': TrendingUp,
  'target': Target,
  'zap': Zap,
  'award': Award,
  'circle': Circle,
  'check-circle': CheckCircle2,
  'play': Play,
  'pause': Pause,
  'slash': SquareSlash,
  'info': Info,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
};

export function Icon({ name, size = 20, color = '#6B6E8E', strokeWidth = 2 }: IconProps) {
  const LucideIcon = ICON_MAP[name];
  if (!LucideIcon) return null;
  return <LucideIcon size={size} color={color} strokeWidth={strokeWidth} />;
}
