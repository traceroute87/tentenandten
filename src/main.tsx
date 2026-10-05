import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/app.css";
import "./styles/landing.css";

// Build-time flag: the unused branch is dropped, so a maintenance build never
// loads the app (auth, sync, routing) and a normal build never ships the screen.
const view = import.meta.env.VITE_MAINTENANCE_MODE === "true" ? import("./Maintenance") : import("./App");

// After a deploy the new service worker activates (skipWaiting + clientsClaim) and takes
// over pages still running the cached build; reload once so they run the new build.
// Only pages already controlled at load listen, so the first install never reloads, and
// a reloaded page is controlled by the newest worker, so there is no second reload.
if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
  // Installed apps resume without navigating, which is when browsers check for updates.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void navigator.serviceWorker.getRegistration().then((r) => r?.update());
  });
}

void view.then(({ default: View }) => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <View />
    </StrictMode>,
  );
});
