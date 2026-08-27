import { useNavigate } from "react-router-dom";
import { Screen, TopBar } from "../components/AppShell";
import { Ico } from "../components/ui";
import { useChrome } from "../ui-chrome";
import { HELP_NEEDS } from "../data";

export default function Help() {
  const nav = useNavigate();
  const { openMenu } = useChrome();
  return (
    <Screen paper header={<TopBar title="Help" onMenu={openMenu} />}>
      <div className="stack">
        <div>
          <h1 className="h1">Help Someone Vote</h1>
          <p className="eyebrow" style={{ marginTop: 4 }}>What do they need?</p>
        </div>
        <div className="grid-3">
          {HELP_NEEDS.map((n) => (
            <button key={n.id} className="need" onClick={() => nav(`/help/${n.id}`)}>
              <Ico name={n.icon} />
              {n.label}
            </button>
          ))}
        </div>
        <p className="note center">
          Pick a need, get the official info, then send it to them.
        </p>
      </div>
    </Screen>
  );
}
