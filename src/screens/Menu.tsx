import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button, useToast } from "../components/ui";
import { RemindersSheet } from "./Reminders";
import { useAuth } from "../auth";
import { useStore, setName, setOwnState } from "../store";
import { STATES } from "../data";
import { referralUrl } from "../lib/share";
import { track } from "../analytics";
import {
  IcoUser,
  IcoQr,
  IcoBell,
  IcoPin,
  IcoShield,
  IcoHeart,
  IcoInfo,
  IcoLogout,
  IcoChevron,
} from "../lib/icons";

type View = "root" | "referral" | "reminders" | "privacy" | "support" | "about";

export function MenuSheet({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<View>("root");
  const { session, configured, signIn, signOut } = useAuth();
  const profile = useStore((s) => s.profile);
  const toast = useToast();

  if (view === "referral") return <ReferralView onBack={() => setView("root")} />;
  if (view === "reminders")
    return (
      <>
        <SubHeader title="Reminders" onBack={() => setView("root")} />
        <RemindersSheet />
      </>
    );
  if (view === "privacy") return <TextView title="Privacy" onBack={() => setView("root")} body={PRIVACY} />;
  if (view === "support") return <SupportView onBack={() => setView("root")} />;
  if (view === "about") return <TextView title="About 10·10·10" onBack={() => setView("root")} body={ABOUT} />;

  return (
    <div>
      <div className="brand" style={{ marginBottom: 14 }}>
        <span className="brand__mark">
          10<span className="dot">·</span>10<span className="dot">·</span>10
        </span>
        <span className="brand__tag">Small actions. Big impact.</span>
      </div>

      {configured && !session && <SignIn onSignIn={signIn} />}
      {session && (
        <p className="note" style={{ marginBottom: 8 }}>
          Signed in as {session.user.email}
        </p>
      )}

      <div className="menu-list">
        <NameRow name={profile.name} onSave={(n) => { setName(n); toast("Saved"); }} />

        <Row icon={<IcoQr />} label="Referral Link / QR Code" onClick={() => setView("referral")} />
        <Row icon={<IcoBell />} label="Reminders" onClick={() => setView("reminders")} />

        <label className="menu-row">
          <span className="menu-row__ico"><IcoPin /></span>
          <span className="menu-row__label">My State</span>
          <select
            className="select"
            style={{ width: "auto", minHeight: 36, padding: "6px 8px" }}
            value={profile.state ?? ""}
            onChange={(e) => setOwnState(e.target.value)}
          >
            <option value="">Not set</option>
            {STATES.map((s) => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>
        </label>

        <Row icon={<IcoShield />} label="Privacy" onClick={() => setView("privacy")} />
        <Row icon={<IcoHeart />} label="Support 10·10·10" onClick={() => setView("support")} />
        <Row icon={<IcoInfo />} label="About 10·10·10" onClick={() => setView("about")} />

        {session && (
          <button
            className="menu-row menu-row--danger"
            onClick={async () => { await signOut(); onClose(); }}
          >
            <span className="menu-row__ico"><IcoLogout /></span>
            <span className="menu-row__label">Log Out</span>
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ icon, label, onClick }: { icon: JSX.Element; label: string; onClick: () => void }) {
  return (
    <button className="menu-row" onClick={onClick}>
      <span className="menu-row__ico">{icon}</span>
      <span className="menu-row__label">{label}</span>
      <span className="menu-row__ico"><IcoChevron width={18} height={18} /></span>
    </button>
  );
}

function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <button className="undo" onClick={onBack}>‹ Back</button>
      <span className="sheet__title" style={{ margin: 0 }}>{title}</span>
    </div>
  );
}

function NameRow({ name, onSave }: { name?: string; onSave: (n: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(name ?? "");
  if (editing)
    return (
      <div className="menu-row" style={{ gap: 8 }}>
        <input className="input" value={v} placeholder="Your name" onChange={(e) => setV(e.target.value)} />
        <Button size="sm" onClick={() => { onSave(v.trim()); setEditing(false); }}>Save</Button>
      </div>
    );
  return (
    <button className="menu-row" onClick={() => setEditing(true)}>
      <span className="menu-row__ico"><IcoUser /></span>
      <span className="menu-row__label">My Profile</span>
      <span className="menu-row__value">{name || "Add name"}</span>
    </button>
  );
}

function SignIn({ onSignIn }: { onSignIn: (email: string) => Promise<{ ok: boolean; error?: string }> }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  if (sent)
    return (
      <div className="card--paper" style={{ marginBottom: 12 }}>
        Check your email for a sign-in link.
      </div>
    );
  return (
    <div className="card--paper" style={{ marginBottom: 14 }}>
      <b style={{ display: "block", marginBottom: 4 }}>Create an account (optional)</b>
      <p className="note" style={{ marginBottom: 10 }}>
        For device sync, reminders, and a verified referral link. Your local
        progress will be merged in.
      </p>
      <input
        className="input"
        type="email"
        inputMode="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ marginBottom: 8 }}
      />
      {err && <p className="note" style={{ color: "var(--red-strong)" }}>{err}</p>}
      <Button
        block
        disabled={!email.includes("@")}
        onClick={async () => {
          const r = await onSignIn(email.trim());
          if (r.ok) setSent(true);
          else setErr(r.error ?? "Something went wrong");
        }}
      >
        Email Me a Sign-In Link
      </Button>
    </div>
  );
}

function ReferralView({ onBack }: { onBack: () => void }) {
  const { session } = useAuth();
  const code = useStore((s) => s.profile.referralCode);
  const toast = useToast();
  const [qr, setQr] = useState("");
  const url = referralUrl(code);

  useEffect(() => {
    if (code) QRCode.toDataURL(url, { margin: 1, width: 320 }).then(setQr).catch(() => {});
  }, [code, url]);

  return (
    <div>
      <SubHeader title="Referral Link / QR" onBack={onBack} />
      {!session || !code ? (
        <p className="note">
          Create an account to get your personal referral link, URL, and QR code.
          Referrals are verified server-side — they can't be faked.
        </p>
      ) : (
        <div className="stack">
          <div className="resource" style={{ textAlign: "center" }}>
            {qr && <img src={qr} alt="Your referral QR code" style={{ margin: "0 auto", width: 200, height: 200 }} />}
            <div className="resource__name" style={{ marginTop: 10 }}>Code: {code}</div>
            <div className="resource__url">{url.replace(/^https?:\/\//, "")}</div>
          </div>
          <Button
            block
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                toast("Link copied");
                track("referral_link_copied");
              } catch {
                toast("Copy failed");
              }
            }}
          >
            Copy My Link
          </Button>
          <p className="note">
            A referral is verified when a friend opens your link, creates an
            account, and starts the challenge.
          </p>
        </div>
      )}
    </div>
  );
}

function SupportView({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <SubHeader title="Support 10·10·10" onBack={onBack} />
      <div className="card--paper">
        <b>10·10·10 is free to use.</b>
        <p style={{ fontSize: 14, marginTop: 6 }}>
          Help keep it online. No ads, no paywalls — just the option to chip in if
          it's useful to you.
        </p>
        <a
          className="btn btn--primary btn--block"
          style={{ marginTop: 12 }}
          href="https://opencollective.com/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("support_clicked")}
        >
          Support the Mission
        </a>
        <p className="note" style={{ marginTop: 8 }}>Secure. Optional. Appreciated.</p>
      </div>
    </div>
  );
}

function TextView({ title, body, onBack }: { title: string; body: string[]; onBack: () => void }) {
  return (
    <div>
      <SubHeader title={title} onBack={onBack} />
      <div className="stack-sm">
        {body.map((p, i) => (
          <p key={i} style={{ fontSize: 14 }}>{p}</p>
        ))}
      </div>
    </div>
  );
}

const PRIVACY = [
  "10·10·10 is guest-first. Your challenge progress is stored on your device until you choose to create an account.",
  "We never upload or store your contacts or address book. The optional contact picker runs entirely on your device.",
  "If you create an account we store your email (for sign-in), your challenge counts, your state if you set it, and a referral code. That's it.",
  "Analytics are limited to anonymous funnel events (screen reached, action completed) tied to a random ID — never your name or contacts.",
];

const ABOUT = [
  "10·10·10 helps you vote, and helps you get other people voting. Reach 10. Spread 10. Bring 10.",
  "It's an honor-system challenge — you mark your own actions complete.",
  "10·10·10 is not a government agency and not the legal authority on voting rules. Always confirm details with the official federal and state sources we link to.",
  "Version 1.0",
];
