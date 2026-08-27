import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth";
import { ChromeProvider } from "./ui-chrome";
import { ToastProvider } from "./components/ui";
import { setReferredBy } from "./store";
import { track } from "./analytics";
import Home from "./screens/Home";
import Challenge from "./screens/Challenge";
import Voting from "./screens/Voting";
import FirstTimeVoter from "./screens/FirstTimeVoter";
import Help from "./screens/Help";
import HelpDetail from "./screens/HelpDetail";
import Impact from "./screens/Impact";
import ElectionDay from "./screens/ElectionDay";

function useEntryCapture() {
  useEffect(() => {
    track("visited");
    const p = new URLSearchParams(window.location.search);
    const r = p.get("r");
    if (r) {
      setReferredBy(r.toUpperCase());
      track("referral_visit", { code: r.toUpperCase() });
    }
    if (r || p.get("res")) {
      p.delete("r");
      p.delete("res");
      const qs = p.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
    }
  }, []);
}

export default function App() {
  useEntryCapture();
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ChromeProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/challenge" element={<Navigate to="/challenge/reach" replace />} />
              <Route path="/challenge/:track" element={<Challenge />} />
              <Route path="/voting" element={<Voting />} />
              <Route path="/voting/first-time" element={<FirstTimeVoter />} />
              <Route path="/help" element={<Help />} />
              <Route path="/help/:need" element={<HelpDetail />} />
              <Route path="/impact" element={<Impact />} />
              <Route path="/today" element={<ElectionDay />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ChromeProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
