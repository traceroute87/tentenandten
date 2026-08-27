import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import {
  IcoHome,
  IcoTarget,
  IcoCheckCircle,
  IcoHeart,
  IcoBars,
  IcoBell,
  IcoMenu,
} from "../lib/icons";

/* ---------- TopBar ---------- */
export function TopBar({
  title,
  paper,
  onMenu,
  onBell,
  showBell,
}: {
  title?: string;
  paper?: boolean;
  onMenu?: () => void;
  onBell?: () => void;
  showBell?: boolean;
}) {
  return (
    <header className={`topbar ${paper ? "topbar--paper" : ""}`}>
      {title ? (
        <>
          <span className="iconbtn" aria-hidden />
          <span className="display" style={{ fontSize: 22, letterSpacing: "0.06em" }}>
            {title}
          </span>
        </>
      ) : (
        <div className="brand">
          <span className="brand__mark">
            10<span className="dot">·</span>10<span className="dot">·</span>10
          </span>
          <span className="brand__tag">Small actions. Big impact.</span>
        </div>
      )}
      <div style={{ display: "flex", gap: 2 }}>
        {showBell && (
          <button className="iconbtn" aria-label="Reminders" onClick={onBell}>
            <IcoBell width={22} height={22} />
          </button>
        )}
        {onMenu && (
          <button className="iconbtn" aria-label="Menu" onClick={onMenu}>
            <IcoMenu width={24} height={24} />
          </button>
        )}
      </div>
    </header>
  );
}

/* ---------- BottomNav ---------- */
const TABS = [
  { to: "/", label: "Home", Icon: IcoHome, end: true },
  { to: "/challenge", label: "Challenge", Icon: IcoTarget, end: false },
  { to: "/voting", label: "Voting", Icon: IcoCheckCircle, end: false },
  { to: "/help", label: "Help", Icon: IcoHeart, end: false },
  { to: "/impact", label: "Impact", Icon: IcoBars, end: false },
];

export function BottomNav({ paper }: { paper?: boolean }) {
  return (
    <nav className={`bottomnav ${paper ? "bottomnav--paper" : ""}`}>
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `navitem ${isActive ? "is-active" : ""}`}
        >
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

/* ---------- Screen wrapper ---------- */
export function Screen({
  paper,
  header,
  children,
}: {
  paper?: boolean;
  header?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`app ${paper ? "app--paper" : ""}`}>
      <div className={`screen ${paper ? "screen--paper" : ""}`}>
        {header}
        <div className="screen__body">{children}</div>
      </div>
      <BottomNav paper={paper} />
    </div>
  );
}
