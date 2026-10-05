import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/app.css";
import "./styles/landing.css";

// Build-time flag: the unused branch is dropped, so a maintenance build never
// loads the app (auth, sync, routing) and a normal build never ships the screen.
const view = import.meta.env.VITE_MAINTENANCE_MODE === "true" ? import("./Maintenance") : import("./App");

void view.then(({ default: View }) => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <View />
    </StrictMode>,
  );
});
