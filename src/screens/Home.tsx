import { useNavigate } from "react-router-dom";
import { Screen, TopBar } from "../components/AppShell";
import { Button, ProgressRing, Bar } from "../components/ui";
import { ReminderBanner } from "./Reminders";
import { InstallCard } from "../components/InstallCard";
import { useChrome } from "../ui-chrome";
import { useStore, totalActions, nextTrack } from "../store";
import { ELECTION_DAY } from "../data";
import { HeroPicture } from "../components/HeroPicture";
import { IcoChat, IcoMail, IcoUsers, IcoCheck, IcoChevron, IcoWarn } from "../lib/icons";

const isElectionDay = () => new Date().toISOString().slice(0, 10) === ELECTION_DAY;

const QUICK = [
  { icon: <IcoChat />, title: "Call or Text Someone", sub: "Reach 10 people you know", to: "/challenge/reach" },
  { icon: <IcoMail />, title: "Email or Post", sub: "Spread the word 10 times", to: "/challenge/spread" },
  { icon: <IcoUsers />, title: "Help Someone Vote", sub: "Bring 10 people to the polls", to: "/challenge/bring" },
  { icon: <IcoCheck />, title: "Build My Voting Plan", sub: "Get yourself ballot-ready", to: "/voting" },
];

export default function Home() {
  const nav = useNavigate();
  const { openMenu, openReminders } = useChrome();
  const s = useStore((x) => x);
  const total = totalActions(s);

  return (
    <Screen
      header={
        <TopBar showBell onBell={openReminders} onMenu={openMenu} />
      }
    >
      <div className="stack">
        <div className="hero">
          <HeroPicture className="hero__img" sizes="480px" eager />
        </div>

        {isElectionDay() && (
          <button
            className="reminder reminder--urgent"
            style={{ width: "100%", textAlign: "left" }}
            onClick={() => nav("/today")}
          >
            <IcoWarn />
            <span>
              <b>Today's the day.</b> Tap for fast voting help.
            </span>
          </button>
        )}

        <ReminderBanner />
        <InstallCard />

        <section>
          <div className="section-label">Your Progress</div>
          <div className="rings">
            <ProgressRing trackId="reach" value={s.challenge.reach.count} glyph="phone" />
            <ProgressRing trackId="spread" value={s.challenge.spread.count} glyph="mail" />
            <ProgressRing trackId="bring" value={s.challenge.bring.count} glyph="users" />
          </div>
          <div className="totalbar">
            <div className="totalbar__meta">
              <b>{total}</b> / 30 actions completed
            </div>
            <Bar value={total} max={30} />
          </div>
        </section>

        <Button
          display
          block
          onClick={() => nav(`/challenge/${nextTrack(s)}`)}
        >
          {total === 0 ? "Start the Challenge" : total >= 30 ? "Challenge Complete" : "Continue Challenge"}
        </Button>

        <section>
          <div className="section-label">Quick Actions</div>
          <div className="qa">
            {QUICK.map((q) => (
              <button key={q.title} className="qa__item" onClick={() => nav(q.to)}>
                <span className="qa__icon">{q.icon}</span>
                <span className="qa__txt">
                  <b>{q.title}</b>
                  <span>{q.sub}</span>
                </span>
                <span className="qa__chev">
                  <IcoChevron width={18} height={18} />
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </Screen>
  );
}
