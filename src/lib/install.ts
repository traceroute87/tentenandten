export type InstallMode = "hidden" | "native" | "manual";
export const IOS_INSTALL_STEPS = [
  "Tap the Share button.",
  "Choose “Add to Home Screen.”",
  "Tap “Add.”",
] as const;

export function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function isIOSSafari(userAgent: string, platform: string, maxTouchPoints: number) {
  const ios = /iPhone|iPad|iPod/.test(userAgent)
    || (platform === "MacIntel" && maxTouchPoints > 1);
  return ios && /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);
}

export function installMode({
  standalone,
  installed,
  promptAvailable,
  iosSafari,
}: {
  standalone: boolean;
  installed: boolean;
  promptAvailable: boolean;
  iosSafari: boolean;
}): InstallMode {
  if (standalone || installed) return "hidden";
  if (promptAvailable) return "native";
  return iosSafari ? "manual" : "hidden";
}

export type NativeInstallPrompt = {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform?: string }>;
};

export async function requestNativeInstall(event: NativeInstallPrompt) {
  await event.prompt();
  return (await event.userChoice).outcome;
}
