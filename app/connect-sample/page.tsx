"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

// ── Tiny inline style kit (clean, simple, self-contained) ────────────────────
const s = {
  page: { minHeight: "100vh", background: "#f6f4ef", color: "#101805", fontFamily: "system-ui, sans-serif", padding: 24 } as const,
  wrap: { maxWidth: 720, margin: "0 auto" } as const,
  h1: { fontSize: 30, fontWeight: 800, margin: "4px 0 2px" } as const,
  sub: { color: "#5b6150", margin: "0 0 20px", fontSize: 14 } as const,
  card: { background: "#fff", border: "1px solid #ded8cb", borderRadius: 16, padding: 20, marginBottom: 16 } as const,
  h2: { fontSize: 16, fontWeight: 800, margin: "0 0 12px" } as const,
  label: { display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: ".05em", color: "#737b68", marginBottom: 4 },
  input: { width: "100%", boxSizing: "border-box" as const, padding: "10px 12px", border: "1px solid #ccc4b4", borderRadius: 10, fontSize: 14, marginBottom: 12 },
  btn: { background: "#101805", color: "#a8d98a", border: "none", borderRadius: 999, padding: "10px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer" } as const,
  btnAlt: { background: "#a8d98a", color: "#101805", border: "none", borderRadius: 999, padding: "10px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer" } as const,
  pill: (ok: boolean) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: ok ? "#a8d98a" : "#eee3cf", color: "#101805" }),
  err: { color: "#b42318", fontSize: 13, fontWeight: 600, marginTop: 8 } as const,
  mono: { fontFamily: "monospace", fontSize: 13 } as const,
};

interface Status {
  readyToReceivePayments: boolean;
  onboardingComplete: boolean;
  requirementsStatus: string | null;
}

export default function ConnectSampleSeller() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Product form
  const [pName, setPName] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [productMsg, setProductMsg] = useState<string | null>(null);

  const refreshStatus = useCallback(async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/connect-sample/accounts?id=${encodeURIComponent(id)}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Could not load status.");
      setStatus({
        readyToReceivePayments: d.readyToReceivePayments,
        onboardingComplete: d.onboardingComplete,
        requirementsStatus: d.requirementsStatus,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }, []);

  // On load: prefer ?accountId from Stripe's return_url, else localStorage.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("accountId");
    const id = fromUrl || localStorage.getItem("connectSampleAccountId");
    if (id) {
      localStorage.setItem("connectSampleAccountId", id);
      setAccountId(id);
    }
  }, []);

  // Whenever we have an account, fetch its live status from the API.
  useEffect(() => {
    if (accountId) void refreshStatus(accountId);
  }, [accountId, refreshStatus]);

  const createAccount = async () => {
    setBusy("create");
    setError(null);
    try {
      const res = await fetch("/api/connect-sample/accounts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName, contactEmail }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Could not create account.");
      const id = d.account.id as string;
      localStorage.setItem("connectSampleAccountId", id);
      setAccountId(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  const onboard = async () => {
    if (!accountId) return;
    setBusy("onboard");
    setError(null);
    try {
      const res = await fetch("/api/connect-sample/account-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      const d = await res.json();
      if (!res.ok || !d.url) throw new Error(d.error ?? "Could not start onboarding.");
      window.location.assign(d.url); // Stripe-hosted onboarding
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setBusy(null);
    }
  };

  const createProduct = async () => {
    if (!accountId) return;
    setBusy("product");
    setProductMsg(null);
    setError(null);
    try {
      const priceInCents = Math.round(parseFloat(pPrice) * 100);
      const res = await fetch("/api/connect-sample/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: pName, description: pDesc, priceInCents, connectedAccountId: accountId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Could not create product.");
      setProductMsg(`Created "${d.product.name}" ✓`);
      setPName(""); setPDesc(""); setPPrice("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <h1 style={s.h1}>Connect sample — Seller</h1>
        <p style={s.sub}>Onboard to Stripe, then list products. <Link href="/connect-sample/storefront" style={{ color: "#d6409f", fontWeight: 700 }}>Go to the storefront →</Link></p>

        {/* 1. Create / connect account */}
        <div style={s.card}>
          <h2 style={s.h2}>1. Your connected account</h2>
          {accountId ? (
            <p style={s.mono}>{accountId}</p>
          ) : (
            <>
              <label style={s.label}>Display name</label>
              <input style={s.input} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Mia's Studio" />
              <label style={s.label}>Contact email</label>
              <input style={s.input} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="mia@example.com" />
              <button style={s.btn} onClick={() => void createAccount()} disabled={busy === "create" || !displayName || !contactEmail}>
                {busy === "create" ? "Creating…" : "Create connected account"}
              </button>
            </>
          )}
        </div>

        {/* 2. Onboarding + status */}
        {accountId && (
          <div style={s.card}>
            <h2 style={s.h2}>2. Onboarding status</h2>
            <p style={{ margin: "0 0 10px" }}>
              <span style={s.pill(!!status?.onboardingComplete)}>{status?.onboardingComplete ? "Onboarding complete" : "Onboarding incomplete"}</span>{" "}
              <span style={s.pill(!!status?.readyToReceivePayments)}>{status?.readyToReceivePayments ? "Ready to receive payments" : "Not ready yet"}</span>
            </p>
            {status?.requirementsStatus && <p style={s.sub}>Requirements status: <strong>{status.requirementsStatus}</strong></p>}
            <button style={s.btnAlt} onClick={() => void onboard()} disabled={busy === "onboard"}>
              {busy === "onboard" ? "Opening…" : "Onboard to collect payments"}
            </button>{" "}
            <button style={s.btn} onClick={() => void refreshStatus(accountId)}>Refresh status</button>
          </div>
        )}

        {/* 3. Create product */}
        {accountId && (
          <div style={s.card}>
            <h2 style={s.h2}>3. Create a product</h2>
            <label style={s.label}>Name</label>
            <input style={s.input} value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Vintage tee" />
            <label style={s.label}>Description</label>
            <input style={s.input} value={pDesc} onChange={(e) => setPDesc(e.target.value)} placeholder="Soft cotton, hand-printed" />
            <label style={s.label}>Price (USD)</label>
            <input style={s.input} inputMode="decimal" value={pPrice} onChange={(e) => setPPrice(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="25.00" />
            <button style={s.btn} onClick={() => void createProduct()} disabled={busy === "product" || !pName || !pPrice}>
              {busy === "product" ? "Creating…" : "Create product"}
            </button>
            {productMsg && <p style={{ ...s.sub, color: "#3e7b5e", marginTop: 10 }}>{productMsg}</p>}
          </div>
        )}

        {error && <p style={s.err}>↳ {error}</p>}
      </div>
    </div>
  );
}
