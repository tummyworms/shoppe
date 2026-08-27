"use client";

import { useEffect, useMemo, useState } from "react";
import { config, messengerUrl } from "@/lib/config";
import type { Item } from "@/lib/types";

const CATEGORIES = config.categories;
const FB = messengerUrl();
const SERIF = "var(--font-display-stack)";

type View = "shop" | "item" | "admin";
type Sort = "newest" | "az" | "price";

export default function Shop({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [view, setView] = useState<View>("shop");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [query, setQuery] = useState("");

  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [adminFilter, setAdminFilter] = useState<"all" | "available" | "sold">("all");
  const [published, setPublished] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: CATEGORIES[0] as string,
    price: "",
    note: "",
    photoFile: null as File | null,
    photoPreview: "",
  });

  useEffect(() => {
    const pw = sessionStorage.getItem("ds_admin_pw");
    if (pw) {
      setPassword(pw);
      setAuthed(true);
    }
  }, []);

  async function refetch() {
    const r = await fetch("/api/items");
    if (r.ok) setItems(await r.json());
  }

  // ---- helpers ------------------------------------------------------------
  const photoOf = (it: Item) => it.images?.[0] || "";
  const fmtDate = (ms: number) =>
    new Date(ms).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  const fmtShort = (ms: number) =>
    new Date(ms).toLocaleDateString("en-US", { day: "numeric", month: "short" });
  const priceLabel = (it: Item) => {
    if (it.sold) return "Sold";
    const p = String(it.price || "").trim();
    if (!p) return "Message for price";
    return p.startsWith("$") ? "from " + p : "from $" + p;
  };

  const live = items.filter((i) => !i.sold);

  const publicList = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = items.filter((it) => {
      if (filter === "all") return !it.sold;
      if (filter === "sold") return it.sold;
      return !it.sold && it.category === filter;
    });
    if (q)
      list = list.filter((it) =>
        (it.title + " " + it.category + " " + (it.note || "")).toLowerCase().includes(q),
      );
    const num = (it: Item) => parseFloat(String(it.price || "").replace(/[^0-9.]/g, "")) || Infinity;
    if (sort === "az") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "price") list = [...list].sort((a, b) => num(a) - num(b));
    else list = [...list].sort((a, b) => b.createdAt - a.createdAt);
    return list;
  }, [items, filter, sort, query]);

  const current = items.find((i) => i.id === currentId) || null;

  function openItem(id: string) {
    setCurrentId(id);
    setView("item");
    window.scrollTo(0, 0);
  }
  function step(dir: number) {
    const i = publicList.findIndex((x) => x.id === currentId);
    if (i < 0 || !publicList.length) return;
    setCurrentId(publicList[(i + dir + publicList.length) % publicList.length].id);
  }

  // ---- admin --------------------------------------------------------------
  async function submitLogin() {
    const r = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: loginInput }),
    });
    const { ok } = await r.json().catch(() => ({ ok: false }));
    if (ok) {
      setAuthed(true);
      setPassword(loginInput);
      sessionStorage.setItem("ds_admin_pw", loginInput);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  }
  function signOut() {
    setAuthed(false);
    setPassword("");
    sessionStorage.removeItem("ds_admin_pw");
    setView("shop");
  }
  async function publish() {
    if (!form.title.trim()) return;
    const fd = new FormData();
    fd.set("password", password);
    fd.set("title", form.title.trim());
    fd.set("category", form.category);
    fd.set("price", form.price.trim());
    fd.set("note", form.note.trim());
    if (form.photoFile) fd.append("images", form.photoFile);
    const r = await fetch("/api/items", { method: "POST", body: fd });
    if (r.ok) {
      await refetch();
      setForm({ title: "", category: CATEGORIES[0], price: "", note: "", photoFile: null, photoPreview: "" });
      setPublished(true);
    }
  }
  async function toggleSold(it: Item) {
    await fetch(`/api/items/${it.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, sold: !it.sold }),
    });
    refetch();
  }
  async function remove(it: Item) {
    if (!confirm(`Delete "${it.title}"? This can't be undone.`)) return;
    await fetch(`/api/items/${it.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    refetch();
  }

  // ---- derived ------------------------------------------------------------
  const navRows = [
    { name: "All pieces", key: "all", count: live.length },
    ...CATEGORIES.map((c) => ({ name: c, key: c, count: live.filter((i) => i.category === c).length })),
    { name: "Sold archive", key: "sold", count: items.filter((i) => i.sold).length },
  ];
  const sortOptions: { key: Sort; label: string }[] = [
    { key: "newest", label: "Newest" },
    { key: "az", label: "A–Z" },
    { key: "price", label: "Price" },
  ];
  const headingTitle = filter === "all" ? "All pieces" : filter === "sold" ? "Sold archive" : filter;
  const headingMeta =
    filter === "sold"
      ? `${publicList.length} pieces already found homes`
      : `${publicList.length} available · last added ${live.length ? fmtDate(Math.max(...live.map((i) => i.createdAt))) : "—"}`;
  const related = current
    ? items.filter((i) => i.id !== current.id && !i.sold && i.category === current.category).slice(0, 4)
    : [];
  const adminList = items
    .filter((it) => (adminFilter === "all" ? true : adminFilter === "available" ? !it.sold : it.sold))
    .sort((a, b) => b.createdAt - a.createdAt);
  const adminFilters: { key: "all" | "available" | "sold"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "available", label: "Available" },
    { key: "sold", label: "Sold" },
  ];
  const ADMIN_COLS = "52px minmax(140px,1fr) 116px 108px 92px 74px 132px";

  // ---- render -------------------------------------------------------------
  return (
    <div className="shell">
      {/* ---------------- Sidebar ---------------- */}
      <aside
        className="sidebar"
        style={{
          borderRight: "1px solid #e2ddd2",
          background: "#f7f4ee",
          padding: "36px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 30,
        }}
      >
        <a onClick={() => setView("shop")} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt={config.shopName}
            style={{ height: 87, width: 235, objectFit: "contain", alignSelf: "flex-start" }}
          />
        </a>
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.96em",
            textTransform: "uppercase",
            color: "#6b6459",
            marginTop: -22,
          }}
        >
          By{" "}
          <a
            onClick={() => {
              setView("admin");
              setPublished(false);
            }}
            style={{ color: "inherit", letterSpacing: "inherit", cursor: "default" }}
          >
            Nancy
          </a>{" "}
          LoAlbo
        </span>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            borderBottom: "1px solid #cfc8b9",
            paddingBottom: 8,
          }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#8b8377" strokeWidth="1.6" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M16.5 16.5 21 21" />
          </svg>
          <input
            type="search"
            placeholder="Search the shop"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setView("shop")}
            style={{ border: 0, background: "transparent", outline: "none", width: "100%", fontSize: 13.5 }}
          />
        </label>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: 10,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: "#a09889",
              paddingBottom: 10,
              borderBottom: "1px solid #e2ddd2",
            }}
          >
            Browse
          </span>
          {navRows.map((row) => (
            <a
              key={row.key}
              onClick={() => {
                setFilter(row.key);
                setView("shop");
              }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                padding: "11px 0",
                borderBottom: "1px solid #e2ddd2",
                fontSize: 14.5,
                color: "#4a453d",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {filter === row.key && (
                  <span style={{ width: 14, height: 1, background: "#1a1a1a", display: "block" }} />
                )}
                {row.name}
              </span>
              <span style={{ color: "#c0b9ab", fontSize: 11.5 }}>{row.count}</span>
            </a>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: "auto", paddingTop: 10 }}>
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.7, color: "#6b6459", textWrap: "pretty" }}>
            Every piece is one of a kind. Message for price, dimensions, or to arrange a visit — Nancy answers
            herself.
          </p>
          <a href={FB} target="_blank" rel="noopener noreferrer" style={btnDark}>
            Message on Facebook
          </a>
        </div>
      </aside>

      {/* ---------------- Main ---------------- */}
      <main style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* ---- Shop ---- */}
        {view === "shop" && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                padding: "38px 40px 24px",
                borderBottom: "1px solid #e2ddd2",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                gap: 32,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: SERIF,
                    fontSize: 42,
                    fontWeight: 500,
                    letterSpacing: "-0.018em",
                    lineHeight: 1.05,
                  }}
                >
                  {headingTitle}
                </h1>
                <span style={{ fontSize: 12.5, color: "#6b6459", letterSpacing: "0.02em" }}>{headingMeta}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 20,
                  fontSize: 11.5,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#6b6459",
                }}
              >
                {sortOptions.map((s) => (
                  <a
                    key={s.key}
                    onClick={() => setSort(s.key)}
                    style={{ display: "flex", flexDirection: "column", gap: 4, color: "#6b6459" }}
                  >
                    {s.label}
                    {sort === s.key && <span style={{ display: "block", height: 1, background: "#1a1a1a" }} />}
                  </a>
                ))}
              </div>
            </div>

            {publicList.length > 0 ? (
              <div className="shop-grid">
                {publicList.map((item) => (
                  <a
                    key={item.id}
                    onClick={() => openItem(item.id)}
                    className="hoverable"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 11,
                      padding: 20,
                      borderRight: "1px solid #e2ddd2",
                      borderBottom: "1px solid #e2ddd2",
                      animation: "rise 0.4s ease both",
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        aspectRatio: "1/1",
                        background: "#fff",
                        border: "1px solid #ece7dd",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {photoOf(item) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photoOf(item)}
                          alt={item.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <span style={placeholderLabel}>{item.category}</span>
                      )}
                      {item.sold && (
                        <span
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: "#f7f4ee",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            letterSpacing: "0.24em",
                            textTransform: "uppercase",
                            color: "#1a1a1a",
                          }}
                        >
                          Sold
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 14, lineHeight: 1.35 }}>{item.title}</span>
                      <span
                        style={{
                          fontSize: 11.5,
                          color: "#8b8377",
                          letterSpacing: "0.03em",
                          minHeight: 16,
                        }}
                      >
                        {priceLabel(item)}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, padding: "80px 40px", textAlign: "center", fontSize: 14, color: "#8b8377" }}>
                Nothing here yet — try another category.
              </p>
            )}
          </div>
        )}

        {/* ---- Item ---- */}
        {view === "item" && current && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                padding: "22px 40px",
                borderBottom: "1px solid #e2ddd2",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 20,
              }}
            >
              <a onClick={() => setView("shop")} style={uppercaseLink}>
                ← All pieces
              </a>
              <div style={{ display: "flex", gap: 18, fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8b8377" }}>
                <a onClick={() => step(-1)}>Prev</a>
                <a onClick={() => step(1)}>Next</a>
              </div>
            </div>

            <div
              className="detail-grid"
              style={{ padding: "36px 40px 48px" }}
            >
              <div
                style={{
                  aspectRatio: "4/5",
                  background: "#f4f0e7",
                  border: "1px solid #e2ddd2",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {photoOf(current) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoOf(current)} alt={current.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 10, letterSpacing: "0.26em", textTransform: "uppercase", color: "#c8c1b3" }}>
                    No photo yet
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", paddingTop: 4, minWidth: 0 }}>
                <span style={{ fontSize: 10.5, letterSpacing: "0.34em", textTransform: "uppercase", color: "#8b8377" }}>
                  {current.category}
                </span>
                <h1
                  style={{
                    margin: "12px 0 0",
                    fontFamily: SERIF,
                    fontSize: 40,
                    lineHeight: 1.08,
                    fontWeight: 500,
                    letterSpacing: "-0.015em",
                    textWrap: "balance",
                  }}
                >
                  {current.title}
                </h1>
                <p style={{ margin: "14px 0 0", fontSize: 17, color: "#4a453d", letterSpacing: "0.02em" }}>
                  {priceLabel(current)}
                </p>
                <p
                  style={{
                    margin: "24px 0 0",
                    fontSize: 15.5,
                    lineHeight: 1.8,
                    color: "#4a453d",
                    whiteSpace: "pre-line",
                    textWrap: "pretty",
                  }}
                >
                  {current.note || "Message for details on this piece."}
                </p>
                <div style={{ marginTop: 28, borderTop: "1px solid #e2ddd2", display: "flex", flexDirection: "column" }}>
                  <DetailRow label="Category" value={current.category} />
                  <DetailRow label="Status" value={current.sold ? "Sold" : "Available"} />
                  <DetailRow label="Added" value={fmtDate(current.createdAt)} />
                </div>
                <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 12 }}>
                  <a href={FB} target="_blank" rel="noopener noreferrer" style={{ ...btnDark, padding: "17px 24px", fontSize: 12, letterSpacing: "0.18em" }}>
                    Message about this piece
                  </a>
                  <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.65, color: "#8b8377", textWrap: "pretty" }}>
                    Price, shipping, and viewing are arranged by message — usually the same day.
                  </p>
                </div>
              </div>
            </div>

            {related.length > 0 && (
              <div style={{ borderTop: "1px solid #e2ddd2", padding: "36px 40px 44px", display: "flex", flexDirection: "column", gap: 20 }}>
                <span style={{ fontSize: 10.5, letterSpacing: "0.3em", textTransform: "uppercase", color: "#8b8377" }}>
                  More like this
                </span>
                <div className="related-grid">
                  {related.map((item) => (
                    <a key={item.id} onClick={() => openItem(item.id)} style={{ display: "flex", flexDirection: "column", gap: 9, minWidth: 0 }}>
                      <div
                        style={{
                          aspectRatio: "1/1",
                          background: "#fff",
                          border: "1px solid #ece7dd",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {photoOf(item) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photoOf(item)} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span style={{ ...placeholderLabel, fontSize: 9 }}>{item.category}</span>
                        )}
                      </div>
                      <span style={{ fontSize: 13.5, lineHeight: 1.35 }}>{item.title}</span>
                      <span style={{ fontSize: 11, color: "#8b8377", marginTop: -5 }}>{priceLabel(item)}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- Login ---- */}
        {view === "admin" && !authed && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 40px" }}>
            <div style={{ width: 340, display: "flex", flexDirection: "column", gap: 16 }}>
              <h1 style={{ margin: 0, fontFamily: SERIF, fontSize: 30, fontWeight: 500 }}>Manage inventory</h1>
              <p style={{ margin: 0, fontSize: 13, color: "#6b6459", lineHeight: 1.6 }}>
                Private. Enter the shop password to add or edit pieces.
              </p>
              <input
                type="password"
                placeholder="Password"
                value={loginInput}
                onChange={(e) => {
                  setLoginInput(e.target.value);
                  setLoginError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitLogin();
                }}
                style={{ border: "1px solid #cfc8b9", background: "#fff", padding: "13px 14px", outline: "none" }}
              />
              {loginError && <span style={{ fontSize: 12, color: "#9a3b2f" }}>That password isn’t right.</span>}
              <button onClick={submitLogin} style={{ ...btnDark, border: 0, padding: 15, cursor: "pointer" }}>
                Enter
              </button>
              <a onClick={() => setView("shop")} style={{ ...uppercaseLink, color: "#a09889", textAlign: "center", fontSize: 11 }}>
                Back to the shop
              </a>
            </div>
          </div>
        )}

        {/* ---- Admin ---- */}
        {view === "admin" && authed && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                padding: "34px 36px 22px",
                borderBottom: "1px solid #e2ddd2",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                gap: 28,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                <h1 style={{ margin: 0, fontFamily: SERIF, fontSize: 36, fontWeight: 500, letterSpacing: "-0.018em", lineHeight: 1.05 }}>
                  Manage inventory
                </h1>
                <span style={{ fontSize: 12.5, color: "#6b6459" }}>
                  {items.length} total · {live.length} available · {items.length - live.length} sold
                </span>
              </div>
              <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                {adminFilters.map((f) => (
                  <a
                    key={f.key}
                    onClick={() => setAdminFilter(f.key)}
                    style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6b6459" }}
                  >
                    {f.label}
                    {adminFilter === f.key && <span style={{ display: "block", height: 1, background: "#1a1a1a" }} />}
                  </a>
                ))}
                <a onClick={signOut} style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#b3ab9d", marginLeft: 8 }}>
                  Sign out
                </a>
              </div>
            </div>

            <div className="admin-grid">
              <div style={{ borderRight: "1px solid #e2ddd2", minWidth: 0, overflowX: "auto" }}>
                <div style={{ display: "flex", flexDirection: "column", minWidth: 680 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: ADMIN_COLS,
                    gap: 12,
                    padding: "12px 28px",
                    background: "#f7f4ee",
                    borderBottom: "1px solid #e2ddd2",
                    fontSize: 9.5,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "#a09889",
                    alignItems: "center",
                  }}
                >
                  <span>Photo</span>
                  <span>Title</span>
                  <span>Category</span>
                  <span>Price</span>
                  <span>Status</span>
                  <span>Added</span>
                  <span />
                </div>
                {adminList.map((it) => (
                  <div
                    key={it.id}
                    className="hoverable"
                    style={{
                      display: "grid",
                      gridTemplateColumns: ADMIN_COLS,
                      gap: 12,
                      padding: "12px 28px",
                      borderBottom: "1px solid #e2ddd2",
                      alignItems: "center",
                      fontSize: 13.5,
                    }}
                  >
                    <div style={{ width: 40, height: 40, background: "#fff", border: "1px solid #ece7dd", overflow: "hidden" }}>
                      {photoOf(it) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photoOf(it)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                    </div>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</span>
                    <span style={{ fontSize: 12, color: "#6b6459" }}>{it.category}</span>
                    <span style={{ fontSize: 12.5, color: "#4a453d" }}>
                      {it.sold ? "—" : priceLabel(it).replace("from ", "")}
                    </span>
                    <span style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6b6459" }}>
                      {it.sold ? "Sold" : "Available"}
                    </span>
                    <span style={{ fontSize: 12, color: "#8b8377" }}>{fmtShort(it.createdAt)}</span>
                    <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                      <a onClick={() => toggleSold(it)} style={{ color: "#4a453d" }}>
                        {it.sold ? "Available" : "Mark sold"}
                      </a>
                      <a onClick={() => remove(it)} style={{ color: "#a09889" }}>
                        Delete
                      </a>
                    </div>
                  </div>
                ))}
                <div style={{ padding: "22px 28px", fontSize: 12.5, color: "#8b8377" }}>
                  Showing {adminList.length} of {items.length}
                </div>
                </div>
              </div>

              <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 14, background: "#f7f4ee", borderBottom: "1px solid #e2ddd2" }}>
                <span style={{ fontSize: 10, letterSpacing: "0.26em", textTransform: "uppercase", color: "#a09889" }}>Add a piece</span>
                <label style={fieldLabel}>
                  Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setForm((s) => ({ ...s, photoFile: f, photoPreview: URL.createObjectURL(f) }));
                    }}
                    style={{ fontSize: 12, color: "#4a453d" }}
                  />
                </label>
                {form.photoPreview && (
                  <div style={{ width: "100%", aspectRatio: "1/1", border: "1px solid #dcd6c9", overflow: "hidden", background: "#fff" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.photoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
                <label style={fieldLabel}>
                  Title
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                    placeholder="Brass table lamp"
                    style={fieldInput}
                  />
                </label>
                <label style={fieldLabel}>
                  Category
                  <select value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} style={fieldInput}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={fieldLabel}>
                  Price (optional)
                  <input
                    type="text"
                    value={form.price}
                    onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
                    placeholder="145"
                    style={fieldInput}
                  />
                </label>
                <label style={fieldLabel}>
                  Note
                  <textarea
                    rows={4}
                    value={form.note}
                    onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
                    placeholder="Dimensions, condition, story"
                    style={{ ...fieldInput, resize: "vertical" }}
                  />
                </label>
                <button onClick={publish} style={{ ...btnDark, border: 0, padding: 15, cursor: "pointer" }}>
                  Publish
                </button>
                {published && <span style={{ fontSize: 12, color: "#4a453d" }}>Added to the shop.</span>}
              </div>
            </div>
          </div>
        )}

        <footer
          style={{
            marginTop: "auto",
            borderTop: "1px solid #e2ddd2",
            padding: "26px 40px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            fontSize: 11.5,
            color: "#8b8377",
            letterSpacing: "0.04em",
          }}
        >
          <span>{config.shopName} · By Nancy LoAlbo</span>
          <a href={FB} target="_blank" rel="noopener noreferrer" style={{ letterSpacing: "0.16em", textTransform: "uppercase", fontSize: 10.5 }}>
            Message on Facebook
          </a>
        </footer>
      </main>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "13px 0", borderBottom: "1px solid #e2ddd2", fontSize: 13.5 }}>
      <span style={{ color: "#8b8377" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const btnDark: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#1a1a1a",
  color: "#f7f4ee",
  padding: "14px 18px",
  fontSize: 11,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
};
const uppercaseLink: React.CSSProperties = {
  fontSize: 11.5,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#6b6459",
};
const placeholderLabel: React.CSSProperties = {
  fontSize: 9.5,
  letterSpacing: "0.24em",
  textTransform: "uppercase",
  color: "#cec7b9",
};
const fieldLabel: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 11,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#8b8377",
};
const fieldInput: React.CSSProperties = {
  border: "1px solid #dcd6c9",
  background: "#fff",
  padding: "11px 12px",
  outline: "none",
};
