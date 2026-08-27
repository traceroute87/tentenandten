import { useNavigate } from "react-router-dom";
import { Screen, TopBar } from "../components/AppShell";
import { CheckRow, ResourceCard } from "../components/ui";
import { useChrome } from "../ui-chrome";
import { useStore, toggleChecklist, setVotingState } from "../store";
import { VOTING_STEPS, STATES, NATIONAL, officeFor, ELECTION_DAY } from "../data";
import { IcoCalendar, IcoStar } from "../lib/icons";

export default function Voting() {
  const nav = useNavigate();
  const { openMenu } = useChrome();
  const state = useStore((s) => s.voting.state ?? s.profile.state ?? "");
  const checklist = useStore((s) => s.voting.checklist);
  const office = officeFor(state || undefined);
  const doneCount = VOTING_STEPS.filter((v) => checklist[v.id]).length;

  return (
    <Screen paper header={<TopBar title="Voting" onMenu={openMenu} />}>
      <div className="stack">
        <div>
          <h1 className="h1">My Voting Plan</h1>
          <p className="muted" style={{ fontSize: 14 }}>
            {doneCount}/{VOTING_STEPS.length} steps done. Work through these to be
            ready to vote.
          </p>
        </div>

        <label className="field" style={{ margin: 0 }}>
          <span className="field__label">My state</span>
          <select
            className="select"
            value={state}
            onChange={(e) => setVotingState(e.target.value)}
          >
            <option value="">Select your state…</option>
            {STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <div className="card--paper" style={{ padding: "4px 14px" }}>
          <div className="checklist">
            {VOTING_STEPS.map((v) => (
              <CheckRow
                key={v.id}
                label={v.label}
                icon={v.icon}
                done={!!checklist[v.id]}
                onToggle={() => toggleChecklist(v.id)}
              />
            ))}
          </div>
        </div>

        <div className="stack-sm">
          <ResourceCard
            source={state ? office : NATIONAL.checkStatus}
            cta={state ? "Open My State Election Site" : "Check My Registration"}
          />
          {state && <ResourceCard source={NATIONAL.checkStatus} cta="Check My Registration" />}
        </div>

        <div className="resource" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <IcoCalendar />
          <div style={{ flex: 1 }}>
            <b>Next election</b>
            <div className="muted" style={{ fontSize: 13 }}>
              {new Date(ELECTION_DAY + "T00:00").toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              · General Election
            </div>
          </div>
        </div>

        <button
          className="need"
          style={{ alignItems: "flex-start", textAlign: "left" }}
          onClick={() => nav("/voting/first-time")}
        >
          <IcoStar />
          <div>
            <b style={{ fontSize: 14 }}>Never voted before?</b>
            <div className="muted" style={{ fontSize: 13, fontWeight: 400 }}>
              We'll walk you through it, step by step.
            </div>
          </div>
          <span className="btn btn--primary btn--sm" style={{ marginTop: 8 }}>
            Start Here
          </span>
        </button>
      </div>
    </Screen>
  );
}
