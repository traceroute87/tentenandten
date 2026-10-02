import { useEffect, useRef, useState } from "react";
import { useAppNavigate } from "../lib/navigation";
import { Screen, TopBar } from "../components/AppShell";
import { ResourceCard, Button } from "../components/ui";
import { useChrome } from "../ui-chrome";
import {
  useStore,
  toggleChecklist,
  setVotingState,
  setVotingMethod,
  setVotingPlan,
} from "../store";
import { STATES, STATE_RESOURCES, votingResource } from "../data";
import { IcoStar, IcoCheck } from "../lib/icons";
import { UpcomingElections } from "../components/UpcomingElections";
import { MessagePresetSheet } from "../components/MessagePresetSheet";

const METHODS = [
  { id: "election_day", label: "Election Day" },
  { id: "early", label: "Early Voting" },
  { id: "mail", label: "Mail / Absentee" },
] as const;

type Key = "registration" | "method" | "where" | "whatineed" | "ballot" | "finish";
const ROW_LABEL: Record<Key, string> = {
  registration: "Registration",
  method: "Voting method",
  where: "Where",
  whatineed: "What I need",
  ballot: "Sample ballot",
  finish: "Finish my plan",
};

export default function Voting() {
  const [messagesOpen, setMessagesOpen] = useState(false);
  const stateSelectRef = useRef<HTMLSelectElement>(null);
  const nav = useAppNavigate();
  const { openMenu } = useChrome();
  const v = useStore((s) => s.voting);
  const state = useStore((s) => s.voting.state ?? s.profile.state ?? "");
  const check = v.checklist;
  const method = v.method;
  const isMail = method === "mail";
  const locationResource = votingResource(method === "early" ? "earlyVoting" : "pollingPlace", state || undefined);
  const ballotResource = state ? STATE_RESOURCES[state]?.ballot : undefined;

  const done: Record<Key, boolean> = {
    registration: !!check.registration,
    method: !!method,
    where: isMail ? true : !!check.where,
    whatineed: !!check.whatineed,
    ballot: !!check.ballot,
    finish: !!check.planSaved,
  };
  // "where" isn't part of a mail plan (§7)
  const relevant: Key[] = (["registration", "method", "where", "whatineed", "ballot", "finish"] as Key[])
    .filter((k) => !(k === "where" && isMail));
  const left = relevant.filter((k) => !done[k]).length;
  const ready = left === 0;

  useEffect(() => {
    if (window.location.hash === "#upcoming-elections")
      document.getElementById("upcoming-elections")?.scrollIntoView();
  }, []);

  return (
    <Screen paper header={<TopBar title="Voting" onMenu={openMenu} />}>
      <div className="stack voting-wrap">
        <div>
          <h1 className="h1">My Voting Plan</h1>
          <p className="muted" style={{ fontSize: 14 }}>
            {ready
              ? "Everything's set. See your plan below."
              : `${left} ${left === 1 ? "thing" : "things"} left to be ready to vote.`}
          </p>
        </div>

        <label className="field" style={{ margin: 0 }}>
          <span className="field__label">My state</span>
          <select ref={stateSelectRef} id="voting-state" className="select" value={state} onChange={(e) => setVotingState(e.target.value)}>
            <option value="">Select your state…</option>
            {STATES.map((s) => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>
        </label>

        <UpcomingElections stateCode={state} />

        {/* adaptive status summary (§7) */}
        <div className="vgroup">
          <div className="vplan-status">
            {(["registration", "method", "where", "whatineed", "ballot", "finish"] as Key[]).map((k) => {
              const skip = k === "where" && isMail;
              return (
                <div
                  key={k}
                  className={`vplan-status__row ${done[k] && !skip ? "is-done" : ""} ${skip ? "is-skip" : ""}`}
                >
                  <span className="tick">{done[k] && !skip && <IcoCheck width={12} height={12} />}</span>
                  <span className="name">{ROW_LABEL[k]}</span>
                  <span className="state">
                    {skip ? "Not part of your plan" : done[k] ? "Done" : "To do"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {ready && <div className="vplan-ready">You're ready to vote ✓</div>}

        {/* REGISTRATION */}
        <Group title="Registration" done={done.registration}>
          <ResourceCard source={votingResource("registration", state || undefined)} cta="Check My Registration" />
          <Tick
            done={done.registration}
            label="I confirmed my registration"
            onClick={() => toggleChecklist("registration")}
          />
        </Group>

        {/* VOTING METHOD */}
        <Group title="Voting method" done={done.method}>
          <p className="muted" style={{ fontSize: 13 }}>How will you vote?</p>
          <div className="vseg">
            {METHODS.map((mo) => (
              <button
                key={mo.id}
                className={`seg-btn ${method === mo.id ? "is-on" : ""}`}
                onClick={() => setVotingMethod(mo.id)}
              >
                {mo.label}
              </button>
            ))}
          </div>
        </Group>

        {/* WHERE — hidden for mail voters (§7) */}
        {!isMail && (
          <Group title="Where" done={done.where}>
            <p className="muted" style={{ fontSize: 13 }}>
              {method === "early"
                ? "Find an early-voting site near you."
                : "Find your assigned polling place."}
            </p>
            {state ? (
              <ResourceCard source={locationResource} cta="Find My Voting Location" />
            ) : (
              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={() => {
                  stateSelectRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  stateSelectRef.current?.focus({ preventScroll: true });
                }}
              >
                Pick a state first
              </button>
            )}
            <label className="field" style={{ marginTop: 10, marginBottom: 0 }}>
              <span className="field__label">Save my location (optional)</span>
              <input
                className="input"
                placeholder="e.g. Lincoln Elementary, 5th St"
                value={v.plan.where ?? ""}
                onChange={(e) => setVotingPlan({ where: e.target.value })}
              />
              <small className="field__hint">Stays on this device.</small>
            </label>
            <Tick
              done={done.where}
              label="I know where I'm voting"
              onClick={() => toggleChecklist("where")}
            />
          </Group>
        )}

        {/* WHAT I NEED */}
        <Group title="What I need" done={done.whatineed}>
          <ResourceCard source={votingResource("whatToBring", state || undefined)} cta="View Official Source" />
          <Tick done={done.whatineed} label="Got it" onClick={() => toggleChecklist("whatineed")} />
        </Group>

        {/* SAMPLE BALLOT */}
        <Group title="Sample ballot / What’s on my ballot" done={done.ballot}>
          <ResourceCard
            source={votingResource("ballot", state || undefined)}
            cta={ballotResource?.status !== "direct" ? "Sample Ballot Information" : "Open Sample Ballot"}
          />
          <Tick done={done.ballot} label="Reviewed" onClick={() => toggleChecklist("ballot")} />
        </Group>

        {/* FINISH — the actual plan */}
        <Group title="Finish my plan" done={done.finish}>
          <div className="plan-form">
            <label className="field">
              <span className="field__label">Voting method</span>
              <input className="input" readOnly value={method ? METHODS.find((m) => m.id === method)!.label : "Not chosen yet"} />
            </label>
            <label className="field">
              <span className="field__label">{isMail ? "Ballot return" : "Where"}</span>
              <input
                className="input"
                placeholder={isMail ? "Drop box / mail by date" : "Polling place or early site"}
                value={v.plan.where ?? ""}
                onChange={(e) => setVotingPlan({ where: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">Day &amp; time</span>
              <input
                className="input"
                placeholder="e.g. Nov 3, right after work"
                value={v.plan.datetime ?? ""}
                onChange={(e) => setVotingPlan({ datetime: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">Getting there</span>
              <input
                className="input"
                placeholder="e.g. walk with a neighbor"
                value={v.plan.transport ?? ""}
                onChange={(e) => setVotingPlan({ transport: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">What to bring</span>
              <input
                className="input"
                placeholder="e.g. driver's license, mail ballot"
                value={v.plan.bring ?? ""}
                onChange={(e) => setVotingPlan({ bring: e.target.value })}
              />
            </label>
            <Button block disabled={done.finish} onClick={() => !check.planSaved && toggleChecklist("planSaved")}>
              {done.finish ? "Plan saved ✓" : "Save My Plan"}
            </Button>
          </div>
        </Group>

        <button className="vgroup vcard-row" onClick={() => nav("/voting/first-time")}>
          <IcoStar />
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 14 }}>Never voted before?</b>
            <div className="muted" style={{ fontSize: 13, fontWeight: 400 }}>
              We'll walk you through it, step by step.
            </div>
          </div>
          <span className="btn btn--primary btn--sm">Start Here</span>
        </button>
        <Button block variant="ghost" onClick={() => setMessagesOpen(true)}>Prepare a message</Button>
      </div>
      <MessagePresetSheet open={messagesOpen} onClose={() => setMessagesOpen(false)} />
    </Screen>
  );
}

function Group({
  title,
  done,
  children,
}: {
  title: string;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="vgroup">
      <div className="vgroup__head">
        <span className="vgroup__title">{title}</span>
        {done && <span className="vgroup__done"><IcoCheck width={16} height={16} /></span>}
      </div>
      <div className="stack-sm">{children}</div>
    </section>
  );
}

function Tick({ done, label, onClick }: { done: boolean; label: string; onClick: () => void }) {
  return (
    <button className={`check ${done ? "is-done" : ""}`} onClick={onClick} style={{ padding: "12px 4px" }}>
      <span className="check__label">{label}</span>
      <span className="check__box">{done && <IcoCheck width={14} height={14} />}</span>
    </button>
  );
}
