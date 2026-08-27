import { useNavigate } from "react-router-dom";
import { Screen, TopBar } from "../components/AppShell";
import { useChrome } from "../ui-chrome";
import { useStore, setOwnState } from "../store";
import { STATES, NATIONAL, officeFor } from "../data";

export default function ElectionDay() {
  const nav = useNavigate();
  const { openMenu } = useChrome();
  const stateCode = useStore((s) => s.profile.state ?? "");
  const office = officeFor(stateCode || undefined);

  const big = (label: string, href?: string, onClick?: () => void) =>
    href ? (
      <a key={label} className="btn btn--solid-navy btn--block" style={BIG} href={href} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    ) : (
      <button key={label} className="btn btn--solid-navy btn--block" style={BIG} onClick={onClick}>
        {label}
      </button>
    );

  return (
    <Screen header={<TopBar title="Today" onMenu={openMenu} />}>
      <div className="stack">
        <h1 className="display" style={{ fontSize: 44 }}>Today's the day</h1>
        <p className="muted">Fast help to cast your ballot.</p>

        <select className="select" value={stateCode} onChange={(e) => setOwnState(e.target.value)}>
          <option value="">Select your state…</option>
          {STATES.map((s) => (
            <option key={s.code} value={s.code}>{s.name}</option>
          ))}
        </select>

        {big("Where do I vote?", stateCode ? office.url : NATIONAL.overview.url)}
        {big("What do I bring?", stateCode ? office.url : NATIONAL.overview.url)}
        {big("Am I registered?", NATIONAL.checkStatus.url)}
        {big("I'm having a problem voting", "tel:18666876829")}
        {big("Help someone else vote", undefined, () => nav("/help"))}

        <p className="note center">
          Problems at the polls: call the nonpartisan Election Protection hotline
          at 866-OUR-VOTE. If you're in line when polls close, stay in line — you
          can still vote.
        </p>
      </div>
    </Screen>
  );
}

const BIG: React.CSSProperties = {
  fontSize: 18,
  padding: "18px 16px",
  justifyContent: "flex-start",
};
