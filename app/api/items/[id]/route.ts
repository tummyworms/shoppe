import { NextResponse } from "next/server";
import { deleteItem, updateItem } from "@/lib/store";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "shoppe";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  if (body.password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  const updated = await updateItem(id, {
    sold: typeof body.sold === "boolean" ? body.sold : undefined,
    title: body.title,
    category: body.category,
    note: body.note,
  });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (body.password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  const ok = await deleteItem(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
