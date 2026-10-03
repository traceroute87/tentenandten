import { NavLink, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useChrome } from "../ui-chrome";
import { supportsViewTransitions } from "../lib/navigation";
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
    <header className={`topbar ${paper ? "topbar--paper" : ""} ${!title ? "topbar--brand-centered" : ""}`}>
      {showBell && (
        <button className="iconbtn topbar__bell" aria-label="Reminders" onClick={onBell}>
          <IcoBell width={22} height={22} />
        </button>
      )}
      {title ? (
        <>
          <span className="iconbtn" aria-hidden />
          <span className="display" style={{ fontSize: 20, letterSpacing: "0.06em" }}>
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
      <div className="topbar__actions" style={{ display: "flex", gap: 2 }}>
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
  { to: "/?app=1", label: "Home", Icon: IcoHome, end: true },
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
          viewTransition={supportsViewTransitions}
          className={({ isActive }) => `navitem ${isActive ? "is-active" : ""}`}
        >
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

/* ---------- DeskNav — full-width desktop app nav (>=900px, CSS-gated) ---------- */
export function DeskNav() {
  const { openMenu, openReminders } = useChrome();
  return (
    <header className="desknav">
      <div className="desknav__inner">
        <NavLink to="/?app=1" viewTransition={supportsViewTransitions} className="brand" aria-label="10·10·10 home">
          <span className="brand__mark">
            10<span className="dot">·</span>10<span className="dot">·</span>10
          </span>
          <span className="brand__tag">Small actions. Big impact.</span>
        </NavLink>
        <nav className="desknav__links">
          {TABS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              viewTransition={supportsViewTransitions}
              className={({ isActive }) => (isActive ? "is-active" : "")}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="desknav__actions">
          <button className="iconbtn" aria-label="Reminders" onClick={openReminders}>
            <IcoBell width={22} height={22} />
          </button>
          <button className="iconbtn" aria-label="Menu" onClick={openMenu}>
            <IcoMenu width={24} height={24} />
          </button>
        </div>
      </div>
    </header>
  );
}

/* ---------- Screen wrapper ---------- */
export function Screen({
  paper,
  header,
  bodyClassName,
  children,
}: {
  paper?: boolean;
  header?: ReactNode;
  bodyClassName?: string;
  children: ReactNode;
}) {
  const location = useLocation();
  return (
    <div className={`app ${paper ? "app--paper" : ""}`}>
      <DeskNav />
      <div className={`screen ${paper ? "screen--paper" : ""}`}>
        {header}
        <div className={`screen__body ${bodyClassName ?? ""}`} key={location.key} data-route-path={location.pathname}>
          {children}
        </div>
      </div>
      <BottomNav paper={paper} />
    </div>
  );
}
