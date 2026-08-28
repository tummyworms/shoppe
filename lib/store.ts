// Inventory data + photo storage.
//
// Two backends live here behind one interface:
//   • Local file store (data/items.json + public/uploads) — used pre-launch.
//   • Supabase (Postgres + Storage) — used automatically once SUPABASE_* env
//     vars are set (see lib/supabase.ts).
//
// The rest of the app only calls the exported functions at the bottom, so
// switching backends changes nothing elsewhere.
import { promises as fs } from "fs";
import path from "path";
import type { Item } from "./types";
import { supabase, supabaseEnabled, BUCKET } from "./supabase";

type ItemPatch = Partial<Pick<Item, "title" | "category" | "note" | "sold">>;

/* ------------------------------------------------------------------ */
/* Local file store                                                    */
/* ------------------------------------------------------------------ */

const DATA_FILE = path.join(process.cwd(), "data", "items.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

async function fileGetItems(): Promise<Item[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const items = JSON.parse(raw) as Item[];
    return items.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

async function fileSaveAll(items: Item[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2));
}

async function fileAddItem(item: Item): Promise<void> {
  const items = await fileGetItems();
  items.push(item);
  await fileSaveAll(items);
}

async function fileUpdateItem(id: string, patch: ItemPatch): Promise<Item | null> {
  const items = await fileGetItems();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...patch };
  await fileSaveAll(items);
  return items[idx];
}

async function fileDeleteItem(id: string): Promise<boolean> {
  const items = await fileGetItems();
  const target = items.find((i) => i.id === id);
  if (!target) return false;
  await fileSaveAll(items.filter((i) => i.id !== id));
  for (const url of target.images) {
    if (url.startsWith("/uploads/")) {
      await fs.rm(path.join(process.cwd(), "public", url), { force: true });
    }
  }
  return true;
}

async function fileSaveImage(file: File): Promise<string> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext || "jpg"}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), bytes);
  return `/uploads/${name}`;
}

/* ------------------------------------------------------------------ */
/* Supabase store                                                      */
/* ------------------------------------------------------------------ */

const TABLE = "items";

type Row = {
  id: string;
  title: string;
  category: string;
  price?: string | null;
  sku?: string | null;
  note: string | null;
  images: string[] | null;
  sold: boolean;
  created_at: string;
};

function rowToItem(r: Row): Item {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    price: r.price ?? undefined,
    sku: r.sku ?? undefined,
    note: r.note ?? undefined,
    images: r.images ?? [],
    sold: r.sold,
    createdAt: new Date(r.created_at).getTime(),
  };
}

async function sbGetItems(): Promise<Item[]> {
  const { data, error } = await supabase()
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Row[]).map(rowToItem);
}

async function sbGetItem(id: string): Promise<Item | null> {
  const { data, error } = await supabase().from(TABLE).select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? rowToItem(data as Row) : null;
}

async function sbAddItem(item: Item): Promise<void> {
  const base = {
    id: item.id,
    title: item.title,
    category: item.category,
    note: item.note ?? null,
    images: item.images,
    sold: item.sold,
    created_at: new Date(item.createdAt).toISOString(),
  };
  // Include optional columns when set. If a column hasn't been added to the
  // table yet, retry without them so item creation still succeeds.
  let { error } = await supabase()
    .from(TABLE)
    .insert({ ...base, price: item.price ?? null, sku: item.sku ?? null });
  if (error && /(price|sku)/i.test(error.message)) {
    ({ error } = await supabase().from(TABLE).insert(base));
  }
  if (error) throw error;
}

async function sbUpdateItem(id: string, patch: ItemPatch): Promise<Item | null> {
  const clean = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined),
  );
  const { data, error } = await supabase()
    .from(TABLE)
    .update(clean)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data ? rowToItem(data as Row) : null;
}

async function sbDeleteItem(id: string): Promise<boolean> {
  const item = await sbGetItem(id);
  if (!item) return false;
  // Remove the photo objects from storage (paths are the part after /photos/).
  const paths = item.images
    .map((url) => url.split(`/${BUCKET}/`)[1])
    .filter((p): p is string => Boolean(p));
  if (paths.length) await supabase().storage.from(BUCKET).remove(paths);
  const { error } = await supabase().from(TABLE).delete().eq("id", id);
  if (error) throw error;
  return true;
}

async function sbSaveImage(file: File): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext || "jpg"}`;
  const { error } = await supabase()
    .storage.from(BUCKET)
    .upload(name, bytes, { contentType: file.type || "image/jpeg" });
  if (error) throw error;
  return supabase().storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
}

/* ------------------------------------------------------------------ */
/* Public interface — picks the backend automatically                  */
/* ------------------------------------------------------------------ */

export const getItems = supabaseEnabled() ? sbGetItems : fileGetItems;
export const getItem = supabaseEnabled() ? sbGetItem : fileGetItemLocal;
export const addItem = supabaseEnabled() ? sbAddItem : fileAddItem;
export const updateItem = supabaseEnabled() ? sbUpdateItem : fileUpdateItem;
export const deleteItem = supabaseEnabled() ? sbDeleteItem : fileDeleteItem;
export const saveImage = supabaseEnabled() ? sbSaveImage : fileSaveImage;

async function fileGetItemLocal(id: string): Promise<Item | null> {
  const items = await fileGetItems();
  return items.find((i) => i.id === id) ?? null;
}
