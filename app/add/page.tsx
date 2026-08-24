"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { config } from "@/lib/config";
import type { Item } from "@/lib/types";

export default function AddPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  // Remember the password on this device so she doesn't retype it every time.
  useEffect(() => {
    const saved = localStorage.getItem("ds_pw");
    if (saved) {
      setPassword(saved);
      setUnlocked(true);
    }
  }, []);

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-sm px-5 py-20">
        <h1 className="font-display text-2xl font-bold text-center mb-2">
          Manage Inventory
        </h1>
        <p className="text-sm text-muted text-center mb-6">
          Enter the password to add or edit items.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            localStorage.setItem("ds_pw", password);
            setUnlocked(true);
          }}
          className="space-y-3"
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full rounded-lg border border-line bg-card px-4 py-3 text-base outline-none focus:border-foreground"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-foreground py-3 font-semibold text-background"
          >
            Continue
          </button>
        </form>
      </div>
    );
  }

  return <Manager password={password} onLock={() => {
    localStorage.removeItem("ds_pw");
    setUnlocked(false);
  }} />;
}

function Manager({ password, onLock }: { password: string; onLock: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(config.categories[0]);
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  async function loadItems() {
    const res = await fetch("/api/items");
    if (res.ok) setItems(await res.json());
  }
  useEffect(() => {
    loadItems();
  }, []);

  function onPick(list: FileList | null) {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(arr);
    setPreviews(arr.map((f) => URL.createObjectURL(f)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.set("password", password);
      fd.set("title", title);
      fd.set("category", category);
      fd.set("note", note);
      files.forEach((f) => fd.append("images", f));

      const res = await fetch("/api/items", { method: "POST", body: fd });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Something went wrong" }));
        throw new Error(error);
      }
      setMsg({ kind: "ok", text: "Added! It's live on the site." });
      setTitle("");
      setNote("");
      setFiles([]);
      setPreviews([]);
      if (fileInput.current) fileInput.current.value = "";
      loadItems();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setBusy(false);
    }
  }

  async function toggleSold(item: Item) {
    await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, sold: !item.sold }),
    });
    loadItems();
  }

  async function remove(item: Item) {
    if (!confirm(`Delete "${item.title}"? This can't be undone.`)) return;
    await fetch(`/api/items/${item.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    loadItems();
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Add a Piece</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/" className="text-muted hover:text-foreground">
            View site
          </Link>
          <button onClick={onLock} className="text-muted hover:text-foreground">
            Lock
          </button>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* Photos */}
        <div>
          <label className="block text-sm font-medium mb-2">Photos</label>
          <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-card px-4 py-8 text-center cursor-pointer hover:border-foreground/40">
            <span className="text-3xl">📷</span>
            <span className="text-sm text-muted">
              Tap to take a photo or choose from your library
            </span>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => onPick(e.target.files)}
            />
          </label>
          {previews.length > 0 && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {previews.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={src}
                  src={src}
                  alt=""
                  className="h-20 w-20 rounded-md object-cover border border-line"
                />
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Brass Table Lamp"
            required
            className="w-full rounded-lg border border-line bg-card px-4 py-3 text-base outline-none focus:border-foreground"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-line bg-card px-4 py-3 text-base outline-none focus:border-foreground"
          >
            {config.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Note <span className="text-muted font-normal">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Size, condition, or a little story about the piece."
            rows={3}
            className="w-full rounded-lg border border-line bg-card px-4 py-3 text-base outline-none focus:border-foreground resize-none"
          />
        </div>

        {msg && (
          <p
            className={`text-sm rounded-lg px-4 py-3 ${
              msg.kind === "ok"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-700"
            }`}
          >
            {msg.text}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-[#0866ff] py-3.5 font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Publishing…" : "Publish to site"}
        </button>
      </form>

      {/* Manage existing */}
      <div className="mt-12">
        <h2 className="font-display text-xl font-bold mb-4">
          Current Inventory{" "}
          <span className="text-muted font-sans text-sm font-normal">
            ({items.length})
          </span>
        </h2>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-line bg-card p-3"
            >
              {item.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.images[0]}
                  alt=""
                  className={`h-14 w-14 rounded-md object-cover ${item.sold ? "grayscale" : ""}`}
                />
              ) : (
                <div className="h-14 w-14 rounded-md bg-line" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.title}</p>
                <p className="text-xs text-muted">
                  {item.category}
                  {item.sold ? " · Sold" : ""}
                </p>
              </div>
              <button
                onClick={() => toggleSold(item)}
                className="text-xs rounded-full border border-line px-3 py-1.5 hover:border-foreground/40"
              >
                {item.sold ? "Mark available" : "Mark sold"}
              </button>
              <button
                onClick={() => remove(item)}
                className="text-xs text-red-600 hover:text-red-700 px-1"
              >
                Delete
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-muted">Nothing yet — add your first piece above.</p>
          )}
        </div>
      </div>
    </div>
  );
}
