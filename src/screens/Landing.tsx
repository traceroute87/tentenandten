import { useEffect, useState } from "react";
import { useAppNavigate } from "../lib/navigation";
import { HeroPicture } from "../components/HeroPicture";
import { LandingInstallAction } from "../components/InstallCard";
import { Bar } from "../components/ui";
import { useStore, totalActions, nextTrack } from "../store";
import { supabase } from "../lib/supabase";
import { NATIONAL } from "../data";
import {
  IcoPhone,
  IcoMail,
  IcoUsers,
  IcoBook,
  IcoCheck,
  IcoBell,
  IcoPin,
  IcoHeart,
  IcoStar,
  IcoX,
  IcoCheckCircle,
  IcoChevron,
} from "../lib/icons";
import { useChrome } from "../ui-chrome";

type Community = {
  participants: number;
  actions_completed: number;
  referral_starts: number;
  states_represented: number;
};

const NAV = [
  { href: "#how", label: "How It Works" },
  { href: "#guide", label: "Voting Guide" },
  { href: "#impact", label: "Impact" },
  { href: "#resources", label: "Resources" },
];

export default function Landing() {
  const nav = useAppNavigate();
  const { openReminders } = useChrome();
  const s = useStore((x) => x);
  const total = totalActions(s);
  const complete = total >= 30;
  const challengePath = complete ? "/impact" : total > 0
    ? `/challenge/${nextTrack(s) === "spread" ? "share" : nextTrack(s)}`
    : "/challenge/reach";
  const [community, setCommunity] = useState<Community | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.rpc("community_stats").then(({ data }) => data && setCommunity(data as Community));
  }, []);

  const go = (path: string) => () => nav(path);

  return (
    <div className="lp">
      {/* header */}
      <header className="lp-header">
        <div className="lp-header__inner">
          <a href="#top" className="lp-brand" aria-label="10·10·10 home">
            <span className="lp-brand__mark">
              10<span className="dot">·</span>10<span className="dot">·</span>10
            </span>
            <span className="lp-brand__tag">Small actions. Big impact.</span>
          </a>
          <nav className="lp-nav">
            {NAV.map((n) => (
              <a key={n.href} href={n.href}>
                {n.label}
              </a>
            ))}
          </nav>
          <LandingInstallAction />
          <button className="lp-btn lp-btn--primary lp-header__action" onClick={go(challengePath)}>
            {complete ? "View Your Impact" : "Start the Challenge"}
          </button>
        </div>
      </header>

      {/* hero */}
      <section className="lp-hero" id="top">
        <div className="lp-hero__media">
          <HeroPicture sizes="100vw" eager alt="" />
        </div>
        <div className="lp-hero__inner">
          <h1 className="lp-hero__headline">
            <span className="lp-hero__line">
              10<span className="dot">·</span>Calls or texts.
            </span>
            <span className="lp-hero__line">
              10<span className="dot">·</span>Emails or posts.
            </span>
            <span className="lp-hero__line">
              10<span className="dot">·</span>People to the polls.
            </span>
          </h1>
          <div className="lp-hero__turn">Turn action into turnout.</div>
          <div className="lp-hero__cta">
            <button
              className="lp-btn lp-btn--primary lp-btn--lg"
              onClick={go(challengePath)}
            >
              {complete ? "Challenge Complete" : total > 0 ? "Continue Challenge" : "Start 10·10·10"}
            </button>
            <button className="lp-btn lp-btn--ghost lp-btn--lg" onClick={go("/voting")}>
              I need to vote
            </button>
          </div>
          {total > 0 && (
            <div className="lp-hero__progress">
              <Bar value={total} max={30} />
              <span>{total} / 30 actions completed</span>
            </div>
          )}
        </div>
      </section>

      {/* how it works */}
      <section className="lp-sec lp-sec--paper" id="how">
        <div className="lp__wrap">
          <div className="lp-sec__eyebrow">The 10·10·10 Challenge</div>
          <h2 className="lp-sec__title">Three simple actions</h2>
          <div className="lp-pillars">
            <Pillar
              n={1}
              icon={<IcoPhone />}
              title="Reach 10"
              kicker="Call or text 10 people"
              body="Call or text 10 people you know and make sure they have a plan to vote."
              onMore={go("/challenge/reach")}
            />
            <Pillar
              n={2}
              icon={<IcoMail />}
              title="Share 10"
              kicker="Emails or social posts"
              body="Send 10 emails or make 10 posts with useful voting information."
              onMore={go("/challenge/share")}
            />
            <Pillar
              n={3}
              icon={<IcoUsers />}
              title="Bring 10"
              kicker="People to the polls"
              body="Help 10 people make a voting plan and follow through by casting their ballot."
              onMore={go("/challenge/bring")}
            />
          </div>
        </div>
      </section>

      {/* tools / voting guide */}
      <section className="lp-sec lp-sec--dark" id="guide">
        <div className="lp__wrap">
          <div className="lp-sec__eyebrow">Tools to help you win</div>
          <h2 className="lp-sec__title">Everything you need</h2>
          <div className="lp-tools">
            <Tool icon={<IcoBook />} label="Voting Guide" desc="Get yourself ballot-ready." onClick={go("/voting")} />
            <Tool icon={<IcoCheck />} label="Build My Plan" desc="A step-by-step plan to vote." onClick={go("/voting")} />
            <Tool icon={<IcoUsers />} label="Help Someone" desc="Send them what they need." onClick={go("/help")} />
            <Tool icon={<IcoBell />} label="Reminders" desc="Key dates, no spam." onClick={openReminders} />
            <Tool icon={<IcoPin />} label="Election Day" desc="Fast help when it counts." onClick={go("/today")} />
          </div>
        </div>
      </section>

      {/* resources */}
      <section className="lp-sec lp-sec--paper" id="resources">
        <div className="lp__wrap">
          <div className="lp-sec__eyebrow">Official Resources</div>
          <h2 className="lp-sec__title">Trusted voter information</h2>
          <p className="lp-sec__lead">Straight from government and nonpartisan sources.</p>
          <div className="lp-res">
            <ResCard s={NATIONAL.register} desc="Register to vote or update your address at the official U.S. government site." />
            <ResCard s={NATIONAL.overview} desc="Plain-English voting basics: how, when, and where to vote." />
            <ResCard s={NATIONAL.checkStatus} desc="Confirm your registration and look up your state's rules." />
            <ResCard s={NATIONAL.eac} desc="Federal guidance on IDs, accessibility, and casting your ballot." />
          </div>
          <div className="lp-res__cta" style={{ textAlign: "center", marginTop: 28 }}>
            <button className="lp-btn lp-btn--primary lp-btn--lg" onClick={go("/help")}>
              Find your state's election office
            </button>
          </div>
        </div>
      </section>

      {/* impact / community */}
      <section className="lp-sec lp-sec--dark" id="impact">
        <div className="lp__wrap">
          <div className="lp-sec__eyebrow">Our Impact</div>
          <h2 className="lp-sec__title">Truthful numbers only</h2>
          <p className="lp-sec__lead">
            No inflated counts. Challenge starts are self-reported by participants.
          </p>
          <div className="lp-strip__inner" style={{ padding: "32px 0 16px", margin: 0 }}>
            <CStat n={community?.participants} l="Participants" />
            <CStat n={community?.actions_completed} l="Actions in completed challenges" />
            <CStat n={community?.referral_starts} l="Friends who started" />
            <CStat n={community?.states_represented} l="States represented" />
          </div>
          <p className="lp-strip__note" style={{ padding: 0, margin: 0 }}>
            {community
              ? "Live community totals, updated from in-app activity."
              : "Community totals go live at launch. Referral starts are based on a friend's account and self-reported challenge progress."}
          </p>
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button className="lp-btn lp-btn--ghost" onClick={go("/impact")}>
              See your impact <IcoChevron width={14} height={14} />
            </button>
          </div>
        </div>
      </section>

      {/* support */}
      <section className="lp-support">
        <div className="lp-support__inner">
          <span className="lp-support__badge">
            <IcoStar />
          </span>
          <div>
            <h3>Support 10·10·10</h3>
            <p>Help cover hosting, development, and maintaining trusted voter resources.</p>
          </div>
          <div className="lp-support__cta">
            <button className="lp-btn lp-btn--primary lp-btn--lg" onClick={go("/support")}>
              <IcoHeart width={16} height={16} /> Support 10·10·10
            </button>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="lp-footer">
        <div className="lp-footer__inner">
          <span>© {new Date().getFullYear()} 10·10·10</span>
          <div className="lp-footer__links">
            <a href="#how">How It Works</a>
            <a href="#guide">Voting Guide</a>
            <a href="#resources">Resources</a>
            <a href="/trust">Trust / Sources</a>
            <a className="lp-footer__social" href="https://x.com/1010and10" target="_blank" rel="noopener noreferrer" aria-label="10·10·10 on X (@1010and10)">
              <IcoX width={16} height={16} /> <span>@1010and10</span>
            </a>
          </div>
        </div>
        <p className="lp-strip__note" style={{ paddingTop: 0 }}>
          10·10·10 is not a government agency and not the legal authority on voting
          rules. Always confirm details with the official sources linked above.
        </p>
      </footer>
    </div>
  );
}

function Pillar({
  n,
  icon,
  title,
  kicker,
  body,
  onMore,
}: {
  n: 1 | 2 | 3;
  icon: JSX.Element;
  title: string;
  kicker: string;
  body: string;
  onMore: () => void;
}) {
  return (
    <div className={`lp-pillar lp-pillar--${n}`}>
      <span className="lp-pillar__badge">{n}</span>
      <span className="lp-pillar__icon">{icon}</span>
      <div className="lp-pillar__title">{title}</div>
      <div className="lp-pillar__kicker">{kicker}</div>
      <p className="lp-pillar__body">{body}</p>
      <button className="lp-pillar__more" onClick={onMore}>
        Learn more →
      </button>
    </div>
  );
}

function Tool({
  icon,
  label,
  desc,
  onClick,
}: {
  icon: JSX.Element;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button className="lp-tool" onClick={onClick}>
      {icon}
      <div className="lp-tool__label">{label}</div>
      <div className="lp-tool__desc">{desc}</div>
    </button>
  );
}

function ResCard({ s, desc }: { s: { name: string; url: string }; desc: string }) {
  return (
    <a className="lp-res__card" href={s.url} target="_blank" rel="noopener noreferrer">
      <span className="lp-res__flag">
        <IcoCheckCircle width={12} height={12} /> Official Source
      </span>
      <span className="lp-res__name">{s.name}</span>
      <span className="lp-res__desc">{desc}</span>
      <span className="lp-res__link">Open site →</span>
    </a>
  );
}

function CStat({ n, l }: { n?: number; l: string }) {
  return (
    <div className="lp-stat">
      <span className="lp-stat__n">{typeof n === "number" ? n.toLocaleString() : "—"}</span>
      <span className="lp-stat__l">{l}</span>
    </div>
  );
}
