import { Plane, Home as HomeIcon, type LucideIcon } from "lucide-react";

export const MODULE_KEYS = ["TRAVEL", "HOME"] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export interface ModuleDefinition {
  key: ModuleKey;
  label: string;
  description: string;
  icon: LucideIcon;
  href: string;
}

export const MODULE_REGISTRY: Record<ModuleKey, ModuleDefinition> = {
  TRAVEL: {
    key: "TRAVEL",
    label: "Travel",
    description: "Plan trips and track flights, lodging, and activities — like TripIt.",
    icon: Plane,
    href: "/travel",
  },
  HOME: {
    key: "HOME",
    label: "Home",
    description: "Track maintenance, improvements, and repairs across your properties, with receipts attached.",
    icon: HomeIcon,
    href: "/home",
  },
};
