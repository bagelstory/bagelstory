"use client";
// =============================================================
// Écran cuisine (iPad) :
// - connexion staff (Supabase Auth, email + mot de passe)
// - commandes du jour en temps réel (Realtime)
// - bip à chaque nouvelle commande (après "Activer le son")
// - écran maintenu allumé (Wake Lock) quand c'est possible
// =============================================================
import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getBrowserClient } from "@/lib/supabase/browser";
import { formatPrice } from "@/lib/pricing";
import type { OrderRow, OrderStatus } from "@/lib/types";

const STATUS_LABEL: Record<OrderStatus, string> = {
  nouvelle: "Nouvelle",
  en_preparation: "En préparation",
  prete: "Servie / Prête",
  annulee: "Annulée",
};
const STATUS_STYLE: Record<OrderStatus, string> = {
  nouvelle: "border-l-brand",
  en_preparation: "border-l-yellow-500",
  prete: "border-l-green-600 opacity-70",
  annulee: "border-l-red-600 opacity-40",
};

export function AdminApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // Le client Supabase n'est créé que dans le navigateur (jamais
  // pendant la compilation), pour que le build ne dépende pas des clés.
  useEffect(() => {
    let supabase: ReturnType<typeof getBrowserClient>;
    try {
      supabase = getBrowserClient();
    } catch (e) {
      setConfigError(e instanceof Error ? e.message : "Configuration Supabase invalide.");
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (configError) {
    return (
      <main className="grid min-h-dvh place-items-center bg-ink px-6 text-center text-cream">
        <p className="max-w-md">{configError}</p>
      </main>
    );
  }
  if (!ready) return <div className="min-h-dvh bg-ink" />;
  return session ? <Kitchen /> : <Login />;
}

// ---------------------------------------------------------------
function Login() {
  const supabase = getBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("Email ou mot de passe incorrect.");
    setLoading(false);
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-ink px-6 text-cream">
      <form onSubmit={submit} className="grid w-full max-w-sm gap-4">
        <h1 className="font-display text-4xl">
          CUISINE <span className="text-brand">BAGEL STORY</span>
        </h1>
        <input
          id="email" type="email" required autoComplete="username" placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-xl bg-cream/10 px-4 text-cream placeholder:text-cream/40"
        />
        <input
          id="password" type="password" required autoComplete="current-password" placeholder="Mot de passe"
          value={password} onChange={(e) => setPassword(e.target.value)}
          className="h-12 rounded-xl bg-cream/10 px-4 text-cream placeholder:text-cream/40"
        />
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button disabled={loading} className="h-12 rounded-full bg-brand font-bold text-ink disabled:opacity-50">
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}

// ---------------------------------------------------------------
function Kitchen() {
  const supabase = getBrowserClient();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [soundOn, setSoundOn] = useState(false);
  const [live, setLive] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const audioCtx = useRef<AudioContext | null>(null);
  const soundRef = useRef(false);

  // Bip court, généré (pas de fichier audio à héberger).
  const beep = useCallback(() => {
    const ctx = audioCtx.current;
    if (!ctx || !soundRef.current) return;
    [0, 0.25, 0.5].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const at = ctx.currentTime + t;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.5, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
      osc.start(at);
      osc.stop(at + 0.21);
    });
  }, []);

  // iPad : le son ne peut démarrer qu'après un appui de l'utilisateur.
  const enableSound = async () => {
    audioCtx.current ??= new (window.AudioContext || (window as any).webkitAudioContext)();
    await audioCtx.current.resume();
    soundRef.current = true;
    setSoundOn(true);
    beep();
    try {
      await (navigator as any).wakeLock?.request("screen"); // garde l'écran allumé
    } catch {}
  };

  // Chargement des commandes du jour
  const load = useCallback(async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", start.toISOString())
      .order("created_at", { ascending: false });
    if (data) setOrders(data as OrderRow[]);
  }, [supabase]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("orders-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        const row = payload.new as OrderRow;
        setOrders((prev) => (prev.some((o) => o.id === row.id) ? prev : [row, ...prev]));
        beep();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        const row = payload.new as OrderRow;
        setOrders((prev) => prev.map((o) => (o.id === row.id ? row : o)));
      })
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") load(); // rattrape ce qui a pu arriver pendant une coupure
      });

    // Wi-Fi coupé / iPad en veille : on recharge au retour.
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [supabase, load, beep]);

  const setStatus = async (id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o))); // affichage immédiat
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) load(); // en cas d'échec, on revient à l'état réel
  };

  const active = orders.filter((o) => o.status === "nouvelle" || o.status === "en_preparation");
  const visible = showDone ? orders : active;

  return (
    <div className="min-h-dvh bg-[#EDE3D3]">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 bg-ink px-5 py-4 text-cream">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl">CUISINE</h1>
          <span className="rounded-full bg-brand px-3 py-1 text-sm font-bold text-ink">{active.length} en cours</span>
          <span className={`flex items-center gap-1.5 text-sm ${live ? "text-green-400" : "text-red-300"}`}>
            <span className={`size-2.5 rounded-full ${live ? "bg-green-400" : "bg-red-400"}`} />
            {live ? "En direct" : "Reconnexion…"}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDone((v) => !v)}
            className="rounded-full bg-cream/10 px-4 py-2 text-sm font-bold"
          >
            {showDone ? "Masquer terminées" : "Afficher tout"}
          </button>
          <button
            onClick={enableSound}
            className={`rounded-full px-4 py-2 text-sm font-bold ${soundOn ? "bg-green-600 text-white" : "bg-brand text-ink animate-pulse"}`}
          >
            {soundOn ? "Son activé" : "Activer le son"}
          </button>
          <button onClick={() => supabase.auth.signOut()} className="rounded-full bg-cream/10 px-4 py-2 text-sm">
            Déconnexion
          </button>
        </div>
      </header>

      <main className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.length === 0 && (
          <p className="col-span-full py-20 text-center text-ink/50">Aucune commande en cours.</p>
        )}
        {visible.map((o) => (
          <article key={o.id} className={`overflow-hidden rounded-2xl border-l-[10px] bg-white shadow-sm ${STATUS_STYLE[o.status]}`}>
            <div className="flex items-start justify-between px-4 pt-4">
              <div>
                <p className="font-display text-3xl leading-none">
                  {o.type === "sur_place" ? `Table ${o.table_number}` : "À emporter"}
                </p>
                <span className="mt-2 inline-block rounded-full bg-ink/10 px-2.5 py-0.5 text-xs font-bold uppercase">
                  {STATUS_LABEL[o.status]}
                </span>
              </div>
              <div className="text-right text-sm text-ink/60">
                <p className="font-bold text-ink">#{o.order_number}</p>
                <p>{new Date(o.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                <p className="font-bold tabular-nums text-ink">{formatPrice(o.total_cents)}</p>
              </div>
            </div>
            <ul className="grid gap-1.5 px-4 py-3 text-lg">
              {o.items.map((i, idx) => (
                <li key={idx}>
                  <strong>{i.quantity}×</strong> {i.name}
                  {i.options.map((opt) => (
                    <p key={opt} className="pl-7 text-sm text-ink/60">{opt}</p>
                  ))}
                  {i.note && <p className="pl-7 text-sm italic">« {i.note} »</p>}
                </li>
              ))}
            </ul>
            {o.customer_note && (
              <p className="mx-4 mb-3 rounded-lg bg-yellow-100 px-3 py-2 text-sm">{o.customer_note}</p>
            )}
            <div className="grid grid-cols-3 gap-2 px-3 pb-3">
              <button onClick={() => setStatus(o.id, "en_preparation")} className="rounded-xl bg-yellow-300 py-3 text-sm font-bold">
                En préparation
              </button>
              <button onClick={() => setStatus(o.id, "prete")} className="rounded-xl bg-green-300 py-3 text-sm font-bold">
                Servie / Prête
              </button>
              <button onClick={() => setStatus(o.id, "annulee")} className="rounded-xl bg-ink/10 py-3 text-sm font-bold">
                Annuler
              </button>
            </div>
          </article>
        ))}
      </main>
    </div>
  );
}
