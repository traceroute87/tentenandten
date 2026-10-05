import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import { ChromeProvider } from "./ui-chrome";
import { ToastProvider } from "./components/ui";
import { setReferredBy } from "./store";
import { track } from "./analytics";
import Home from "./screens/Home";
import Landing from "./screens/Landing";
import Challenge from "./screens/Challenge";
import Voting from "./screens/Voting";
import FirstTimeVoter from "./screens/FirstTimeVoter";
import Help from "./screens/Help";
import HelpDetail from "./screens/HelpDetail";
import Impact from "./screens/Impact";
import ChallengeHistory from "./screens/ChallengeHistory";
import ElectionDay from "./screens/ElectionDay";
import Trust from "./screens/Trust";
import Support from "./screens/Support";
import { StateSetup } from "./components/StateSetup";
import { isIOSSafari, isStandaloneMode } from "./lib/install";
import { InstallProvider } from "./components/InstallProvider";

function useEntryCapture() {
  useEffect(() => {
    track("visited");
    const p = new URLSearchParams(window.location.search);
    const r = p.get("r");
    if (r) {
      if (setReferredBy(r)) track("referral_visit");
    }
    if (r || p.get("res")) {
      p.delete("r");
      p.delete("res");
      const qs = p.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
    }
  }, []);
}

/** Browser root is the marketing landing; explicit app entry and standalone launch go to Home. */
function RootRoute() {
  const forceApp = new URLSearchParams(useLocation().search).get("app") === "1";
  return !forceApp && !isStandaloneMode() ? <Landing /> : <Home />;
}

export default function App() {
  useEntryCapture();
  return (
    <BrowserRouter>
      <InstallProvider>
        <AuthProvider>
          <ToastProvider>
            <ChromeProvider>
              <Routes>
                <Route path="/" element={<RootRoute />} />
                <Route path="/welcome" element={<Landing />} />
                <Route path="/challenge" element={<Navigate to="/challenge/reach" replace />} />
                <Route path="/challenge/:track" element={<Challenge />} />
                <Route path="/voting" element={<Voting />} />
                <Route path="/voting/first-time" element={<FirstTimeVoter />} />
                <Route path="/help" element={<Help />} />
                <Route path="/help/:need" element={<HelpDetail />} />
                <Route path="/impact" element={<Impact />} />
                <Route path="/challenge-history" element={<ChallengeHistory />} />
                <Route path="/today" element={<ElectionDay />} />
                <Route path="/trust" element={<Trust />} />
                <Route path="/support" element={<Support />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <StateSetup />
              <SyncNotice />
              <RuntimeDiagnostics />
            </ChromeProvider>
          </ToastProvider>
        </AuthProvider>
      </InstallProvider>
    </BrowserRouter>
  );
}

function RuntimeDiagnostics() {
  const location = useLocation();
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const timer = window.setTimeout(() => {
      const root = document.documentElement;
      const mobile = window.matchMedia("(max-width: 899px)").matches;
      // BrowserRouter's declarative history does not start React Router view transitions.
      const viewTransitions = false;
      console.info(
        `[10·10·10 dev]\nroute: ${location.pathname}${location.search}${location.hash}` +
          `\nmobile: ${mobile}` +
          `\nviewTransitions: ${viewTransitions}` +
          `\nbeforeInstallPromptCaptured: ${root.dataset.beforeInstallPromptCaptured === "true"}` +
          `\nstandalone: ${isStandaloneMode()}` +
          `\niosSafari: ${isIOSSafari(navigator.userAgent, navigator.platform, navigator.maxTouchPoints)}`,
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}

function SyncNotice() {
  const { session, syncError, retrySync, authNotice, dismissAuthNotice } = useAuth();
  if (authNotice)
    return (
      <div className="sync-notice" role="alert">
        <span>{authNotice}</span>
        <button className="btn btn--sm" onClick={dismissAuthNotice}>OK</button>
      </div>
    );
  if (!session || !syncError) return null;
  return (
    <div className="sync-notice" role="alert">
      <span>{syncError}</span>
      <button className="btn btn--sm" onClick={retrySync}>Retry</button>
    </div>
  );
}
