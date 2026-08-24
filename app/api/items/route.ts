import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { addItem, getItems, saveImage } from "@/lib/store";
import { getEnv } from "@/lib/env";
import type { Item } from "@/lib/types";

export async function GET() {
  return NextResponse.json(await getItems());
}

export async function POST(req: Request) {
  const form = await req.formData();

  if (form.get("password") !== getEnv("ADMIN_PASSWORD")) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const title = (form.get("title") as string)?.trim();
  const category = (form.get("category") as string)?.trim();
  const note = ((form.get("note") as string) || "").trim();
  if (!title || !category) {
    return NextResponse.json({ error: "Title and category are required" }, { status: 400 });
  }

  const files = form.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  const images: string[] = [];
  for (const file of files) {
    images.push(await saveImage(file));
  }

  const item: Item = {
    id: randomUUID(),
    title,
    category,
    note: note || undefined,
    images,
    sold: false,
    createdAt: Date.now(),
  };
  await addItem(item);

  return NextResponse.json(item, { status: 201 });
}
