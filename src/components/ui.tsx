import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as I from "../lib/icons";
import type { OfficialSource } from "../data";

/* ---------- icon lookup by data.ts string ---------- */
const MAP: Record<string, (p: any) => JSX.Element> = {
  phone: I.IcoPhone, chat: I.IcoChat, mail: I.IcoMail, users: I.IcoUsers,
  check: I.IcoCheck, edit: I.IcoEdit, search: I.IcoSearch, pin: I.IcoPin,
  id: I.IcoId, calendar: I.IcoCalendar, book: I.IcoBook, car: I.IcoCar,
  share: I.IcoShare, copy: I.IcoCopy, link: I.IcoLink, star: I.IcoStar,
  facebook: I.IcoFacebook, x: I.IcoX, truth: I.IcoTruth, bell: I.IcoBell,
};
export function Ico({ name, ...p }: { name: string } & any) {
  const C = MAP[name] ?? I.IcoCheck;
  return <C {...p} />;
}

/* ---------- Button ---------- */
type BtnProps = {
  variant?: "primary" | "ghost" | "ghost-dark" | "solid-navy";
  display?: boolean;
  size?: "md" | "sm";
  block?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "primary",
  display,
  size = "md",
  block,
  className = "",
  ...p
}: BtnProps) {
  const cls = [
    "btn",
    `btn--${variant}`,
    display && "btn--display",
    size === "sm" && "btn--sm",
    block && "btn--block",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <button className={cls} {...p} />;
}

/* ---------- ProgressRing ---------- */
const R = 34;
const C = 2 * Math.PI * R;
export function ProgressRing({
  trackId,
  value,
  max = 10,
  glyph,
}: {
  trackId: "reach" | "spread" | "bring";
  value: number;
  max?: number;
  glyph: string;
}) {
  const pct = Math.min(1, value / max);
  return (
    <div className={`ring ring--${trackId}`}>
      <div className="ring__dial">
        <svg viewBox="0 0 80 80">
          <circle className="ring__track" cx="40" cy="40" r={R} strokeWidth="7" fill="none" />
          <circle
            className="ring__fill"
            cx="40"
            cy="40"
            r={R}
            strokeWidth="7"
            fill="none"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
          />
        </svg>
        <div className="ring__glyph">
          <Ico name={glyph} />
        </div>
      </div>
      <div className="ring__count">
        {value}/{max}
      </div>
      <div className="ring__name">
        {trackId === "reach" ? "Reach 10" : trackId === "spread" ? "Spread 10" : "Bring 10"}
      </div>
    </div>
  );
}

/* ---------- MarkerDots ---------- */
export function MarkerDots({
  trackId,
  value,
  max = 10,
  onUndoLast,
}: {
  trackId: "reach" | "spread" | "bring";
  value: number;
  max?: number;
  onUndoLast?: () => void;
}) {
  return (
    <div className={`markers markers--${trackId}`}>
      {Array.from({ length: max }, (_, i) => {
        const done = i < value;
        const isLast = i === value - 1;
        return (
          <button
            key={i}
            className={`marker ${done ? "is-done" : ""} ${i === value ? "is-next" : ""}`}
            aria-label={done ? `${i + 1} of ${max} complete — tap to undo` : `${i + 1} of ${max}`}
            onClick={isLast && onUndoLast ? onUndoLast : undefined}
          >
            {trackId === "bring" ? i + 1 : ""}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Bar ---------- */
export function Bar({ value, max }: { value: number; max: number }) {
  return (
    <div className="bar">
      <div className="bar__fill" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  );
}

/* ---------- Sheet ---------- */
export function Sheet({
  open,
  onClose,
  title,
  dark,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  dark?: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className={`sheet ${dark ? "sheet--dark" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__grip" />
        {title && <div className="sheet__title">{title}</div>}
        {children}
      </div>
    </div>
  );
}

/* ---------- ResourceCard ---------- */
export function ResourceCard({
  source,
  onOpen,
  cta = "Open Official Site",
}: {
  source: OfficialSource;
  onOpen?: () => void;
  cta?: string;
}) {
  return (
    <div className="resource">
      <span className="resource__flag">
        <I.IcoCheckCircle width={14} height={14} /> Official Source
      </span>
      <div className="resource__name">{source.name}</div>
      <div className="resource__url">{source.url.replace(/^https?:\/\//, "")}</div>
      <div className="resource__checked">Last checked {source.lastChecked}</div>
      <a
        className="btn btn--primary btn--block resource__go"
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onOpen}
      >
        {cta}
      </a>
    </div>
  );
}

/* ---------- CheckRow ---------- */
export function CheckRow({
  label,
  icon,
  done,
  onToggle,
}: {
  label: string;
  icon: string;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <button className={`check ${done ? "is-done" : ""}`} onClick={onToggle}>
      <span className="check__ico">
        <Ico name={icon} />
      </span>
      <span className="check__label">{label}</span>
      <span className="check__box">{done && <I.IcoCheck width={14} height={14} />}</span>
    </button>
  );
}

/* ---------- Toast ---------- */
const ToastCtx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg(null), 2200);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && <div className="toast">{msg}</div>}
    </ToastCtx.Provider>
  );
}
