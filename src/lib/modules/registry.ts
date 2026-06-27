import { Plane, type LucideIcon } from "lucide-react";

export const MODULE_KEYS = ["TRAVEL"] as const;

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
};
