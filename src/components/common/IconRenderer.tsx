import React from 'react';
import {
  Briefcase,
  User,
  AlertCircle,
  Folder,
  Target,
  Zap,
  Heart,
  BookOpen,
  Coffee,
  Code,
  Calendar,
  ShoppingBag,
  Smile,
  Sun,
  Star,
  CheckCircle,
  Tag,
  Home,
  Clock,
  Compass,
  ListTodo,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Briefcase,
  User,
  AlertCircle,
  Folder,
  Target,
  Zap,
  Heart,
  BookOpen,
  Coffee,
  Code,
  Calendar,
  ShoppingBag,
  Smile,
  Sun,
  Star,
  CheckCircle,
  Tag,
  Home,
  Clock,
  Compass,
  ListTodo,
};

export const AVAILABLE_CATEGORY_ICONS = Object.keys(ICON_MAP);

interface IconRendererProps {
  name: string;
  className?: string;
  size?: number;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, className = 'w-4 h-4', size }) => {
  const IconComponent = ICON_MAP[name] || Folder;
  return <IconComponent className={className} size={size} />;
};
