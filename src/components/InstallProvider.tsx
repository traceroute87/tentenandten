import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { track } from "../analytics";
import { installMode, isIOSSafari, isStandaloneMode, requestNativeInstall, type InstallMode, type NativeInstallPrompt } from "../lib/install";

type BeforeInstallPromptEvent = Event & NativeInstallPrompt;
type InstallContextValue = { mode: InstallMode; installed: boolean; install: () => Promise<void> };
const InstallContext = createContext<InstallContextValue>({ mode: "hidden", installed: false, install: async () => {} });
const DISMISSED_KEY = "t10.install-prompt-dismissed";

function wasDismissed() {
  try { return sessionStorage.getItem(DISMISSED_KEY) === "1"; } catch { return false; }
}

export function InstallProvider({ children }: { children: ReactNode }) {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandaloneMode);
  const dismissedRef = useRef(wasDismissed());

  useEffect(() => {
    if (import.meta.env.DEV) document.documentElement.dataset.beforeInstallPromptCaptured = "false";
    const onPrompt = (event: Event) => {
      event.preventDefault();
      if (import.meta.env.DEV) document.documentElement.dataset.beforeInstallPromptCaptured = "true";
      if (!dismissedRef.current) setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setPromptEvent(null);
      setInstalled(true);
      try { sessionStorage.removeItem(DISMISSED_KEY); } catch { /* storage is optional */ }
      track("app_installed");
    };
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = () => { if (displayMode.matches) setInstalled(true); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    displayMode.addEventListener("change", onDisplayModeChange);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      displayMode.removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  const mode = installMode({
    standalone: isStandaloneMode(),
    installed,
    promptAvailable: !!promptEvent,
    iosSafari: isIOSSafari(navigator.userAgent, navigator.platform, navigator.maxTouchPoints),
  });

  async function install() {
    if (!promptEvent) return;
    const event = promptEvent;
    setPromptEvent(null);
    track("install_prompt_shown");
    try {
      const outcome = await requestNativeInstall(event);
      track("install_prompt_result", { outcome });
      if (outcome === "dismissed") {
        dismissedRef.current = true;
        try { sessionStorage.setItem(DISMISSED_KEY, "1"); } catch { /* storage is optional */ }
      }
    } catch {
      dismissedRef.current = true;
    }
  }

  return <InstallContext.Provider value={{ mode, installed, install }}>{children}</InstallContext.Provider>;
}

export function useInstall() {
  return useContext(InstallContext);
}
