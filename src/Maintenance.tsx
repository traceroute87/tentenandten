/* Temporary maintenance screen, shown when built with VITE_MAINTENANCE_MODE=true.
   Self-contained: no auth, sync, routing, or backend client is loaded. */
const page: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 20,
  padding: "24px 16px",
  textAlign: "center",
  background: "var(--navy-900)",
  color: "var(--paper)",
  fontFamily: "var(--font-ui)",
};

const dot = <span style={{ color: "var(--red-strong)" }}>·</span>;

export default function Maintenance() {
  return (
    <main style={page}>
      <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(56px, 14vw, 96px)", lineHeight: 1, letterSpacing: "0.02em" }}>
        10{dot}10{dot}10
      </h1>
      <div style={{ width: 48, height: 3, borderRadius: 2, background: "var(--red)" }} aria-hidden="true" />
      <p style={{ margin: 0, fontSize: "clamp(18px, 4.5vw, 22px)", fontWeight: 600 }}>We’re making a few improvements.</p>
      <p style={{ margin: 0, fontSize: 16, opacity: 0.8 }}>The site will be back shortly.</p>
      <p style={{ margin: "12px 0 0", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.6 }}>
        Small actions. Big impact.
      </p>
    </main>
  );
}
