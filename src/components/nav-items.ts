import { LayoutDashboard, FileText, Plus, Settings } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contracts", label: "Contracts", icon: FileText },
  { href: "/contracts/new", label: "Add", icon: Plus },
  { href: "/settings", label: "Settings", icon: Settings },
];
