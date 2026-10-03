import { useState } from "react";
import { useAppNavigate } from "../lib/navigation";
import { Screen, TopBar } from "../components/AppShell";
import { Button, Ico } from "../components/ui";
import { useChrome } from "../ui-chrome";
import { HELP_NEEDS } from "../data";
import { MessagePresetSheet } from "../components/MessagePresetSheet";

export default function Help() {
  const [messagesOpen, setMessagesOpen] = useState(false);
  const nav = useAppNavigate();
  const { openMenu } = useChrome();
  return (
    <Screen paper header={<TopBar title="Help" onMenu={openMenu} />}>
      <div className="stack help-wrap">
        <div>
          <h1 className="h1">Help Someone Vote</h1>
          <p className="eyebrow" style={{ marginTop: 4 }}>What do they need?</p>
        </div>
        <div className="help-grid">
          {HELP_NEEDS.map((n) => (
            <button key={n.id} className="help-card" onClick={() => nav(`/help/${n.id}`)}>
              <span className="help-card__icon">
                <Ico name={n.icon} />
              </span>
              <span className="help-card__label">{n.label}</span>
            </button>
          ))}
        </div>
        <p className="note center">
          Choose what they need. We'll handle the rest.
        </p>
        <Button block variant="ghost" onClick={() => setMessagesOpen(true)}>Prepare a message</Button>
      </div>
      <MessagePresetSheet open={messagesOpen} onClose={() => setMessagesOpen(false)} />
    </Screen>
  );
}
