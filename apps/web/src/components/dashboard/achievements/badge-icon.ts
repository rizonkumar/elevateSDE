import {
  Award,
  ClipboardCheck,
  Flame,
  Medal,
  MessagesSquare,
  Rocket,
  Star,
  Swords,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  Award,
  ClipboardCheck,
  Flame,
  Medal,
  MessagesSquare,
  Rocket,
  Star,
  Swords,
  Target,
  Trophy,
  Zap,
};

export function resolveBadgeIcon(name: string): LucideIcon {
  return ICONS[name] ?? Award;
}
