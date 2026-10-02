import { ELECTION_TYPE_LABELS, electionCardData, nextKnownElection } from "../data";
import { downloadCalendar } from "../lib/calendar";
import { useToast } from "./ui";

export function UpcomingElections({ stateCode }: { stateCode?: string }) {
  const toast = useToast();
  const election = nextKnownElection();
  const card = election ? electionCardData(election, stateCode) : null;
  const date = election
    ? new Date(`${election.date}T12:00:00`).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
    : "";
  return (
    <section className="elections-section" id="upcoming-elections">
      <div className="section-label">Upcoming Elections</div>
      <p className="muted" style={{ fontSize: 13 }}>
        This calendar lists known federal elections only. State and local dates vary; use official resources to check elections in your area.
      </p>
      {election && card ? (
          <article className="vgroup election-card" key={election.id}>
            <div className="resource__flag">Official source</div>
            <h2 className="h2">{election.name}</h2>
            <div className="election-card__meta"><b>{date}</b><span>{ELECTION_TYPE_LABELS[election.type]}</span><span>{election.scope}</span></div>
            <button className="btn btn--ghost btn--block" onClick={() => {
              if (!downloadCalendar(election.name, election.date, election.source.url)) toast("Calendar download is not supported in this browser.");
            }}>Add to Calendar</button>
            {election.registrationDeadline && <p>Registration deadline: {election.registrationDeadline}</p>}
            {card.resources.length > 0 && <div className="election-resources">
              {card.resources.map(({ type, label, source }) => (
                <a key={type} className="election-resource" href={source.url} target="_blank" rel="noopener noreferrer">
                  <span>{label}</span><small>{source.name}</small>
                </a>
              ))}
            </div>}
            <p className="note">For polling-place or ballot lookups, the official site may ask for your residential address. Enter it there; 10·10·10 does not collect it.</p>
          </article>
      ) : (
        <div className="vgroup">
          <p>No upcoming election date is listed here yet.</p>
        </div>
      )}
      <div className="vgroup">
        <h2 className="h2">Check elections in your area</h2>
        <p>State, local, primary, special, and runoff elections may occur sooner.</p>
        {stateCode ? (
          <p>Use the state/local election dates and election office resources above for official information.</p>
        ) : (
          <>
            <p role="status">Select your state above to open official state and local election resources.</p>
            <button className="btn btn--primary btn--block" onClick={() => {
              const stateSelect = document.getElementById("voting-state") as HTMLSelectElement | null;
              stateSelect?.scrollIntoView({ behavior: "smooth", block: "center" });
              stateSelect?.focus();
            }}>
              Select a state to find official elections
            </button>
          </>
        )}
      </div>
    </section>
  );
}
