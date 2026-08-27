import {
  Box,
  Building2,
  CarFront,
  FileText,
  Film,
  ImageIcon,
  Inbox,
  LayoutGrid,
  Layers,
  Shapes,
  Star,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { AssetKind, Category } from "./types";

export type CategoryMeta = {
  id: Category | "all" | "favorites";
  label: string;
  hint: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: CategoryMeta[] = [
  { id: "all", label: "All assets", hint: "Entire vault", icon: Layers },
  { id: "favorites", label: "Favorites", hint: "Starred pieces", icon: Star },
  { id: "characters", label: "Characters", hint: "Heroes, NPCs, creatures", icon: UserRound },
  { id: "props", label: "Props", hint: "Items, loot, furniture", icon: Box },
  { id: "backgrounds", label: "Backgrounds", hint: "Scenes and backdrops", icon: ImageIcon },
  { id: "buildings", label: "Buildings", hint: "Houses, shops, keeps", icon: Building2 },
  { id: "vehicles", label: "Vehicles", hint: "Carts, boats, airships", icon: CarFront },
  { id: "spritesheets", label: "Sprite sheets", hint: "Grids and atlases", icon: LayoutGrid },
  { id: "video", label: "Video", hint: "WebM loops and clips", icon: Film },
  { id: "docs", label: "Docs", hint: "Bibles, notes, handoff", icon: FileText },
  { id: "other", label: "Other", hint: "Pickups, UI, leftovers", icon: Shapes },
  { id: "unsorted", label: "Unsorted", hint: "Needs a home", icon: Inbox },
];

const FOLDER_ALIASES: Record<string, Category> = {
  character: "characters",
  characters: "characters",
  chars: "characters",
  char: "characters",
  heroes: "characters",
  hero: "characters",
  npcs: "characters",
  npc: "characters",
  actors: "characters",
  creatures: "characters",
  enemies: "characters",
  props: "props",
  prop: "props",
  items: "props",
  item: "props",
  objects: "props",
  object: "props",
  loot: "props",
  furniture: "props",
  backgrounds: "backgrounds",
  background: "backgrounds",
  backdrops: "backgrounds",
  backdrop: "backgrounds",
  scenes: "backgrounds",
  scene: "backgrounds",
  environments: "backgrounds",
  environment: "backgrounds",
  env: "backgrounds",
  bgs: "backgrounds",
  bg: "backgrounds",
  buildings: "buildings",
  building: "buildings",
  architecture: "buildings",
  houses: "buildings",
  house: "buildings",
  structures: "buildings",
  structure: "buildings",
  shops: "buildings",
  vehicles: "vehicles",
  vehicle: "vehicles",
  cars: "vehicles",
  car: "vehicles",
  transport: "vehicles",
  boats: "vehicles",
  ships: "vehicles",
  spritesheets: "spritesheets",
  spritesheet: "spritesheets",
  "sprite-sheets": "spritesheets",
  sprite_sheets: "spritesheets",
  sprites: "spritesheets",
  sprite: "spritesheets",
  sheets: "spritesheets",
  sheet: "spritesheets",
  atlas: "spritesheets",
  atlases: "spritesheets",
  strips: "spritesheets",
  video: "video",
  videos: "video",
  clips: "video",
  clip: "video",
  movies: "video",
  animation: "video",
  animations: "video",
  anims: "video",
  anim: "video",
  webm: "video",
  docs: "docs",
  doc: "docs",
  documentation: "docs",
  readme: "docs",
  notes: "docs",
  guides: "docs",
  guide: "docs",
  design: "docs",
  other: "other",
  misc: "other",
  miscellaneous: "other",
  fx: "other",
  vfx: "other",
  ui: "other",
  effects: "other",
  pickups: "other",
  pickup: "other",
};

export function guessCategoryFromPath(relativePath: string): Category {
  const parts = relativePath
    .toLowerCase()
    .replaceAll("\\", "/")
    .split("/")
    .filter(Boolean);
  const file = parts.at(-1) ?? "";
  for (let i = parts.length - 2; i >= 0; i--) {
    const hit = FOLDER_ALIASES[parts[i] ?? ""];
    if (hit) return hit;
  }
  if (/\.(webm|mp4|mov|m4v)$/i.test(file)) return "video";
  if (/\.(md|txt|pdf|json)$/i.test(file)) return "docs";
  if (/(sheet|atlas|strip)/i.test(file)) return "spritesheets";
  return "unsorted";
}

export function inferKind(fileName: string, category: Category, mime = ""): AssetKind {
  if (mime.startsWith("video/") || /\.(webm|mp4|mov|m4v)$/i.test(fileName)) {
    return "video";
  }
  if (
    mime.startsWith("text/") ||
    mime.includes("pdf") ||
    mime.includes("json") ||
    /\.(md|txt|pdf|json)$/i.test(fileName)
  ) {
    return "doc";
  }
  if (category === "spritesheets" || /(sheet|atlas|strip)/i.test(fileName)) {
    return "spritesheet";
  }
  return "image";
}

export function categoryLabel(id: Category): string {
  return NAV_ITEMS.find((item) => item.id === id)?.label ?? id;
}

export const FILE_CATEGORIES: Category[] = [
  "characters",
  "props",
  "backgrounds",
  "buildings",
  "vehicles",
  "spritesheets",
  "video",
  "docs",
  "other",
  "unsorted",
];

export const EXPORT_CATEGORIES: Category[] = FILE_CATEGORIES.filter(
  (id) => id !== "unsorted",
);
