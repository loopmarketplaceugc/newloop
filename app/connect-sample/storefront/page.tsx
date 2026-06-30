"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const s = {
  page: { minHeight: "100vh", background: "#f6f4ef", color: "#101805", fontFamily: "system-ui, sans-serif", padding: 24 } as const,
  wrap: { maxWidth: 860, margin: "0 auto" } as const,
  h1: { fontSize: 30, fontWeight: 800, margin: "4px 0 2px" } as const,
  sub: { color: "#5b6150", margin: "0 0 20px", fontSize: 14 } as const,
  h2: { fontSize: 16, fontWeight: 800, margin: "20px 0 12px" } as const,
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 } as const,
  card: { background: "#fff", border: "1px solid #ded8cb", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column" as const, gap: 6 },
  name: { fontWeight: 800, fontSize: 16 } as const,
  desc: { color: "#5b6150", fontSize: 13, flex: 1 } as const,
  price: { fontWeight: 800, fontSize: 18 } as const,
  acct: { fontFamily: "monospace", fontSize: 11, color: "#9a9482" } as const,
  btn: { background: "#101805", color: "#a8d98a", border: "none", borderRadius: 999, padding: "9px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 6 } as const,
  acctRow: { background: "#fff", border: "1px solid #ded8cb", borderRadius: 12, padding: "10px 14px", marginBottom: 8, fontSize: 13 } as const,
  err: { color: "#b42318", fontSize: 13, fontWeight: 600 } as const,
};

interface Product {
  id: string; name: string; description: string | null;
  connectedAccountId: string | null; unitAmount: number | null; currency: string;
}
interface Account { id: string; display_name: string | null }

export default function ConnectSampleStorefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [pRes, aRes] = await Promise.all([
          fetch("/api/connect-sample/products"),
          fetch("/api/connect-sample/accounts"),
        ]);
        const pData = await pRes.json();
        const aData = await aRes.json();
        if (!pRes.ok) throw new Error(pData.error ?? "Could not load products.");
        setProducts(pData.products ?? []);
        setAccounts(aData.accounts ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    })();
  }, []);

  const buy = async (productId: string) => {
    setBuying(productId);
    setError(null);
    try {
      const res = await fetch("/api/connect-sample/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const d = await res.json();
      if (!res.ok || !d.url) throw new Error(d.error ?? "Could not start checkout.");
      window.location.assign(d.url); // Stripe-hosted checkout
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setBuying(null);
    }
  };

  const fmt = (cents: number | null, currency: string) =>
    cents == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <h1 style={s.h1}>Storefront</h1>
        <p style={s.sub}>Buy from any seller — payment routes to their account via a destination charge. <Link href="/connect-sample" style={{ color: "#d6409f", fontWeight: 700 }}>← Seller dashboard</Link></p>

        {error && <p style={s.err}>↳ {error}</p>}

        <h2 style={s.h2}>Products</h2>
        {products.length === 0 ? (
          <p style={s.sub}>No products yet — create one on the seller dashboard.</p>
        ) : (
          <div style={s.grid}>
            {products.map((p) => (
              <div key={p.id} style={s.card}>
                <div style={s.name}>{p.name}</div>
                <div style={s.desc}>{p.description ?? ""}</div>
                <div style={s.price}>{fmt(p.unitAmount, p.currency)}</div>
                <div style={s.acct}>seller: {p.connectedAccountId ?? "—"}</div>
                <button
                  style={{ ...s.btn, opacity: p.connectedAccountId ? 1 : 0.5 }}
                  onClick={() => void buy(p.id)}
                  disabled={!p.connectedAccountId || buying === p.id}
                >
                  {buying === p.id ? "Redirecting…" : "Buy"}
                </button>
              </div>
            ))}
          </div>
        )}

        <h2 style={s.h2}>Connected accounts</h2>
        {accounts.length === 0 ? (
          <p style={s.sub}>No connected accounts yet.</p>
        ) : (
          accounts.map((a) => (
            <div key={a.id} style={s.acctRow}>
              <strong>{a.display_name ?? "(no name)"}</strong> · <span style={{ fontFamily: "monospace", color: "#9a9482" }}>{a.id}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
