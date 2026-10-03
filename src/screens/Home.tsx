import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useAppNavigate } from "../lib/navigation";
import { Screen, TopBar } from "../components/AppShell";
import { Button, ProgressRing, Bar, Sheet } from "../components/ui";
import { ReminderBanner } from "./Reminders";
import { useChrome } from "../ui-chrome";
import { useStore, totalActions, nextTrack, startNewChallenge, setChallengeElectionContext, type ElectionContext } from "../store";
import { ELECTION_DAY, localCalendarDate, nextKnownElection, UPCOMING_ELECTIONS } from "../data";
import { HeroPicture } from "../components/HeroPicture";
import { IcoChat, IcoMail, IcoUsers, IcoCheck, IcoChevron, IcoWarn, IcoCalendar } from "../lib/icons";
import { ChallengeHistoryList } from "./ChallengeHistory";

const isElectionDay = () => new Date().toISOString().slice(0, 10) === ELECTION_DAY;

const QUICK = [
  { icon: <IcoChat />, title: "Call or Text Someone", sub: "Reach 10 people you know", to: "/challenge/reach" },
  { icon: <IcoMail />, title: "Email or Post", sub: "Share useful voting information", to: "/challenge/share" },
  { icon: <IcoUsers />, title: "Help Someone Vote", sub: "Bring 10 people to the polls", to: "/challenge/bring" },
  { icon: <IcoCheck />, title: "Build My Voting Plan", sub: "Get yourself ballot-ready", to: "/voting" },
];

export default function Home() {
  const nav = useAppNavigate();
  const { openMenu, openReminders } = useChrome();
  const s = useStore((x) => x);
  const [newChallengeOpen, setNewChallengeOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [contextOptionsOpen, setContextOptionsOpen] = useState(false);
  const [completionExpanded, setCompletionExpanded] = useState(false);
  const completionDetailsRef = useRef<HTMLDivElement>(null);
  const completionGesture = useRef<{ pointerId: number; x: number; y: number; startedAt: number } | null>(null);
  const suppressCompletionClick = useRef(false);
  const [nextElectionId, setNextElectionId] = useState(s.challengeElection?.electionId ?? "");
  const total = totalActions(s);
  const completed = total >= 30;
  useEffect(() => {
    if (!completed) setCompletionExpanded(false);
  }, [completed]);
  useEffect(() => {
    completionDetailsRef.current?.toggleAttribute("inert", !completionExpanded);
  }, [completionExpanded]);
  const onCompletionPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    completionGesture.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, startedAt: performance.now() };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onCompletionPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const gesture = completionGesture.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    completionGesture.current = null;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    const elapsed = performance.now() - gesture.startedAt;
    if (Math.abs(dx) < 60 && elapsed < 800 && Math.abs(dy) >= 35) {
      if (completionExpanded ? dy <= -80 : dy >= 80) setCompletionExpanded(!completionExpanded);
      suppressCompletionClick.current = true;
      window.setTimeout(() => { suppressCompletionClick.current = false; }, 0);
    }
  };
  const completionDate = s.challengeCompletedAt && Number.isFinite(Date.parse(s.challengeCompletedAt))
    ? new Date(s.challengeCompletedAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
    : null;
  const next = completed ? null : QUICK.find((q) => q.to === `/challenge/${nextTrack(s)}`);
  const election = nextKnownElection();
  const electionContexts = UPCOMING_ELECTIONS.filter((item) => item.date >= localCalendarDate() || item.id === s.challengeElection?.electionId);

  return (
    <Screen
      header={
        <TopBar showBell onBell={openReminders} onMenu={openMenu} />
      }
    >
      <div className="stack home-stack">
        <div className="hero hero--flush home-hero">
          <HeroPicture className="hero__img" sizes="(min-width: 900px) 700px, 480px" eager />
          <span className="home-hero__tag">Reach 10. Share 10. Bring 10.</span>
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

        <section className="home-progress">
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

        {completed ? (
          <section className={`card card--paper home-completion home-cta ${completionExpanded ? "is-expanded" : "is-collapsed"}`} aria-labelledby="challenge-complete-title">
            <h2 id="challenge-complete-title" className="h2">
              <button
                type="button"
                className="home-completion__toggle"
                aria-expanded={completionExpanded}
                aria-controls="challenge-complete-details"
                onClickCapture={(event) => {
                  if (suppressCompletionClick.current) {
                    event.preventDefault();
                    event.stopPropagation();
                    suppressCompletionClick.current = false;
                  }
                }}
                onClick={() => setCompletionExpanded((expanded) => !expanded)}
                onPointerDown={onCompletionPointerDown}
                onPointerUp={onCompletionPointerUp}
                onPointerCancel={() => { completionGesture.current = null; }}
              >
                <span>CHALLENGE COMPLETE 🎉</span>
                <span className="home-completion__chevron" aria-hidden="true">{completionExpanded ? "⌃" : "⌄"}</span>
              </button>
            </h2>
            <div id="challenge-complete-details" ref={completionDetailsRef} className="home-completion__details" aria-hidden={!completionExpanded}>
              <div className="home-completion__details-inner">
                <p className="home-completion__context">{s.challengeElection?.electionName ?? "General turnout challenge"}</p>
                {s.challengeElection?.electionDate && <p className="note">Election {new Date(`${s.challengeElection.electionDate}T12:00:00`).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}{s.challengeElection.jurisdiction ? ` · ${s.challengeElection.jurisdiction}` : ""}</p>}
                {completionDate && <p className="note">Completed {completionDate}</p>}
                <div className="home-completion__results">
                  <span>Reach 10 <b>{s.challenge.reach.count}/10</b></span>
                  <span>Share 10 <b>{s.challenge.spread.count}/10</b></span>
                  <span>Bring 10 <b>{s.challenge.bring.count}/10</b></span>
                </div>
                <strong className="home-completion__total">30 actions completed</strong>
                <div className="home-completion__actions">
                  <Button size="sm" variant="ghost" onClick={() => setHistoryOpen(true)}>View Challenge History</Button>
                  <Button size="sm" onClick={() => { setNextElectionId(""); setContextOptionsOpen(false); setNewChallengeOpen(true); }}>Start a New 10·10·10</Button>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <div className="home-cta home-start-actions">
            <Button display block onClick={() => nav(`/challenge/${nextTrack(s)}`)}>
              {total === 0 ? "Start the Challenge" : "Continue Challenge"}
            </Button>
            {total === 0 && !s.flags.challengeStartedAt && <Button size="sm" variant="ghost" onClick={() => { setNextElectionId(s.challengeElection?.electionId ?? ""); setContextOpen(true); setContextOptionsOpen(false); }}>Choose election context (optional)</Button>}
          </div>
        )}

        <div className={`home-next ${completed ? "home-next--completed" : ""}`}>
          <div className="section-label">Next Recommended</div>
          <button
            className="home-next__row"
            onClick={() => nav(next ? next.to : "/impact")}
          >
            <span className="qa__icon">{next ? next.icon : <IcoCheck />}</span>
            <span className="qa__txt">
              <b>{next ? next.title : "All 30 actions done"}</b>
              <span>{next ? next.sub : "See your impact"}</span>
            </span>
            <span className="qa__chev">
              <IcoChevron width={18} height={18} />
            </span>
          </button>
          {election && (
            <>
              <div className="section-label" style={{ marginTop: 16 }}>Next known federal election</div>
              <button className="home-next__row" onClick={() => nav("/voting#upcoming-elections")}>
                <span className="qa__icon"><IcoCalendar /></span>
                <span className="qa__txt">
                  <b>{election.name}</b>
                  <span>
                    {new Date(`${election.date}T12:00:00`).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                    {` · ${election.scope} · View election details`}
                  </span>
                </span>
                <span className="qa__chev"><IcoChevron width={18} height={18} /></span>
              </button>
            </>
          )}
        </div>

        <section className="home-qa">
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
      <Sheet
        open={newChallengeOpen || contextOpen || historyOpen}
        onClose={() => { setNewChallengeOpen(false); setContextOpen(false); setHistoryOpen(false); setContextOptionsOpen(false); }}
        title={historyOpen ? "Challenge History" : newChallengeOpen ? "Start a new challenge?" : "Choose an election context"}
        closeButton
      >
        {historyOpen ? <ChallengeHistoryList /> : (
          <div className="stack-sm challenge-start-sheet">
            <p>{newChallengeOpen ? "Your completed challenge will stay in your Challenge History. Reach 10, Share 10, and Bring 10 will start again at 0." : "You can associate this challenge with a known upcoming election, or leave it as a general turnout challenge."}</p>
            <div className="field">
              <span className="field__label">Election context (optional)</span>
              <button
                type="button"
                className="context-picker"
                aria-expanded={contextOptionsOpen}
                aria-controls="challenge-election-options"
                onClick={() => setContextOptionsOpen((open) => !open)}
              >
                <span>{electionContexts.find((item) => item.id === nextElectionId)?.name ?? "General turnout challenge"}</span>
                <span className="context-picker__change">{contextOptionsOpen ? "Close" : "Change"}</span>
              </button>
              {contextOptionsOpen && (
                <div className="context-options" id="challenge-election-options" role="radiogroup" aria-label="Election context options">
                  <label className="context-option">
                    <input type="radio" name="challenge-election-context" checked={!nextElectionId} onChange={() => { setNextElectionId(""); setContextOptionsOpen(false); }} />
                    <span>General turnout challenge</span>
                  </label>
                  {electionContexts.map((item) => (
                    <label className="context-option" key={item.id}>
                      <input type="radio" name="challenge-election-context" checked={nextElectionId === item.id} onChange={() => { setNextElectionId(item.id); setContextOptionsOpen(false); }} />
                      <span>{item.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {newChallengeOpen ? <Button block onClick={() => {
              const election = electionContexts.find((item) => item.id === nextElectionId);
              const context: ElectionContext | null = election ? {
                electionId: election.id,
                electionName: election.name,
                electionDate: election.date,
                electionType: election.type,
                ...(election.stateCode ? { jurisdiction: election.stateCode } : {}),
              } : null;
              if (startNewChallenge(context)) { setNewChallengeOpen(false); setContextOptionsOpen(false); }
            }}>Start New Challenge</Button> : <Button block onClick={() => {
              const election = electionContexts.find((item) => item.id === nextElectionId);
              const context: ElectionContext | null = election ? {
                electionId: election.id,
                electionName: election.name,
                electionDate: election.date,
                electionType: election.type,
                ...(election.stateCode ? { jurisdiction: election.stateCode } : {}),
              } : null;
              if (setChallengeElectionContext(context)) { setContextOpen(false); setContextOptionsOpen(false); }
            }}>Save Context</Button>}
            <Button block variant="ghost" onClick={() => { setNewChallengeOpen(false); setContextOpen(false); setContextOptionsOpen(false); }}>Cancel</Button>
          </div>
        )}
      </Sheet>
    </Screen>
  );
}
