import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap,
  Shield,
  MapPin,
  Heart,
  Check,
  ChevronDown,
  Share,
  PlusSquare,
  Sparkles,
  Users,
  Lock,
  ArrowRight,
  Radar,
  Menu,
  X,
  BadgeCheck,
  Tent,
  Eye,
} from "lucide-react";
import { useInstall } from "./useInstall.js";
import { usePageMeta } from "./seo.js";

const APP_SEEN_KEY = "sq_seen_welcome";

function markSeenAndGo(navigate, to = "/") {
  try {
    localStorage.setItem(APP_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
  navigate(to);
}

// ── Install (Add to Home Screen) modal ─────────────────────────────────────────
function InstallModal({ open, onClose, iOS, android, onOpenApp }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Install SideQuest"
    >
      <div
        className="w-full max-w-md bg-navy border border-cyan/25 rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src="/icon-192.png" alt="" width="40" height="40" className="rounded-xl" />
            <div>
              <h3 className="font-bold text-lg leading-tight">Install SideQuest</h3>
              <p className="text-xs text-gray-400">Add it to your home screen — free.</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <ol className="space-y-3 mb-5">
          {iOS ? (
            <>
              <li className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 text-cyan"><Share size={18} /></span>
                <span>Tap the <b>Share</b> button in Safari's toolbar.</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 text-cyan"><PlusSquare size={18} /></span>
                <span>Choose <b>Add to Home Screen</b>, then tap <b>Add</b>.</span>
              </li>
            </>
          ) : android ? (
            <>
              <li className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 text-cyan"><Menu size={18} /></span>
                <span>Open the browser menu (<b>⋮</b>) in Chrome.</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 text-cyan"><PlusSquare size={18} /></span>
                <span>Tap <b>Install app</b> / <b>Add to Home screen</b>.</span>
              </li>
            </>
          ) : (
            <>
              <li className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 text-cyan"><PlusSquare size={18} /></span>
                <span>Click the <b>Install</b> icon in your browser's address bar.</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 text-cyan"><Check size={18} /></span>
                <span>Confirm <b>Install</b> to add SideQuest to your device.</span>
              </li>
            </>
          )}
        </ol>

        <button
          onClick={onOpenApp}
          className="w-full bg-gradient-to-r from-purple to-cyan text-white rounded-2xl py-3 font-semibold transition active:scale-[.99] flex items-center justify-center gap-2"
        >
          Continue in browser <ArrowRight size={18} />
        </button>
        <p className="text-center text-xs text-gray-500 mt-3">
          Works on any device — no app store required.
        </p>
      </div>
    </div>
  );
}

// ── Section heading helper ─────────────────────────────────────────────────────
function Eyebrow({ children }) {
  return (
    <span className="inline-block text-xs font-semibold tracking-widest uppercase text-cyan/90 mb-3">
      {children}
    </span>
  );
}

// ── Top navigation ──────────────────────────────────────────────────────────
function TopNav({ onGetApp, onOpenApp }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const links = [
    { href: "#how", label: "How it works" },
    { href: "#safety", label: "Safety" },
    { href: "#premium", label: "Premium" },
    { href: "#faq", label: "FAQ" },
  ];
  return (
    <header
      className={`fixed top-0 inset-x-0 z-[70] transition-colors ${
        scrolled ? "bg-navy/90 backdrop-blur border-b border-white/10" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center">
          <img src="/wordmark.svg" alt="SideQuest" className="h-7" width="160" height="28" />
        </a>
        <nav className="hidden md:flex items-center gap-7 text-sm text-gray-300">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-white transition">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenApp}
            className="hidden sm:inline text-sm text-gray-300 hover:text-white transition px-3 py-2"
          >
            Open app
          </button>
          <button
            onClick={onGetApp}
            className="bg-gradient-to-r from-purple to-cyan text-white text-sm font-semibold rounded-full px-4 py-2 active:scale-95 transition"
          >
            Get the app
          </button>
        </div>
      </div>
    </header>
  );
}

// ── FAQ item ───────────────────────────────────────────────────────────────
function Faq({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-4 text-left"
        aria-expanded={open}
      >
        <span className="font-medium pr-4">{q}</span>
        <ChevronDown
          size={20}
          className={`shrink-0 text-cyan transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <p className="text-sm text-gray-400 pb-4 -mt-1 leading-relaxed">{a}</p>}
    </div>
  );
}

export default function Welcome() {
  const navigate = useNavigate();
  const { canPrompt, promptInstall, installed, iOS, android } = useInstall();
  const [showInstall, setShowInstall] = useState(false);

  usePageMeta({
    title: "SideQuest — Find your people to game with, in real life",
    description:
      "SideQuest is a find-your-people app for gamers, tabletop players, and nerds to meet nearby people in person. Send a SideQuest — chat unlocks only on a mutual match — and meet up safely at verified Nest events. Free to start, no card.",
    path: "/welcome",
  });

  const openApp = () => markSeenAndGo(navigate, "/");
  const goUpgrade = () => markSeenAndGo(navigate, "/upgrade");

  const getApp = async () => {
    if (installed) {
      openApp();
      return;
    }
    const shown = await promptInstall();
    if (!shown) setShowInstall(true);
  };

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const steps = [
    {
      Icon: Radar,
      title: "Read the Signals",
      body: "See nearby players, students, and creators who are open to team up right now — sorted by distance and shared interests.",
    },
    {
      Icon: Zap,
      title: "Send a SideQuest",
      body: "Spotted someone on your wavelength? Fire off a SideQuest. It's a low-pressure ping that says \"let's actually hang.\"",
    },
    {
      Icon: Heart,
      title: "Mutual SideQuest Unlocked",
      body: "When they SideQuest you back, the match unlocks and chat opens. No one-sided DMs — only people who chose you back.",
    },
  ];

  const safety = [
    {
      Icon: Shield,
      title: "Verified Nest hosts",
      body: "Nest meetups are hosted by verified members in public, controlled venues — arcades, cafés, libraries — never a stranger's living room.",
    },
    {
      Icon: Users,
      title: "Group-first meetups",
      body: "Meet people for the first time in a group setting at a Nest, not a solo blind date. Safety in numbers, by design.",
    },
    {
      Icon: Lock,
      title: "Mutual-only unlocks",
      body: "Chat only opens when both people SideQuest each other. No unwanted DMs, no cold-open messages.",
    },
  ];

  const proofPoints = [
    "Mutual-match only — chat opens when both people opt in, so no one-sided DMs",
    "First meetups happen at verified Nest events in public venues, never solo",
    "Free to try — 3 SideQuests with no credit card; Premium is a founder rate of $2.49/mo (standard $4.99) you can cancel anytime",
    "Built by an independent maker and funded by a simple subscription — not ads. What you see is what you get",
  ];

  const faqs = [
    {
      q: "Who is SideQuest for?",
      a: "Anyone who'd rather find their people in person than scroll alone — gamers, tabletop and board-game players, TTRPG groups, cosplayers, students, and nerds of every stripe looking for others nearby to actually hang out with.",
    },
    {
      q: "How much does SideQuest cost?",
      a: "SideQuest is free to start with 3 SideQuests and no credit card. Premium is currently a founder / launch rate of $2.49/mo (standard $4.99/mo) and gives you a verified badge, the ability to host your own Nest meetups, seeing who SideQuested you first, plus priority and unlimited SideQuests. Cancel anytime.",
    },
    {
      q: "Is SideQuest a dating app?",
      a: "It's a \"find your people\" app. Plenty of people use it to find gaming and study partners and friends. It's about mutual, opt-in connections — whatever kind you're looking for.",
    },
    {
      q: "How do you keep meetups safe?",
      a: "First meetups happen at Nest events: group gatherings hosted by verified members in public venues. Chat only unlocks on a mutual match, so there are no one-sided DMs.",
    },
    {
      q: "Do I need to download from an app store?",
      a: "No. SideQuest installs straight from your browser as an app — tap \"Get the app\" and add it to your home screen on iOS or Android.",
    },
    {
      q: "What's a \"Nest\"?",
      a: "A Nest is a safe, verified group meetup — think board-game café nights, arcade meetups, or library study sessions — where you meet your matches in person for the first time.",
    },
    {
      q: "Who's behind SideQuest?",
      a: "SideQuest is built by an independent maker, funded by a simple subscription rather than ads. We're new and honest about it — no inflated user counts, no fake reviews. The proof is in how the app is built to keep meetups mutual and safe.",
    },
  ];

  return (
    <div id="top" className="min-h-screen bg-navy text-white overflow-x-hidden">
      <TopNav onGetApp={getApp} onOpenApp={openApp} />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative pt-28 sm:pt-32 pb-16 sm:pb-20">
        {/* glow backdrop */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-purple/25 blur-[120px]" />
          <div className="absolute top-10 right-0 w-96 h-96 rounded-full bg-cyan/20 blur-[120px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          <div className="text-center lg:text-left">
            {/* WHO IT'S FOR — a concrete audience, right up top */}
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-medium text-cyan mb-5">
              <Sparkles size={14} /> For gamers, tabletop players &amp; nerds
            </span>

            {/* WHAT IT IS — one clear line, no jargon */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Find your people to
              <br />
              <span className="bg-gradient-to-r from-purple to-cyan bg-clip-text text-transparent">
                game with — in real life.
              </span>
            </h1>
            <p className="mt-5 text-lg text-gray-300 max-w-xl mx-auto lg:mx-0">
              SideQuest is a find‑your‑people app that helps you meet nearby gamers, tabletop
              players, and nerds in person. Send someone a SideQuest — chat only unlocks when
              they send one back.
            </p>

            {/* WHAT CHANGES — the before → after, at a glance */}
            <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 text-sm">
              <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-gray-400 line-through decoration-gray-600">
                Scrolling alone tonight
              </span>
              <ArrowRight size={16} className="text-cyan shrink-0" />
              <span className="rounded-full bg-cyan/10 border border-cyan/30 px-3 py-1.5 text-cyan font-medium">
                A real table of people nearby
              </span>
            </div>

            {/* WHAT TO DO NEXT — one obvious primary action */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <button
                onClick={getApp}
                className="bg-gradient-to-r from-purple to-cyan text-white font-semibold rounded-full px-7 py-3.5 text-base active:scale-95 transition shadow-lg shadow-purple/20 flex items-center justify-center gap-2"
              >
                <Zap size={18} /> Get the app — free
              </button>
              <button
                onClick={scrollTo("how")}
                className="border border-white/20 hover:border-white/40 text-white font-medium rounded-full px-7 py-3.5 text-base transition flex items-center justify-center gap-2"
              >
                See how it works
              </button>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-sm text-gray-400">
              <span className="flex items-center gap-1.5"><Check size={15} className="text-cyan" /> Free to start · 3 SideQuests, no card</span>
              <span className="flex items-center gap-1.5"><Check size={15} className="text-cyan" /> Mutual match only</span>
              <span className="flex items-center gap-1.5"><Check size={15} className="text-cyan" /> Verified Nest meetups</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-purple/30 to-cyan/30 blur-2xl rounded-[2rem]" aria-hidden />
            <img
              src="/marketing/sq_hero.webp"
              alt="Friends laughing together around a board-game table, lit by neon light."
              width="1400"
              height="933"
              className="relative w-full rounded-[1.75rem] border border-white/10 shadow-2xl"
              fetchpriority="high"
            />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section id="how" className="py-16 sm:py-24 border-t border-white/5 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <Eyebrow>How it works</Eyebrow>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                From Signal to a real{" "}
                <span className="bg-gradient-to-r from-purple to-cyan bg-clip-text text-transparent">
                  face-to-face
                </span>
              </h2>
              <p className="mt-3 text-gray-400 max-w-lg">
                No endless swiping. Three simple steps take you from "who's around?" to "we're
                actually hanging out."
              </p>

              <div className="mt-8 space-y-6">
                {steps.map((s, i) => (
                  <div key={s.title} className="flex gap-4">
                    <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-purple to-cyan flex items-center justify-center font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <s.Icon size={16} className="text-cyan" /> {s.title}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1 leading-relaxed">{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-1 lg:order-2 relative">
              <div className="absolute inset-8 bg-cyan/20 blur-3xl rounded-full" aria-hidden />
              <img
                src="/marketing/sq_brand_motif.webp"
                alt="SideQuest motif: a neon pixel heart holding a location pin."
                width="800"
                height="800"
                loading="lazy"
                className="relative w-full max-w-md mx-auto rounded-3xl"
              />
              <p className="relative text-center text-sm text-gray-500 mt-3">
                A SideQuest = a little heart, a real place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SAFETY / TRUST ───────────────────────────────────── */}
      <section id="safety" className="py-16 sm:py-24 bg-white/[0.02] border-y border-white/5 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl">
            <Eyebrow>Safety first</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Built so meeting new people feels{" "}
              <span className="bg-gradient-to-r from-purple to-cyan bg-clip-text text-transparent">
                safe, not scary
              </span>
            </h2>
            <p className="mt-3 text-gray-400">
              Meeting someone new shouldn't feel risky. SideQuest is designed around that worry —
              here's exactly how it's built to keep first meetups safe.
            </p>
          </div>

          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {safety.map((s) => (
              <div
                key={s.title}
                className="bg-navy/60 border border-cyan/15 rounded-2xl p-6 hover:border-cyan/40 transition"
              >
                <div className="w-11 h-11 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center mb-4">
                  <s.Icon size={20} className="text-cyan" />
                </div>
                <h3 className="font-semibold text-lg">{s.title}</h3>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-start gap-3 text-sm text-gray-400 bg-navy/60 border border-white/10 rounded-2xl p-5">
            <Shield size={18} className="text-cyan shrink-0 mt-0.5" />
            <p>
              Every member agrees to our community guidelines: be real, be respectful, keep first
              meetups at a Nest. Reports are reviewed, and hosts keep events welcoming for everyone.
            </p>
          </div>
        </div>
      </section>

      {/* ── COMMUNITY PROOF ──────────────────────────────────── */}
      <section className="py-16 sm:py-24 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-purple/25 to-cyan/25 blur-2xl rounded-[2rem]" aria-hidden />
            <img
              src="/marketing/sq_community.webp"
              alt="Two people high-fiving at an arcade café, friends smiling around them."
              width="1200"
              height="800"
              loading="lazy"
              className="relative w-full rounded-[1.75rem] border border-white/10 shadow-2xl"
            />
          </div>
          <div>
            <Eyebrow>Why you can trust it</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              No hype — just how{" "}
              <span className="bg-gradient-to-r from-purple to-cyan bg-clip-text text-transparent">
                it actually works
              </span>
            </h2>
            <p className="mt-3 text-gray-400 max-w-lg">
              We're new, so we won't throw fake numbers at you. Here's the honest case for
              SideQuest — the way it's built to earn your trust.
            </p>
            <ul className="mt-6 space-y-3">
              {proofPoints.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <Check size={18} className="text-cyan shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-300">{p}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={getApp}
              className="mt-8 bg-gradient-to-r from-purple to-cyan text-white font-semibold rounded-full px-7 py-3.5 active:scale-95 transition flex items-center gap-2"
            >
              <Zap size={18} /> Get the app
            </button>
          </div>
        </div>
      </section>

      {/* ── PREMIUM / PRICING ────────────────────────────────── */}
      <section id="premium" className="py-16 sm:py-24 bg-white/[0.02] border-y border-white/5 scroll-mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <Eyebrow>Premium</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Get{" "}
              <span className="bg-gradient-to-r from-purple to-cyan bg-clip-text text-transparent">
                verified
              </span>{" "}
              and host your own people.
            </h2>
            <p className="mt-3 text-gray-400">
              Free gets you started. Premium is about trust and access — a verified badge, the power
              to host your own safe Nest meetups, and seeing who's already into meeting you.
            </p>
          </div>

          <div className="mt-10 grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {/* Free */}
            <div className="bg-navy/60 border border-white/10 rounded-3xl p-7 flex flex-col">
              <h3 className="font-semibold text-lg">Free</h3>
              <div className="mt-3 text-4xl font-extrabold">
                $0<span className="text-base text-gray-400 font-normal">/mo</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm flex-1">
                {["3 SideQuests to start", "Browse nearby Signals", "Join verified Nest events"].map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <Check size={16} className="text-cyan shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={getApp}
                className="mt-7 w-full border border-white/20 hover:border-white/40 text-white rounded-full py-3 font-medium transition"
              >
                Get the app
              </button>
            </div>

            {/* Premium */}
            <div className="relative bg-gradient-to-b from-purple/15 to-cyan/10 border border-cyan/40 rounded-3xl p-7 flex flex-col shadow-xl shadow-purple/10">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple to-cyan text-white text-xs font-semibold px-3 py-1 rounded-full">
                Founder rate
              </span>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <BadgeCheck size={18} className="text-cyan" /> Premium
              </h3>
              <div className="mt-3 flex items-end gap-2">
                <div className="text-4xl font-extrabold">
                  $2.49<span className="text-base text-gray-400 font-normal">/mo</span>
                </div>
                <span className="text-sm text-gray-500 line-through mb-1.5">$4.99/mo</span>
              </div>
              <p className="mt-1 text-xs text-cyan/90 font-medium">
                Founder / launch pricing — lock in the early-member rate.
              </p>
              <ul className="mt-6 space-y-3 text-sm flex-1">
                {[
                  { Icon: BadgeCheck, label: "Verified badge — a trust signal on your profile" },
                  { Icon: Tent, label: "Host your own verified, safe Nest meetups" },
                  { Icon: Eye, label: "See who SideQuested you first" },
                  { Icon: Zap, label: "Priority spots + unlimited SideQuests" },
                ].map(({ Icon, label }) => (
                  <li key={label} className="flex items-start gap-3">
                    <Icon size={16} className="text-cyan shrink-0 mt-0.5" /> {label}
                  </li>
                ))}
              </ul>
              <button
                onClick={goUpgrade}
                className="mt-7 w-full bg-gradient-to-r from-purple to-cyan text-white rounded-full py-3 font-semibold active:scale-[.99] transition flex items-center justify-center gap-2"
              >
                Become a founding member <ArrowRight size={16} />
              </button>
              <p className="text-center text-xs text-gray-500 mt-3">
                Secure Stripe checkout · $2.49/mo · cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section id="faq" className="py-16 sm:py-24 scroll-mt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <Eyebrow>Questions</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Good to know</h2>
          </div>
          <div>
            {faqs.map((f) => (
              <Faq key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-cyan/25 bg-gradient-to-br from-purple/20 to-cyan/15 p-10 sm:p-14 text-center">
            <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 rounded-full bg-cyan/20 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-purple/25 blur-3xl" />
            <h2 className="relative text-3xl sm:text-4xl font-extrabold tracking-tight">
              Your people are closer than you think.
            </h2>
            <p className="relative mt-3 text-gray-300 max-w-xl mx-auto">
              Install SideQuest, read the Signals nearby, and send your first SideQuest today.
            </p>
            <div className="relative mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={getApp}
                className="bg-gradient-to-r from-purple to-cyan text-white font-semibold rounded-full px-8 py-3.5 active:scale-95 transition flex items-center justify-center gap-2"
              >
                <Zap size={18} /> Get the app
              </button>
              <button
                onClick={openApp}
                className="border border-white/25 hover:border-white/50 text-white font-medium rounded-full px-8 py-3.5 transition"
              >
                Open the web app
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src="/wordmark.svg" alt="SideQuest" className="h-6" width="140" height="24" />
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-400">
            <a href="#how" className="hover:text-white transition">How it works</a>
            <a href="#safety" className="hover:text-white transition">Safety</a>
            <a href="#premium" className="hover:text-white transition">Premium</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
            <button onClick={openApp} className="hover:text-white transition">Open app</button>
          </nav>
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} SideQuest</p>
        </div>
      </footer>

      {/* ── Sticky mobile CTA ────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-[65] sm:hidden bg-navy/95 backdrop-blur border-t border-white/10 p-3">
        <button
          onClick={getApp}
          className="w-full bg-gradient-to-r from-purple to-cyan text-white font-semibold rounded-full py-3.5 active:scale-[.99] transition flex items-center justify-center gap-2"
        >
          <Zap size={18} /> Get the app
        </button>
      </div>

      <InstallModal
        open={showInstall}
        onClose={() => setShowInstall(false)}
        iOS={iOS}
        android={android}
        onOpenApp={openApp}
      />
    </div>
  );
}
