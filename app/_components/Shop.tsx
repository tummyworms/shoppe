"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { config, messengerUrl } from "@/lib/config";
import type { Item } from "@/lib/types";

const CATEGORIES = config.categories;
const FB = messengerUrl();
const SERIF = "var(--font-display-stack)";

/* ---- Theme (Gallery cream) ------------------------------------------- */
const BASE = {
  shell: "#e9e4d9",
  bar: "#f7f4ee",
  card: "#fdfcf9",
  well: "#f2efe8",
  line: "#ddd7c9",
  ink: "#1a1a1a",
  soft: "#4a453d",
  faint: "#8b8377",
  accent: "#8a6a3b",
  logoFilter: "none",
};
const WASH = "rgba(120,100,70,0.055)";

function buildFloral() {
  const bloom = (x: number, petal: string, heart: string) =>
    `<g transform="translate(${x},9)">` +
    [
      [0, -2.7],
      [2.57, -0.83],
      [1.59, 2.18],
      [-1.59, 2.18],
      [-2.57, -0.83],
    ]
      .map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="1.75" fill="${petal}"/>`)
      .join("") +
    `<circle cx="0" cy="0" r="1.15" fill="${heart}"/></g>`;
  const leaf = (x: number, flip: boolean) =>
    `<ellipse cx="${x}" cy="${flip ? 13.4 : 14.6}" rx="2.6" ry="1.15" fill="#93a67c" opacity="0.85" transform="rotate(${flip ? -18 : 16} ${x} 14)"/>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="168" height="22" viewBox="0 0 168 22">` +
    `<path d="M0 15 Q 21 10.5 42 15 T 84 15 T 126 15 T 168 15" fill="none" stroke="#93a67c" stroke-width="0.7" opacity="0.9"/>` +
    leaf(12, false) +
    leaf(54, true) +
    leaf(96, false) +
    leaf(138, true) +
    bloom(21, "#d98b9a", "#e6c25f") +
    bloom(63, "#8fb0cf", "#e6c25f") +
    bloom(105, "#d9a55c", "#8a6a3b") +
    bloom(147, "#b79bc9", "#e6c25f") +
    `</svg>`
  );
}

const t = {
  ...BASE,
  floral: `url("data:image/svg+xml,${encodeURIComponent(buildFloral())}")`,
  grain:
    `repeating-linear-gradient(0deg, ${WASH} 0 1px, transparent 1px 4px),` +
    `radial-gradient(120% 90% at 50% 0%, ${WASH} 0%, transparent 60%)`,
};

const DENSITY = { cols: "repeat(auto-fill,minmax(232px,1fr))", gap: "1px", pad: "1px", ratio: "1/1", title: "15.5px" };

type View = "shop" | "item" | "admin";
type Sort = "newest" | "az";

export default function Shop({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [view, setView] = useState<View>("shop");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("newest");

  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [adminFilter, setAdminFilter] = useState<"all" | "available" | "sold">("all");
  const [published, setPublished] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: CATEGORIES[0] as string,
    sku: "",
    note: "",
    photoFile: null as File | null,
    photoPreview: "",
  });

  const [narrow, setNarrow] = useState(false);
  const [headerH, setHeaderH] = useState(0);
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const pw = sessionStorage.getItem("ds_admin_pw");
    if (pw) {
      setPassword(pw);
      setAuthed(true);
    }
    const onResize = () => setNarrow(window.innerWidth < 760);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const sync = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      if (h) setHeaderH(h);
    };
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    sync();
    return () => ro.disconnect();
  }, [view, narrow]);

  async function refetch() {
    const r = await fetch("/api/items");
    if (r.ok) setItems(await r.json());
  }

  // ---- helpers ----
  const photoOf = (it: Item) => it.images?.[0] || "";
  const noteOf = (it: Item) =>
    it.note ||
    (it.sku
      ? `Uttermost ${it.sku}. Message for dimensions, finish, and availability.`
      : "Message for dimensions, finish, and availability.");
  const fmtDate = (ms: number) =>
    new Date(ms).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  const fmtShort = (ms: number) => new Date(ms).toLocaleDateString("en-US", { day: "numeric", month: "short" });

  const live = items.filter((i) => !i.sold);

  const list = useMemo(() => {
    let l = items.filter((it) =>
      filter === "all" ? !it.sold : filter === "sold" ? it.sold : !it.sold && it.category === filter,
    );
    if (sort === "az") l = [...l].sort((a, b) => a.title.localeCompare(b.title));
    else l = [...l].sort((a, b) => b.createdAt - a.createdAt);
    return l;
  }, [items, filter, sort]);

  const cur = items.find((i) => i.id === currentId) || items[0] || null;

  function openItem(id: string) {
    setCurrentId(id);
    setView("item");
    window.scrollTo(0, 0);
  }
  function step(dir: number) {
    const i = list.findIndex((x) => x.id === currentId);
    if (i < 0 || !list.length) return;
    setCurrentId(list[(i + dir + list.length) % list.length].id);
  }

  // ---- admin actions ----
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
    } else setLoginError(true);
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
    fd.set("sku", form.sku.trim());
    fd.set("note", form.note.trim());
    if (form.photoFile) fd.append("images", form.photoFile);
    const r = await fetch("/api/items", { method: "POST", body: fd });
    if (r.ok) {
      await refetch();
      setForm({ title: "", category: CATEGORIES[0], sku: "", note: "", photoFile: null, photoPreview: "" });
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
  async function clearAll() {
    if (!confirm(`Remove all ${items.length} pieces from the catalogue?`)) return;
    await Promise.all(
      items.map((it) =>
        fetch(`/api/items/${it.id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        }),
      ),
    );
    refetch();
  }

  // ---- derived ----
  const navRows = [
    { name: "All", key: "all", count: live.length },
    ...CATEGORIES.map((c) => ({ name: c, key: c, count: live.filter((i) => i.category === c).length })),
    { name: "Sold", key: "sold", count: items.filter((i) => i.sold).length },
  ];
  const sortOptions: { key: Sort; label: string }[] = [
    { key: "newest", label: "Newest" },
    { key: "az", label: "A–Z" },
  ];
  const filteredSuffix = filter === "all" ? "" : filter === "sold" ? " sold" : " in " + filter;
  const soldCount = items.length - live.length;
  const countLabel =
    items.length === 0
      ? "No inventory"
      : `${live.length} available${soldCount ? ` · ${soldCount} sold` : ""}${filteredSuffix}`;

  const groupNames = filter === "all" ? [...CATEGORIES] : filter === "sold" ? ["Sold"] : [filter];
  const groups = groupNames
    .map((name) => {
      const rows = name === "Sold" ? list : list.filter((it) => it.category === name);
      return { name, items: rows, countLabel: `${rows.length} ${rows.length === 1 ? "piece" : "pieces"}` };
    })
    .filter((g) => g.items.length)
    .map((g, i) => ({ ...g, numeral: String(i + 1).padStart(2, "0") }));

  const adminList = items
    .filter((it) => (adminFilter === "all" ? true : adminFilter === "available" ? !it.sold : it.sold))
    .sort((a, b) => b.createdAt - a.createdAt);
  const adminFilters: { key: "all" | "available" | "sold"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "available", label: "Available" },
    { key: "sold", label: "Sold" },
  ];

  // ---- responsive tokens ----
  const d = narrow ? { ...DENSITY, cols: "repeat(2,minmax(0,1fr))" } : DENSITY;
  const headerPad = narrow ? "12px 16px" : "14px 28px";
  const chipPad = narrow ? "0 16px 10px" : "0 28px 12px";
  const logoH = narrow ? "40px" : "52px";
  const itemCols = narrow ? "minmax(0,1fr)" : "minmax(0,1.15fr) minmax(0,1fr)";
  const itemPanePad = narrow ? "28px 18px 40px" : "52px 44px";
  const itemMediaMin = narrow ? "300px" : "520px";
  const itemMediaBorder = narrow ? "0" : `1px solid ${t.line}`;
  const adminCols = narrow ? "minmax(0,1fr)" : "minmax(0,1fr) 330px";
  const sectionPad = narrow ? "16px 16px 12px" : "20px 28px 14px";
  const rowPad = narrow ? "11px 16px" : "11px 28px";
  const titleFs = narrow ? "34px" : "42px";
  const groupFs = narrow ? "18px" : "22px";
  const groupTop = `${headerH || 136}px`;
  const ADMIN_COLS = "48px minmax(160px,1fr) 118px 86px 74px 128px";

  const chip = (on: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "baseline",
    gap: 7,
    padding: "7px 13px",
    fontSize: 10.5,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    border: `1px solid ${on ? t.accent : t.line}`,
    background: on ? t.accent : "transparent",
    color: on ? t.bar : t.faint,
  });
  const underline = (on: boolean) => ({
    link: { display: "flex", flexDirection: "column", gap: 4, color: on ? t.ink : t.faint } as React.CSSProperties,
    rule: { display: "block", height: 1, background: on ? t.ink : "transparent" } as React.CSSProperties,
  });
  const inquireBtn: React.CSSProperties = {
    background: t.ink,
    color: t.bar,
    padding: "11px 20px",
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        color: t.ink,
        backgroundColor: t.shell,
        backgroundImage: t.grain,
      }}
    >
      {/* ---------------- Header ---------------- */}
      <header
        ref={headerRef}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: t.bar,
          borderBottom: `1px solid ${t.line}`,
          boxShadow: `0 1px 0 ${t.line}, 0 14px 30px -26px rgba(0,0,0,0.5)`,
        }}
      >
        <div style={{ height: 3, background: t.accent }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, padding: headerPad }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt={config.shopName}
              onClick={() => setView("shop")}
              style={{ height: logoH, width: "auto", objectFit: "contain", display: "block", cursor: "pointer", filter: t.logoFilter }}
            />
            {!narrow && (
              <span style={{ display: "flex", flexDirection: "column", gap: 3, borderLeft: `1px solid ${t.line}`, paddingLeft: 16 }}>
                <span style={{ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: t.accent }}>
                  Inventory catalogue
                </span>
                <span style={{ fontSize: 11, letterSpacing: "0.06em", color: t.faint }}>
                  By{" "}
                  <a
                    onClick={() => {
                      setView("admin");
                      setPublished(false);
                    }}
                    style={{ color: "inherit", cursor: "default" }}
                  >
                    Nancy
                  </a>{" "}
                  LoAlbo{" "}
                  <span style={{ fontStyle: "italic", fontFamily: SERIF, fontSize: 11.5 }}>— Interior Designer</span>
                </span>
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            {!narrow && <span style={{ fontSize: 11, letterSpacing: "0.06em", color: t.faint }}>{countLabel}</span>}
            <a href={FB} target="_blank" rel="noopener noreferrer" style={inquireBtn}>
              Inquire
            </a>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: chipPad, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {navRows.map((row) => (
              <a
                key={row.key}
                onClick={() => {
                  setFilter(row.key);
                  setView("shop");
                }}
                style={chip(filter === row.key)}
              >
                <span>{row.name}</span>
                <span style={{ fontSize: 9.5, opacity: 0.55 }}>{row.count}</span>
              </a>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: t.faint }}>
            <span>Sort</span>
            {sortOptions.map((s) => {
              const u = underline(sort === s.key);
              return (
                <a key={s.key} onClick={() => setSort(s.key)} style={u.link}>
                  <span>{s.label}</span>
                  <span style={u.rule} />
                </a>
              );
            })}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: -7,
            height: 14,
            pointerEvents: "none",
            backgroundImage: t.floral,
            backgroundRepeat: "repeat-x",
            backgroundPosition: "left center",
            backgroundSize: "auto 14px",
            opacity: 0.95,
          }}
        />
      </header>

      {/* ---------------- Shop ---------------- */}
      {view === "shop" && (
        <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {groups.map((group) => (
            <div key={group.name} style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 20,
                  padding: sectionPad,
                  borderBottom: `1px solid ${t.line}`,
                  background: t.bar,
                  position: "sticky",
                  top: groupTop,
                  zIndex: 10,
                }}
              >
                <span style={{ display: "flex", alignItems: "baseline", gap: 14, minWidth: 0 }}>
                  <span style={{ fontFamily: SERIF, fontSize: 12, letterSpacing: "0.08em", color: t.accent }}>{group.numeral}</span>
                  <span style={{ fontFamily: SERIF, fontSize: groupFs, letterSpacing: "-0.01em" }}>{group.name}</span>
                </span>
                <span style={{ fontSize: 9.5, letterSpacing: "0.28em", textTransform: "uppercase", color: t.faint }}>{group.countLabel}</span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: d.cols,
                  gap: d.gap,
                  background: t.line,
                  padding: d.pad,
                  borderBottom: `1px solid ${t.line}`,
                }}
              >
                {group.items.map((item) => (
                  <a
                    key={item.id}
                    onClick={() => openItem(item.id)}
                    className="tile"
                    style={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      background: t.card,
                      overflow: "hidden",
                      animation: "rise 0.35s ease both",
                      color: t.ink,
                    }}
                  >
                    <div style={{ position: "relative", aspectRatio: d.ratio, overflow: "hidden", background: t.well }}>
                      {photoOf(item) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photoOf(item)} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      ) : (
                        <span
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 9,
                            letterSpacing: "0.26em",
                            textTransform: "uppercase",
                            color: t.faint,
                          }}
                        >
                          {item.category}
                        </span>
                      )}
                      {item.sold && (
                        <span
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 12,
                            background: t.ink,
                            color: t.bar,
                            fontSize: 8.5,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            padding: "4px 10px",
                          }}
                        >
                          Sold
                        </span>
                      )}
                    </div>
                    <span className="cap" style={{ display: "flex", flexDirection: "column", gap: 6, padding: "13px 14px 15px", borderTop: `1px solid ${t.line}` }}>
                      <span style={{ fontFamily: SERIF, fontSize: d.title, lineHeight: 1.25 }}>{item.title}</span>
                      <span style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: t.faint }}>
                        <span style={{ fontSize: 9 }}>{item.category}</span>
                        <span style={{ fontSize: 9 }}>{item.sold ? "Sold" : ""}</span>
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ))}

          {list.length === 0 && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "120px 40px", textAlign: "center" }}>
              <span style={{ fontSize: 9.5, letterSpacing: "0.44em", textTransform: "uppercase", color: t.accent }}>No inventory</span>
              <p style={{ margin: 0, fontFamily: SERIF, fontSize: 30, fontWeight: 400, letterSpacing: "-0.012em", maxWidth: 460, lineHeight: 1.3, textWrap: "balance" }}>
                {items.length === 0 ? "No inventory yet." : filter === "sold" ? "No sold pieces yet." : `No inventory in ${filter}.`}
              </p>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7, maxWidth: 380, color: t.faint, textWrap: "pretty" }}>
                {items.length === 0
                  ? "Photograph a piece, add it in Manage inventory, and it appears here immediately."
                  : "Add pieces to this category, or choose another from the row above."}
              </p>
            </div>
          )}
        </main>
      )}

      {/* ---------------- Item ---------------- */}
      {view === "item" && cur && (
        <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              padding: rowPad,
              borderBottom: `1px solid ${t.line}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 20,
              background: t.bar,
              fontSize: 10.5,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: t.faint,
            }}
          >
            <a onClick={() => setView("shop")} style={{ color: "inherit" }}>
              ← All pieces
            </a>
            <span style={{ display: "flex", gap: 20 }}>
              <a onClick={() => step(-1)} style={{ color: "inherit" }}>
                Prev
              </a>
              <a onClick={() => step(1)} style={{ color: "inherit" }}>
                Next
              </a>
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: itemCols, gap: 0, flex: 1 }}>
            <div style={{ background: t.well, display: "flex", alignItems: "center", justifyContent: "center", minHeight: itemMediaMin, borderRight: itemMediaBorder, overflow: "hidden" }}>
              {photoOf(cur) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoOf(cur)} alt={cur.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                <span style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: t.faint }}>No photo yet</span>
              )}
            </div>
            <div style={{ padding: itemPanePad, display: "flex", flexDirection: "column", minWidth: 0, background: t.card }}>
              <span style={{ fontSize: 9.5, letterSpacing: "0.42em", textTransform: "uppercase", color: t.accent }}>{cur.category}</span>
              <h1 style={{ margin: "16px 0 0", fontFamily: SERIF, fontSize: titleFs, lineHeight: 1.06, fontWeight: 500, letterSpacing: "-0.02em", textWrap: "balance" }}>
                {cur.title}
              </h1>
              <span style={{ display: "block", width: 46, height: 2, background: t.accent, margin: "20px 0 0" }} />
              <p style={{ margin: "26px 0 0", fontSize: 15, lineHeight: 1.85, whiteSpace: "pre-line", color: t.soft, textWrap: "pretty" }}>{noteOf(cur)}</p>
              <div style={{ marginTop: 30, borderTop: `1px solid ${t.line}`, display: "flex", flexDirection: "column" }}>
                <SpecRow label="Category" value={cur.category} />
                <SpecRow label="Status" value={cur.sold ? "Sold" : "Available"} />
                <SpecRow label="Added" value={fmtDate(cur.createdAt)} />
              </div>
              <a
                href={FB}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginTop: 30, display: "inline-flex", alignItems: "center", justifyContent: "center", background: t.ink, color: t.bar, padding: "16px 24px", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" }}
              >
                Inquire about this piece
              </a>
            </div>
          </div>
        </main>
      )}

      {/* ---------------- Login ---------------- */}
      {view === "admin" && !authed && (
        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "90px 40px" }}>
          <div style={{ width: 340, display: "flex", flexDirection: "column", gap: 14 }}>
            <h1 style={{ margin: 0, fontFamily: SERIF, fontSize: 28, fontWeight: 500 }}>Manage inventory</h1>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: t.faint }}>Private. Enter the shop password to add or edit pieces.</p>
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
              style={{ border: `1px solid ${t.line}`, background: t.card, color: t.ink, padding: "13px 14px", outline: "none" }}
            />
            {loginError && <span style={{ fontSize: 12, color: "#9a3b2f" }}>That password isn’t right.</span>}
            <button onClick={submitLogin} style={{ border: 0, background: t.ink, color: t.bar, padding: 15, fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer" }}>
              Enter
            </button>
            <a onClick={() => setView("shop")} style={{ fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: t.faint, textAlign: "center" }}>
              Back to the catalogue
            </a>
          </div>
        </main>
      )}

      {/* ---------------- Admin ---------------- */}
      {view === "admin" && authed && (
        <main style={{ flex: 1, display: "grid", gridTemplateColumns: adminCols, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", borderRight: `1px solid ${t.line}`, minWidth: 0, overflowX: "auto" }}>
            <div style={{ padding: sectionPad, borderBottom: `1px solid ${t.line}`, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <h1 style={{ margin: 0, fontFamily: SERIF, fontSize: 30, fontWeight: 500, letterSpacing: "-0.015em" }}>Manage inventory</h1>
                <span style={{ fontSize: 12, color: t.faint }}>
                  {items.length} catalogued · {live.length} available · {soldCount} sold
                </span>
              </div>
              <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                {adminFilters.map((f) => {
                  const u = underline(adminFilter === f.key);
                  return (
                    <a key={f.key} onClick={() => setAdminFilter(f.key)} style={u.link}>
                      <span>{f.label}</span>
                      <span style={u.rule} />
                    </a>
                  );
                })}
                <a onClick={signOut} style={{ color: t.faint, marginLeft: 6 }}>
                  Sign out
                </a>
                {items.length > 0 && (
                  <a onClick={clearAll} style={{ color: t.faint }}>
                    Clear all
                  </a>
                )}
              </div>
            </div>
            <div style={{ minWidth: 640 }}>
              <div style={{ display: "grid", gridTemplateColumns: ADMIN_COLS, gap: 12, padding: "11px 28px", background: t.bar, borderBottom: `1px solid ${t.line}`, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: t.faint, alignItems: "center" }}>
                <span>Photo</span>
                <span>Title</span>
                <span>Category</span>
                <span>Status</span>
                <span>Added</span>
                <span />
              </div>
              {adminList.map((it) => (
                <div key={it.id} style={{ display: "grid", gridTemplateColumns: ADMIN_COLS, gap: 12, padding: "11px 28px", borderBottom: `1px solid ${t.line}`, alignItems: "center", fontSize: 13 }}>
                  <span style={{ width: 38, height: 38, background: t.well, border: `1px solid ${t.line}`, overflow: "hidden", display: "block" }}>
                    {photoOf(it) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoOf(it)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    )}
                  </span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</span>
                  <span style={{ fontSize: 11.5, color: t.faint }}>{it.category}</span>
                  <span style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: t.faint }}>{it.sold ? "Sold" : "Available"}</span>
                  <span style={{ fontSize: 11.5, color: t.faint }}>{fmtShort(it.createdAt)}</span>
                  <span style={{ display: "flex", gap: 12, justifyContent: "flex-end", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    <a onClick={() => toggleSold(it)} style={{ color: t.soft }}>
                      {it.sold ? "Available" : "Mark sold"}
                    </a>
                    <a onClick={() => remove(it)} style={{ color: t.faint }}>
                      Delete
                    </a>
                  </span>
                </div>
              ))}
              {adminList.length === 0 && (
                <p style={{ margin: 0, padding: "70px 28px", textAlign: "center", fontSize: 13, color: t.faint }}>
                  No inventory yet — add the first piece on the right.
                </p>
              )}
            </div>
          </div>

          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 13, background: t.bar, minHeight: "100%" }}>
            <span style={{ fontSize: 9.5, letterSpacing: "0.28em", textTransform: "uppercase", color: t.faint }}>Add a piece</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setForm((s) => ({ ...s, photoFile: f, photoPreview: URL.createObjectURL(f) }));
              }}
              style={{ fontSize: 12, color: t.soft }}
            />
            {form.photoPreview && (
              <span style={{ display: "block", width: "100%", aspectRatio: "1/1", border: `1px solid ${t.line}`, overflow: "hidden", background: t.card }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.photoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </span>
            )}
            <input type="text" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} placeholder="Title" style={adminInput} />
            <select value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} style={adminInput}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input type="text" value={form.sku} onChange={(e) => setForm((s) => ({ ...s, sku: e.target.value }))} placeholder="Uttermost SKU (optional)" style={adminInput} />
            <textarea rows={4} value={form.note} onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))} placeholder="Dimensions, finish, notes" style={{ ...adminInput, resize: "vertical" }} />
            <button onClick={publish} style={{ border: 0, background: t.ink, color: t.bar, padding: 15, fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer" }}>
              Add to catalogue
            </button>
            {published && <span style={{ fontSize: 12, color: t.soft }}>Added.</span>}
          </div>
        </main>
      )}

      <footer
        style={{
          borderTop: `1px solid ${t.line}`,
          padding: rowPad,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          fontSize: 10.5,
          letterSpacing: "0.06em",
          color: t.faint,
          background: t.bar,
        }}
      >
        <span>{config.shopName} · Inventory catalogue</span>
        <a href={FB} target="_blank" rel="noopener noreferrer" style={{ letterSpacing: "0.18em", textTransform: "uppercase", fontSize: 9.5, color: "inherit" }}>
          Message on Facebook
        </a>
      </footer>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${t.line}`, fontSize: 13 }}>
      <span style={{ color: t.faint }}>{label}</span>
      <span>{value}</span>
    </span>
  );
}

const adminInput: React.CSSProperties = {
  border: `1px solid ${t.line}`,
  background: t.card,
  color: t.ink,
  padding: "11px 12px",
  outline: "none",
};
