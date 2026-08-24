import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { createContext, useContext, useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
// NOTE: the lucide `Home` icon and the "Home" page below would collide, so the
// icon is aliased to HomeIcon.
import {
  Home as HomeIcon,
  Compass,
  ScrollText,
  User,
  Shield,
  CreditCard,
  Zap,
  Star,
  MapPin,
  Check,
  ArrowLeft,
} from "lucide-react";

// ── Stripe (demo) ────────────────────────────────────────────────────────────
// A real upgrade needs a backend to create a Stripe Checkout Session, then
// `stripe.redirectToCheckout({ sessionId })`. Without a key + backend we run a
// clearly-labeled demo flow. Set VITE_STRIPE_PUBLISHABLE_KEY to wire real Stripe.
const STRIPE_CONFIGURED = Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
// Only call loadStripe with a real key — loadStripe("") throws an IntegrationError.
const stripePromise = STRIPE_CONFIGURED
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;
const FREE_SIGNALS = 3;

const mockProfiles = [
  { id: 1, name: "Alex Chen", level: "Level 7 Tabletop GM", tags: "D&D • board games", dist: "0.8 mi" },
  { id: 2, name: "Jordan Reyes", level: "Level 5 Pixel Artist", tags: "RPGs • indie games", dist: "1.2 mi" },
  { id: 3, name: "Taylor Quinn", level: "Level 6 Cosplayer", tags: "fantasy • comics", dist: "1.7 mi" },
  { id: 4, name: "Morgan Vale", level: "Level 8 Tech Tinkerer", tags: "electronics • VR", dist: "2.3 mi" },
];

const mockEvents = [
  { id: 1, title: "Board Game Café", time: "Tonight 7:00 PM", rating: 4.9, spots: "3-8 players" },
  { id: 2, title: "Arcade Night", time: "Tonight 7:00 PM", rating: 4.8, spots: "All levels" },
  { id: 3, title: "Library Study & Snack", time: "Tomorrow 3:00 PM", rating: 4.7, spots: "Quiet vibes" },
];

// ── Premium state = the payment gate (persisted so it survives nav + reload) ──
const PremiumContext = createContext(null);

function PremiumProvider({ children }) {
  const [premium, setPremiumState] = useState(() => localStorage.getItem("sq_premium") === "1");
  const [signalsLeft, setSignalsLeft] = useState(() => {
    const v = localStorage.getItem("sq_signals");
    return v === null ? FREE_SIGNALS : Number(v);
  });
  const [sentQuests, setSentQuests] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sq_sent") || "[]"); } catch { return []; }
  });

  useEffect(() => { localStorage.setItem("sq_premium", premium ? "1" : "0"); }, [premium]);
  useEffect(() => { localStorage.setItem("sq_signals", String(signalsLeft)); }, [signalsLeft]);
  useEffect(() => { localStorage.setItem("sq_sent", JSON.stringify(sentQuests)); }, [sentQuests]);

  const setPremium = (v) => setPremiumState(v);
  const spendSignal = () => setSignalsLeft((s) => Math.max(0, s - 1));
  const addSent = (name) =>
    setSentQuests((q) => [{ name, at: new Date().toISOString(), status: "pending" }, ...q]);
  const reset = () => { setPremiumState(false); setSignalsLeft(FREE_SIGNALS); setSentQuests([]); };

  return (
    <PremiumContext.Provider
      value={{ premium, setPremium, signalsLeft, spendSignal, sentQuests, addSent, reset }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

const usePremium = () => useContext(PremiumContext);

// ── Small toast ───────────────────────────────────────────────────────────────
function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [message, onDone]);
  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[60] bg-purple/90 text-white text-sm px-4 py-2 rounded-full shadow-lg max-w-[90vw] text-center"
    >
      {message}
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Navbar() {
  const { pathname } = useLocation();
  const tabs = [
    { to: "/", label: "Signals", Icon: HomeIcon },
    { to: "/nest", label: "Nest", Icon: Compass },
    { to: "/log", label: "Quest Log", Icon: ScrollText },
    { to: "/profile", label: "Profile", Icon: User },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-navy/95 backdrop-blur border-t border-cyan/20 flex justify-around py-3 z-50">
      {tabs.map(({ to, label, Icon }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center gap-1 transition ${active ? "text-cyan" : "text-gray-400 hover:text-gray-200"}`}
          >
            <Icon size={22} />
            <span className="text-xs">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function PageHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple to-cyan bg-clip-text text-transparent">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

// ── Signals (home) ────────────────────────────────────────────────────────────
function Signals() {
  const { premium, signalsLeft, spendSignal, addSent } = usePremium();
  const navigate = useNavigate();
  const [toast, setToast] = useState("");

  const handleSideQuest = (name) => {
    if (!premium && signalsLeft <= 0) {
      navigate("/upgrade");
      return;
    }
    if (!premium) spendSignal();
    addSent(name);
    setToast(`SideQuest sent to ${name} — waiting for mutual unlock…`);
  };

  return (
    <div className="p-4 pb-28 max-w-md mx-auto">
      <PageHeader
        title="SideQuest"
        subtitle="Nearby players ready to team up"
        right={
          premium ? (
            <span className="text-xs font-semibold text-navy bg-cyan px-2.5 py-1 rounded-full">PREMIUM</span>
          ) : (
            <span className="text-sm text-cyan font-medium">{signalsLeft} free left</span>
          )
        }
      />

      {mockProfiles.map((p) => (
        <div
          key={p.id}
          className="bg-navy/60 border border-cyan/20 rounded-2xl p-4 mb-4 flex items-center justify-between"
        >
          <div>
            <h3 className="font-semibold">{p.name}</h3>
            <p className="text-sm text-cyan">{p.level}</p>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              {p.tags} • <MapPin size={12} /> {p.dist}
            </p>
          </div>
          <button
            onClick={() => handleSideQuest(p.name)}
            className="bg-purple hover:bg-purple/80 active:scale-95 text-white px-4 py-2 rounded-full text-sm font-medium transition"
          >
            SideQuest
          </button>
        </div>
      ))}

      {!premium && (
        <button
          onClick={() => navigate("/upgrade")}
          className="w-full mt-2 border border-purple/40 text-purple hover:bg-purple/10 rounded-2xl py-3 text-sm font-medium transition flex items-center justify-center gap-2"
        >
          <Zap size={16} /> Go Premium for unlimited SideQuests
        </button>
      )}

      <Toast message={toast} onDone={() => setToast("")} />
    </div>
  );
}

// ── Nest ──────────────────────────────────────────────────────────────────────
function Nest() {
  return (
    <div className="p-4 pb-28 max-w-md mx-auto">
      <PageHeader title="Nest Events" subtitle="Safe, controlled group meetups" />
      {mockEvents.map((e) => (
        <div key={e.id} className="bg-navy/60 border border-cyan/20 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{e.title}</h3>
            <span className="text-xs text-cyan flex items-center gap-1">
              <Star size={13} /> {e.rating}
            </span>
          </div>
          <p className="text-sm text-gray-300 mt-1">{e.time}</p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Shield size={13} className="text-cyan" /> {e.spots}
            </span>
            <button className="bg-cyan/10 text-cyan border border-cyan/30 hover:bg-cyan/20 px-3 py-1.5 rounded-full text-xs font-medium transition">
              Join
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Quest Log ─────────────────────────────────────────────────────────────────
function Log() {
  const { sentQuests } = usePremium();
  return (
    <div className="p-4 pb-28 max-w-md mx-auto">
      <PageHeader title="Quest Log" subtitle="SideQuests you've sent" />
      {sentQuests.length === 0 ? (
        <div className="bg-navy/60 border border-cyan/20 rounded-2xl p-8 text-center text-gray-400">
          <ScrollText className="mx-auto mb-3 text-cyan" size={28} />
          <p className="text-sm">No quests yet. Send a SideQuest from the Signals tab.</p>
        </div>
      ) : (
        sentQuests.map((q, i) => (
          <div
            key={i}
            className="bg-navy/60 border border-cyan/20 rounded-2xl p-4 mb-3 flex items-center justify-between"
          >
            <div>
              <h3 className="font-semibold">{q.name}</h3>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(q.at).toLocaleString()}
              </p>
            </div>
            <span className="text-xs text-purple border border-purple/40 rounded-full px-3 py-1 capitalize">
              {q.status}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────
function Profile() {
  const { premium, reset } = usePremium();
  const navigate = useNavigate();
  return (
    <div className="p-4 pb-28 max-w-md mx-auto">
      <PageHeader title="Profile" subtitle="Your adventurer" />

      <div className="bg-navy/60 border border-cyan/20 rounded-2xl p-5 mb-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple to-cyan flex items-center justify-center text-xl font-bold">
          Y
        </div>
        <div>
          <h3 className="font-semibold text-lg">You</h3>
          <p className="text-sm text-cyan">Level 4 Adventurer</p>
          <p className="text-xs text-gray-400 mt-1">
            {premium ? "Premium member" : "Free tier"}
          </p>
        </div>
      </div>

      {premium ? (
        <div className="bg-cyan/10 border border-cyan/30 rounded-2xl p-4 flex items-center gap-3">
          <Check className="text-cyan" size={20} />
          <p className="text-sm">Premium active — unlimited SideQuests unlocked.</p>
        </div>
      ) : (
        <button
          onClick={() => navigate("/upgrade")}
          className="w-full bg-purple hover:bg-purple/80 active:scale-95 text-white rounded-2xl py-3 font-medium transition flex items-center justify-center gap-2"
        >
          <CreditCard size={18} /> Upgrade to Premium
        </button>
      )}

      <button
        onClick={reset}
        className="w-full mt-6 text-xs text-gray-500 hover:text-gray-300 transition"
      >
        Reset demo data
      </button>
    </div>
  );
}

// ── Upgrade (payment gate) ────────────────────────────────────────────────────
function Upgrade() {
  const { premium, setPremium } = usePremium();
  const navigate = useNavigate();
  const [status, setStatus] = useState("idle"); // idle | processing | success | error

  const perks = [
    "Unlimited SideQuests",
    "See who signalled you first",
    "Priority spots at Nest events",
    "Premium adventurer badge",
  ];

  const handleUpgrade = async () => {
    setStatus("processing");
    try {
      // Real flow: POST to your backend to create a Checkout Session, then
      // `const stripe = await stripePromise; stripe.redirectToCheckout({ sessionId })`.
      const stripe = stripePromise ? await stripePromise : null; // null in demo mode
      if (stripe) {
        // Placeholder for real redirect; no backend in this demo shell.
        console.info("Stripe loaded; wire a backend Checkout Session to go live.");
      }
      await new Promise((r) => setTimeout(r, 900)); // simulate network
      setPremium(true);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (premium && status !== "success") {
    return (
      <div className="p-4 pb-28 max-w-md mx-auto">
        <BackLink navigate={navigate} />
        <div className="bg-cyan/10 border border-cyan/30 rounded-2xl p-6 text-center">
          <Check className="mx-auto text-cyan mb-3" size={32} />
          <h2 className="text-xl font-bold">You're already Premium</h2>
          <p className="text-sm text-gray-300 mt-2">Unlimited SideQuests are unlocked.</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="p-4 pb-28 max-w-md mx-auto">
        <div className="bg-cyan/10 border border-cyan/30 rounded-2xl p-6 text-center">
          <Check className="mx-auto text-cyan mb-3" size={36} />
          <h2 className="text-2xl font-bold">Welcome to Premium!</h2>
          <p className="text-sm text-gray-300 mt-2">Unlimited SideQuests are now unlocked.</p>
          <button
            onClick={() => navigate("/")}
            className="mt-5 bg-purple hover:bg-purple/80 text-white rounded-full px-6 py-2.5 font-medium transition"
          >
            Start questing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-28 max-w-md mx-auto">
      <BackLink navigate={navigate} />

      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 text-purple font-semibold mb-2">
          <Zap size={18} /> SideQuest Premium
        </div>
        <div className="text-4xl font-bold">
          $4.99<span className="text-base text-gray-400 font-normal">/mo</span>
        </div>
      </div>

      <div className="bg-navy/60 border border-cyan/20 rounded-2xl p-5 mb-6">
        {perks.map((perk) => (
          <div key={perk} className="flex items-center gap-3 py-2">
            <Check size={18} className="text-cyan shrink-0" />
            <span className="text-sm">{perk}</span>
          </div>
        ))}
      </div>

      {status === "error" && (
        <p className="text-sm text-red-400 mb-3 text-center">
          Something went wrong. Please try again.
        </p>
      )}

      <button
        onClick={handleUpgrade}
        disabled={status === "processing"}
        className="w-full bg-gradient-to-r from-purple to-cyan text-white rounded-2xl py-3.5 font-semibold transition active:scale-[.99] disabled:opacity-60 flex items-center justify-center gap-2"
      >
        <CreditCard size={18} />
        {status === "processing" ? "Processing…" : "Upgrade with Stripe"}
      </button>

      <p className="text-center text-xs text-gray-500 mt-3">
        {STRIPE_CONFIGURED
          ? "Secure checkout via Stripe."
          : "Demo checkout — no card charged. Set VITE_STRIPE_PUBLISHABLE_KEY for live Stripe."}
      </p>
    </div>
  );
}

function BackLink({ navigate }) {
  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-5 transition"
    >
      <ArrowLeft size={16} /> Back
    </button>
  );
}

function NotFound() {
  return (
    <div className="p-4 pb-28 max-w-md mx-auto text-center pt-20">
      <h1 className="text-2xl font-bold mb-2">Lost in the wilds</h1>
      <p className="text-gray-400 mb-6">That page doesn't exist.</p>
      <Link to="/" className="text-cyan underline">
        Back to Signals
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <PremiumProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Signals />} />
          <Route path="/nest" element={<Nest />} />
          <Route path="/log" element={<Log />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/upgrade" element={<Upgrade />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Navbar />
      </Router>
    </PremiumProvider>
  );
}
