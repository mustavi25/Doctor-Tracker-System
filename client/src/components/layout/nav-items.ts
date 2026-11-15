import { LayoutDashboard, Stethoscope, Users, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Doctors", href: "/doctors", icon: Stethoscope },
  { label: "Patients", href: "/patients", icon: Users },
];
