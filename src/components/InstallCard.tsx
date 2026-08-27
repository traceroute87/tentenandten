import { useEffect, useState } from "react";
import { useStore, dismissInstall } from "../store";
import { track } from "../analytics";
import { Button } from "./ui";
import { IcoPlus } from "../lib/icons";

/** Android/desktop Chrome: catch beforeinstallprompt and offer a subtle card. */
export function InstallCard() {
  const dismissed = useStore((s) => s.flags.installDismissed);
  const [evt, setEvt] = useState<any>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!evt || dismissed) return null;

  return (
    <div className="install">
      <IcoPlus width={20} height={20} />
      <span style={{ flex: 1 }}>Install 10·10·10 for one-tap access.</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={async () => {
          track("install_prompt_shown");
          evt.prompt();
          const { outcome } = await evt.userChoice;
          track("install_prompt_result", { outcome });
          setEvt(null);
        }}
      >
        Install
      </Button>
      <button className="undo" onClick={dismissInstall}>
        Dismiss
      </button>
    </div>
  );
}
