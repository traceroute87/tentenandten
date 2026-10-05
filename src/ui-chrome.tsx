import { createContext, useContext, useState, type ReactNode } from "react";
import { Sheet } from "./components/ui";
import { MenuSheet } from "./screens/Menu";
import { RemindersSheet } from "./screens/Reminders";

type Chrome = { openMenu: () => void; openReminders: () => void };
const Ctx = createContext<Chrome>({ openMenu: () => {}, openReminders: () => {} });
export const useChrome = () => useContext(Ctx);

/** Global overlays (account menu, reminders) reachable from every screen's top bar. */
export function ChromeProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const [reminders, setReminders] = useState(false);

  return (
    <Ctx.Provider value={{ openMenu: () => setMenu(true), openReminders: () => setReminders(true) }}>
      {children}
      <Sheet open={menu} onClose={() => setMenu(false)} className="sheet--wide">
        <MenuSheet onClose={() => setMenu(false)} />
      </Sheet>
      <Sheet open={reminders} onClose={() => setReminders(false)} title="Election Reminders" className="sheet--reminders">
        <RemindersSheet />
      </Sheet>
    </Ctx.Provider>
  );
}
