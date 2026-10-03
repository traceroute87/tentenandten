import { Screen, TopBar } from "../components/AppShell";
import { useChrome } from "../ui-chrome";
import { NATIONAL } from "../data";

export default function Trust() {
  const { openMenu } = useChrome();
  return (
    <Screen paper header={<TopBar title="Trust & Sources" onMenu={openMenu} />}>
      <article className="stack">
        <h1 className="h1">Trust &amp; Sources</h1>
        <p>Election resources link to federal government or state election authority pages. Some state links are official resource indexes rather than direct lookup tools.</p>
        <p>Election dates and rules can change. Confirm current information with the linked election authority before making plans.</p>
        <a className="btn btn--primary btn--block" href={NATIONAL.stateLocalOffice.url} target="_blank" rel="noopener noreferrer">Find official election authorities</a>
        <p>10·10·10 does not recommend candidates or parties and does not tell you how to vote.</p>
        <p className="note">10·10·10 was inspired by the voter-turnout “10-10-10 rule” popularized by Dan Bongino: reach out directly, share useful election information, and help others follow through and vote. 10·10·10 is an independent project and is not affiliated with or endorsed by Dan Bongino or his show.</p>
        <h2 className="h2">Privacy</h2>
        <ul>
          <li>We do not store your street address.</li>
          <li>We do not collect candidate or party preferences.</li>
          <li>Your voting method and free-text voting-plan details stay on this device.</li>
          <li>Account sync stores your email, current challenge progress, completed Challenge History, voting checklist, state, reminder settings, and referral information.</li>
          <li>Challenge History may include action counts, dates, and an optional election name/date/jurisdiction. It never includes ballot choices, candidate selections, party preference, voting location/address, or free-text voting-plan details.</li>
        </ul>
      </article>
    </Screen>
  );
}
