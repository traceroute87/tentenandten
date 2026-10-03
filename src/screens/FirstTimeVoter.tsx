import { useAppNavigate } from "../lib/navigation";
import { Screen, TopBar } from "../components/AppShell";
import { ResourceCard } from "../components/ui";
import { useChrome } from "../ui-chrome";
import { useStore, setVotingState } from "../store";
import { STATES, NATIONAL, officeFor } from "../data";

const STEPS: { h: string; p: string }[] = [
  {
    h: "1 · Can you vote?",
    p: "You can vote in federal elections if you're a U.S. citizen, will be 18 or older by Election Day, and meet your state's residency rules. Some states restrict voting for people with certain felony convictions — rules vary and many have changed.",
  },
  {
    h: "2 · Register",
    p: "Almost every state requires you to register before you can vote (North Dakota doesn't). You'll give your name, address, and usually a driver's license number or the last four digits of your SSN. Register online, by mail, or in person.",
  },
  {
    h: "3 · Check your status",
    p: "After you register, confirm it went through — especially if you moved, changed your name, or haven't voted in a while. You can look up your registration at your state's official site.",
  },
  {
    h: "4 · Decide how you'll vote",
    p: "Most states offer more than one option: in person on Election Day, in person during an early-voting period, or by mail / absentee ballot. Pick what fits your schedule.",
  },
  {
    h: "5 · Know what to bring",
    p: "Many states ask for ID at the polls; what counts as acceptable ID differs by state. Check your state's list ahead of time so nothing slows you down.",
  },
  {
    h: "6 · Early voting",
    p: "If your state has early voting, you can cast a regular ballot in person on set days before Election Day, often with shorter lines and more location choices.",
  },
  {
    h: "7 · Mail / absentee voting",
    p: "You request a ballot, it arrives by mail, you fill it out at home, and you return it by mail or to a drop-off location. Watch the return deadline — some states go by postmark, others by when it's received.",
  },
  {
    h: "8 · Preview your ballot",
    p: "Look at an official sample ballot before you go. You'll see every race and measure, so you can decide in advance and vote quickly.",
  },
  {
    h: "9 · At the polling place",
    p: "You give your name and address, show ID if your state requires it, and a poll worker checks you in. You get your ballot, fill it out in a private booth, and feed it into the scanner or hand it in. If there's ever a problem, ask for a provisional ballot — you have the right to one.",
  },
];

export default function FirstTimeVoter() {
  const nav = useAppNavigate();
  const { openMenu } = useChrome();
  const state = useStore((s) => s.voting.state ?? s.profile.state ?? "");
  const office = officeFor(state || undefined);

  return (
    <Screen paper header={<TopBar title="First-Time Voter" onMenu={openMenu} />}>
      <div className="stack">
        <button className="undo" onClick={() => nav("/voting")}>
          ‹ Back to My Voting Plan
        </button>
        <h1 className="h1">Voting, start to finish</h1>
        <p className="muted" style={{ fontSize: 14 }}>
          The whole process in plain English. No jargon.
        </p>

        <label className="field" style={{ margin: 0 }}>
          <span className="field__label">Your state</span>
          <select className="select" value={state} onChange={(e) => setVotingState(e.target.value)}>
            <option value="">Select your state…</option>
            {STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        {STEPS.map((s) => (
          <div key={s.h} className="card--paper">
            <b style={{ display: "block", marginBottom: 4 }}>{s.h}</b>
            <p style={{ fontSize: 14 }}>{s.p}</p>
          </div>
        ))}

        <ResourceCard source={NATIONAL.overview} cta="Voting Basics (USA.gov)" />
        <ResourceCard
          source={state ? office : NATIONAL.register}
          cta={state ? "Open My State Election Site" : "Register at Vote.gov"}
        />
      </div>
    </Screen>
  );
}
