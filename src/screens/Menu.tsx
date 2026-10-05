import { useEffect, useRef, useState } from "react";
import { useAppNavigate } from "../lib/navigation";
import QRCode from "qrcode";
import { Button, useToast } from "../components/ui";
import { RemindersSheet } from "./Reminders";
import { useAuth } from "../auth";
import { useStore, setName, setOwnState } from "../store";
import { STATES } from "../data";
import { copyText, referralUrl } from "../lib/share";
import { track } from "../analytics";
import { InstallCard, InstallInstructionsList } from "../components/InstallCard";
import { normalizeOtp, OTP_MAX_LENGTH, OTP_MIN_LENGTH, OTP_RESEND_SECONDS } from "../lib/otp";
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

type View = "root" | "referral" | "reminders" | "privacy" | "about" | "install";

export function MenuSheet({ onClose }: { onClose: () => void }) {
  const nav = useAppNavigate();
  const [view, setView] = useState<View>("root");
  const { session, configured, requestCode, verifyCode, signOut } = useAuth();
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
  if (view === "install") return <><SubHeader title="Install 10·10·10" onBack={() => setView("root")} /><InstallInstructionsList /></>;
  if (view === "about") return <TextView title="About 10·10·10" onBack={() => setView("root")} body={ABOUT} />;

  return (
    <div>
      <div className="brand menu-brand">
        <span className="brand__mark">
          10<span className="dot">·</span>10<span className="dot">·</span>10
        </span>
        <span className="brand__tag">Small actions. Big impact.</span>
      </div>

      {configured && !session && <SignIn requestCode={requestCode} verifyCode={verifyCode} />}
      {session && (
        <p className="note" style={{ marginBottom: 8 }}>
          Signed in as {session.user.email}
        </p>
      )}

      <div className="menu-list">
        <NameRow name={profile.name} onSave={(n) => { setName(n); toast("Saved"); }} />

        <Row icon={<IcoQr />} label="Referral Link / QR Code" onClick={() => setView("referral")} />
        <Row icon={<IcoBell />} label="Reminders" onClick={() => setView("reminders")} />
        <InstallCard onInstructions={() => setView("install")} />

        <label className="menu-row">
          <span className="menu-row__ico"><IcoPin /></span>
          <span className="menu-row__label">My State</span>
          <select
            className="select"
            aria-label="My state"
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
        {/* Replacing the menu's history entry closes it (see Sheet); closing first would pop that entry after this navigation. */}
        <Row icon={<IcoInfo />} label="Trust / Sources" onClick={() => nav("/trust", { replace: true })} />
        <Row icon={<IcoHeart />} label="Support 10·10·10" onClick={() => nav("/support", { replace: true })} />
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
        <input className="input" aria-label="Your name" value={v} placeholder="Your name" onChange={(e) => setV(e.target.value)} />
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

type AuthResult = Promise<{ ok: boolean; error?: string }>;

function SignIn({ requestCode, verifyCode }: { requestCode: (email: string) => AuthResult; verifyCode: (email: string, code: string) => AuthResult }) {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false); // blocks a second click before the disabled state renders
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);
  useEffect(() => {
    if (sentTo) codeRef.current?.focus();
  }, [sentTo]);

  const run = async (work: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setErr("");
    setNotice("");
    try {
      await work();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const send = (address: string, resend: boolean) => run(async () => {
    const r = await requestCode(address);
    if (!r.ok) { setErr(r.error ?? "Couldn't send a code. Try again."); return; }
    setSentTo(address);
    setCooldown(OTP_RESEND_SECONDS);
    if (resend) { setCode(""); setNotice("We sent a new code. Use the newest email."); codeRef.current?.focus(); }
  });
  const verify = () => run(async () => {
    const r = await verifyCode(sentTo, code);
    // On success the session takes over and this form unmounts.
    if (!r.ok) setErr(r.error ?? "That code is invalid or has expired.");
  });

  if (sentTo)
    return (
      <form className="card--paper menu-signin" style={{ marginBottom: 14 }} noValidate onSubmit={(e) => { e.preventDefault(); if (code.length >= OTP_MIN_LENGTH) void verify(); }}>
        <b style={{ display: "block", marginBottom: 4 }}>Check your email</b>
        <p className="note" style={{ marginBottom: 10 }}>
          We sent a code to:<br /><b style={{ overflowWrap: "anywhere" }}>{sentTo}</b>
        </p>
        <label className="field" style={{ marginBottom: 8 }}>
          <span className="field__label">Verification code</span>
          <input
            ref={codeRef}
            className="input"
            name="one-time-code"
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={OTP_MAX_LENGTH}
            value={code}
            onChange={(e) => setCode(normalizeOtp(e.target.value))}
            aria-invalid={Boolean(err)}
            aria-describedby={err ? "signin-error" : undefined}
          />
        </label>
        {err && <p id="signin-error" role="alert" className="note" style={{ color: "var(--red-strong)" }}>{err}</p>}
        {notice && <p role="status" className="note">{notice}</p>}
        <Button block type="submit" disabled={busy || code.length < OTP_MIN_LENGTH}>
          {busy ? "Verifying…" : "Verify code"}
        </Button>
        <div className="menu-signin__secondary" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          <Button size="sm" variant="ghost" type="button" disabled={busy || cooldown > 0} onClick={() => void send(sentTo, true)}>
            {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
          </Button>
          <Button size="sm" variant="ghost" type="button" disabled={busy} onClick={() => { setSentTo(""); setCode(""); setErr(""); setNotice(""); }}>
            Use a different email
          </Button>
        </div>
      </form>
    );
  return (
    <form className="card--paper menu-signin" style={{ marginBottom: 14 }} noValidate onSubmit={(e) => { e.preventDefault(); if (email.trim().includes("@")) void send(email.trim(), false); }}>
      <b style={{ display: "block", marginBottom: 4 }}>Sign in</b>
      <p className="note" style={{ marginBottom: 10 }}>
        Optional. For syncing your challenge across devices and getting a referral link. Current guest progress can be adopted once; each account stays separate.
      </p>
      <label className="field" style={{ marginBottom: 8 }}>
        <span className="field__label">Email</span>
        <input
          className="input"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(err)}
          aria-describedby={err ? "signin-error" : "signin-hint"}
        />
      </label>
      {err && <p id="signin-error" role="alert" className="note" style={{ color: "var(--red-strong)" }}>{err}</p>}
      <Button block type="submit" disabled={busy || !email.trim().includes("@")}>
        {busy ? "Sending…" : "Send code"}
      </Button>
      <p id="signin-hint" className="note" style={{ marginTop: 8 }}>We'll email you a verification code.</p>
    </form>
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
          Referral starts are based on a friend's account and self-reported challenge progress.
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
              if (await copyText(url)) {
                toast("Copied!");
                track("referral_link_copied");
              } else {
                toast("Copy failed");
              }
            }}
          >
            Copy My Link
          </Button>
          <p className="note">
            A referral start is counted when a friend opens your link, creates an
            account, and records progress in the honor-system challenge.
          </p>
        </div>
      )}
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
  "On this device, 10·10·10 stores your name, current challenge progress, Challenge History, state, reminder settings, voting checklist, voting method, and free-text voting plan.",
  "With an account, Supabase stores your email, current Reach/Share/Bring progress, completed Challenge History and its optional election context, voting checklist, state, reminder settings, referral code, and referral status. Your voting method and free-text voting-plan details stay on this device.",
  "Challenge History contains action counts and dates, plus an optional election name/date/jurisdiction. It does not contain candidate selections, party preference, ballot choices, voting location/address, or free-text voting-plan details.",
  "The optional contact picker reads a contact on your device to open your phone app. Contact details are not saved by 10·10·10 or uploaded.",
  "Analytics store app events with a browser ID saved on this device (random where supported). They do not include your account ID, referral code, name, email, contacts, or candidate/party choices.",
];

const ABOUT = [
  "10·10·10 helps you vote, and helps you get other people voting. Reach 10. Share 10. Bring 10.",
  "It's an honor-system challenge — you mark your own actions complete.",
  "10·10·10 is not a government agency and not the legal authority on voting rules. Always confirm details with the official federal and state sources we link to.",
  "Version 1.0",
];
