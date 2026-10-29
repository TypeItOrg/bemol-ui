import { Building2Icon, ClipboardCheckIcon, GraduationCapIcon, HistoryIcon, ShieldCheckIcon, UsersRoundIcon, type LucideIcon } from "lucide-react";

const PERMISSION_GROUP_ICONS: Readonly<Record<string, LucideIcon>> = {
  ACADEMIC: GraduationCapIcon,
  SELF_SERVICE: UsersRoundIcon,
  TEACHING: GraduationCapIcon,
  ACTIVITY: HistoryIcon,
  GRADES: ClipboardCheckIcon,
  INSTITUTION: Building2Icon,
  PEOPLE: UsersRoundIcon,
  ROLES: ShieldCheckIcon,
};

export function getPermissionGroupIcon(code: string): LucideIcon {
  return PERMISSION_GROUP_ICONS[code] ?? ShieldCheckIcon;
}
