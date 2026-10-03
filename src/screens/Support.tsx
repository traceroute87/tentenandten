import { Screen, TopBar } from "../components/AppShell";
import { useChrome } from "../ui-chrome";
import { SUPPORT_URL } from "../lib/support";

export default function Support() {
  const { openMenu } = useChrome();

  return (
    <Screen paper header={<TopBar title="Support 10·10·10" onMenu={openMenu} />}>
      <section className="card--paper support-card">
        <p>Help cover hosting, development, and maintaining trusted voter resources.</p>
        {SUPPORT_URL ? (
          <a className="btn btn--primary btn--block" href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
            Support on Ko-fi
          </a>
        ) : (
          <p className="note" role="status">
            {import.meta.env.DEV
              ? "Support is unavailable: VITE_SUPPORT_URL is not configured."
              : "Support is temporarily unavailable. Please check back soon."}
          </p>
        )}
      </section>
    </Screen>
  );
}
