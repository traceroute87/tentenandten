import { IOS_INSTALL_STEPS } from "../lib/install";
import { IcoChevron, IcoPlus } from "../lib/icons";
import { useInstall } from "./InstallProvider";
import { Sheet } from "./ui";
import { useState } from "react";

/** Manual/native install entry point used in the app menu. */
export function InstallCard({ onInstructions }: { onInstructions: () => void }) {
  const { mode, installed, install } = useInstall();
  if (mode === "hidden" || installed) return null;
  return (
    <button type="button" className="menu-row" onClick={() => mode === "manual" ? onInstructions() : void install()}>
      <span className="menu-row__ico"><IcoPlus width={20} height={20} /></span>
      <span className="menu-row__label">Install 10·10·10</span>
      <span className="menu-row__ico"><IcoChevron width={18} height={18} /></span>
    </button>
  );
}

export function InstallInstructionsList() {
  return <ol className="install-instructions">{IOS_INSTALL_STEPS.map((step) => <li key={step}>{step}</li>)}</ol>;
}

export function LandingInstallAction() {
  const { mode, installed, install } = useInstall();
  const [instructions, setInstructions] = useState(false);
  if (mode === "hidden" || installed) return null;
  return <>
    <button className="lp-install" onClick={() => mode === "manual" ? setInstructions(true) : void install()}>
      <IcoPlus width={16} height={16} /> {mode === "manual" ? "Add to Home Screen" : "Install App"}
    </button>
    <Sheet open={instructions} onClose={() => setInstructions(false)} title="Add 10·10·10 to your Home Screen">
      <InstallInstructionsList />
    </Sheet>
  </>;
}
