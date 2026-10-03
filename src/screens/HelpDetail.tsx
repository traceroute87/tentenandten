import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAppNavigate } from "../lib/navigation";
import { Screen, TopBar } from "../components/AppShell";
import { Button, ResourceCard } from "../components/ui";
import { ShareSheet } from "../components/ShareSheet";
import { useChrome } from "../ui-chrome";
import { useStore, setOwnState } from "../store";
import { HELP_NEEDS, STATES, NATIONAL, officeFor } from "../data";

export default function HelpDetail() {
  const { need: needId } = useParams();
  const nav = useAppNavigate();
  const { openMenu } = useChrome();
  const [share, setShare] = useState(false);
  const stateCode = useStore((s) => s.profile.state ?? "");

  const need = HELP_NEEDS.find((n) => n.id === needId);
  if (!need) return <Navigate to="/help" replace />;

  if (need.id === "firsttime") return <Navigate to="/voting/first-time" replace />;

  const needsState = need.source === "state";
  const source =
    need.source === "state"
      ? officeFor(stateCode || undefined)
      : NATIONAL[need.source];
  const ready = !needsState || !!stateCode;

  return (
    <Screen paper header={<TopBar title="Help" onMenu={openMenu} />}>
      <div className="stack">
        <button className="undo" onClick={() => nav("/help")}>
          ‹ All needs
        </button>
        <h1 className="h1">{need.label}</h1>
        <p style={{ fontSize: 15 }}>{need.blurb}</p>

        {needsState && (
          <label className="field" style={{ margin: 0 }}>
            <span className="field__label">Which state are they in?</span>
            <select
              className="select"
              value={stateCode}
              onChange={(e) => setOwnState(e.target.value)}
            >
              <option value="">Select a state…</option>
              {STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {ready ? (
          <ResourceCard
            source={source}
            secondaryAction={<Button block variant="primary" onClick={() => setShare(true)}>Send This to Them</Button>}
          />
        ) : (
          <div className="resource">
            <p className="note">Pick a state to get the official resource.</p>
            <div className="resource__secondary">
              <Button block variant="primary" disabled={!ready} onClick={() => setShare(true)}>Send This to Them</Button>
            </div>
          </div>
        )}
      </div>

      <ShareSheet
        open={share}
        onClose={() => setShare(false)}
        title="Send this to them"
        message={`${need.label}: ${need.blurb} Official info:`}
        resourceUrl={source.url}
      />
    </Screen>
  );
}
