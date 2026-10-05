import { useLocation } from "react-router-dom";
import { Button, Sheet } from "./ui";
import { STATES } from "../data";
import { dismissStateSetup, setOwnState, useStore } from "../store";

export function StateSetup() {
  const { pathname } = useLocation();
  const profile = useStore((s) => s.profile);
  const dismissed = useStore((s) => !!s.flags.stateSetupDismissed);
  const open = !profile.state && !dismissed && (pathname === "/voting" || pathname === "/help" || pathname.startsWith("/help/"));
  return (
      <Sheet open={open} onClose={dismissStateSetup} title="Choose your state to get relevant voting resources.">
        <label className="field">
          <span className="field__label">State</span>
          <select className="select" autoFocus defaultValue="" onChange={(e) => {
            if (e.target.value) { setOwnState(e.target.value); dismissStateSetup(); }
          }}>
            <option value="">Select a state</option>
            {STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
          </select>
        </label>
        <Button block variant="ghost" onClick={dismissStateSetup}>Skip</Button>
      </Sheet>
  );
}
