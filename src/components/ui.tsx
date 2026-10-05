import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useId,
  useLayoutEffect,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
import * as I from "../lib/icons";
import type { OfficialSource } from "../data";
import { sheetStack, stateWithSheetStack } from "../lib/sheet-history";

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
        {trackId === "reach" ? "Reach 10" : trackId === "spread" ? "Share 10" : "Bring 10"}
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
/** Sheets currently open. A history entry whose top sheet is not open is stale. */
const openSheetIds = new Set<string>();

/** Forward (or a reload) can land on a sheet's history entry after that sheet closed: nothing
    visible changes and the next Back looks dead. Step back off the stale entry, or just drop
    its marker if there is no earlier entry. Mounted once, inside the router. */
export function useDiscardStaleSheetEntries() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  useEffect(() => {
    const top = sheetStack(location.state).at(-1);
    if (!top || openSheetIds.has(top) || navigationType !== "POP") return;
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate({ pathname: location.pathname, search: location.search, hash: location.hash }, {
      replace: true, state: stateWithSheetStack(location.state, []), preventScrollReset: true,
    });
  }, [location.key]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function Sheet({
  open,
  onClose,
  title,
  closeButton,
  className = "",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  closeButton?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const id = useId();
  const wasOpen = useRef(false);
  const hasHistoryEntry = useRef(false);
  const awaitingHistoryEntry = useRef(false);
  const cleanupPending = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; startY: number; startedAt: number } | null>(null);
  const closeRef = useRef(onClose);
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);
  closeRef.current = onClose;
  useLayoutEffect(() => {
    if (!open) return;
    openSheetIds.add(id);
    return () => { openSheetIds.delete(id); };
  }, [open, id]);
  useLayoutEffect(() => {
    const stack = sheetStack(location.state);
    // Pop only while the browser is still on this sheet's entry. A navigation made in the
    // same click as the close (e.g. Start Challenge) has already pushed/replaced the entry,
    // but React Router applies it in a transition, so `location` can still be stale here.
    const isTop = stack.at(-1) === id && sheetStack((window.history.state as { usr?: unknown } | null)?.usr).at(-1) === id;
    if (stack.includes(id)) awaitingHistoryEntry.current = false;

    if (open && !wasOpen.current) {
      wasOpen.current = true;
      if (!stack.includes(id)) {
        awaitingHistoryEntry.current = true;
        navigate({ pathname: location.pathname, search: location.search, hash: location.hash }, {
          state: stateWithSheetStack(location.state, [...stack, id]),
          preventScrollReset: true,
        });
      }
      hasHistoryEntry.current = true;
      cleanupPending.current = false;
      return;
    }

    if (open && wasOpen.current && awaitingHistoryEntry.current) return;

    if (open && wasOpen.current && hasHistoryEntry.current && !stack.includes(id)) {
      // Browser/Android Back removed this sheet's entry. Close without popping again.
      wasOpen.current = false;
      hasHistoryEntry.current = false;
      closeRef.current();
      return;
    }

    if (!open && wasOpen.current) {
      wasOpen.current = false;
      awaitingHistoryEntry.current = false;
      cleanupPending.current = true;
      if (isTop) {
        hasHistoryEntry.current = false;
        navigate(-1);
      }
      return;
    }

    // If a parent sheet closes while a nested sheet is above it, remove the
    // parent's entry when that nested sheet has unwound.
    if (!open && hasHistoryEntry.current && isTop && cleanupPending.current) {
      hasHistoryEntry.current = false;
      navigate(-1);
    }
  }, [open, location.key, location.pathname, location.search, location.hash, location.state, navigate, id]);
  useEffect(() => {
    if (open) {
      setVisible(true);
      setClosing(false);
      setDragY(0);
      return;
    }
    if (!visible) return;
    setClosing(true);
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180;
    const timer = window.setTimeout(() => setVisible(false), delay);
    return () => window.clearTimeout(timer);
  }, [open, visible]);
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusables = () => Array.from(dialog?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? []).filter((el) => el.getClientRects().length > 0);
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        e.preventDefault();
        dialog?.focus();
      } else if (e.shiftKey && (document.activeElement === first || !dialog?.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !dialog?.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [open]);
  const onDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    setHasDragged(true);
    dragRef.current = { pointerId: event.pointerId, startY: event.clientY, startedAt: performance.now() };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    setDragY(Math.max(0, event.clientY - dragRef.current.startY));
  };
  const onDragEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    const distance = Math.max(0, event.clientY - drag.startY);
    const velocity = distance / Math.max(1, performance.now() - drag.startedAt);
    if (distance >= 110 || (distance >= 48 && velocity >= 0.65)) onClose();
    setDragY(0);
  };
  const onDragCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragY(0);
  };
  if (!visible && !open) return null;
  return createPortal((
    <div
      className={`sheet-backdrop ${closing ? "is-closing" : ""}`}
      aria-hidden={closing}
      onClick={closing ? undefined : onClose}
    >
      <div
        className={`sheet ${className} ${hasDragged ? "sheet--interacted" : ""} ${dragY ? "sheet--dragging" : ""}`}
        ref={dialogRef}
        style={{ "--sheet-drag-y": `${dragY}px` } as CSSProperties}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "10·10·10 account and app menu"}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__header">
          <div
            className="sheet__drag-handle"
            aria-label="Drag down to close sheet"
            onPointerDown={onDragStart}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={onDragCancel}
          >
            <div className="sheet__grip" />
          </div>
          <div className={`sheet__heading ${!title && !closeButton ? "sheet__heading--desktop-only" : ""}`}>
            {title && <div className="sheet__title">{title}</div>}
            <button className={`sheet__close ${closeButton ? "" : "sheet__close--desktop-only"}`} type="button" aria-label="Close sheet" onClick={onClose}>×</button>
          </div>
        </div>
        <div className="sheet__content">{children}</div>
      </div>
    </div>
  ), document.body);
}

/* ---------- ResourceCard ---------- */
export function ResourceCard({
  source,
  onOpen,
  cta = "Open Official Site",
  secondaryAction,
}: {
  source: OfficialSource;
  onOpen?: () => void;
  cta?: string;
  secondaryAction?: ReactNode;
}) {
  return (
    <div className="resource">
      <span className="resource__flag">
        <I.IcoCheckCircle width={14} height={14} /> Official Source
      </span>
      <div className="resource__name">{source.name}</div>
      <div className="resource__url">{source.url.replace(/^https?:\/\//, "")}</div>
      <a
        className="btn btn--primary btn--block resource__go"
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onOpen}
      >
        {cta}
      </a>
      {secondaryAction && <div className="resource__secondary">{secondaryAction}</div>}
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
