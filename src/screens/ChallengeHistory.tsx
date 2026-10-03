import { Screen, TopBar } from "../components/AppShell";
import { useChrome } from "../ui-chrome";
import { useStore } from "../store";
import { sortChallengeHistory } from "../lib/challenge-cycles";

export function ChallengeHistoryList() {
  // Keep the external-store snapshot stable; sort only after reading it.
  const storedHistory = useStore((state) => state.challengeHistory);
  const history = sortChallengeHistory(Array.isArray(storedHistory) ? storedHistory : []);

  return (
    <div className="stack-sm challenge-history__list">
      {history.length ? history.map((item) => {
        const completedDate = item.completedAt && Number.isFinite(Date.parse(item.completedAt))
          ? new Date(item.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
          : null;
        const rawElectionDate = item.electionContext?.electionDate;
        const electionDate = rawElectionDate && Number.isFinite(Date.parse(`${rawElectionDate}T12:00:00`))
          ? new Date(`${rawElectionDate}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
          : null;

        return (
          <article className="card card--paper challenge-history__item" key={item.challengeCycle}>
            <h2>{item.electionContext?.electionName ?? "General turnout challenge"}</h2>
            {completedDate && <p className="note">Completed {completedDate}</p>}
            {(electionDate || item.electionContext?.jurisdiction) && (
              <p className="note">
                {electionDate && <>Election {electionDate}</>}
                {electionDate && item.electionContext?.jurisdiction && " · "}
                {item.electionContext?.jurisdiction}
              </p>
            )}
            <strong className="challenge-history__total">{item.totalActions}/30 actions completed</strong>
            <div className="challenge-history__tracks">
              <span>Reach 10</span><b>{item.reachFinal}/10</b>
              <span>Share 10</span><b>{item.spreadFinal}/10</b>
              <span>Bring 10</span><b>{item.bringFinal}/10</b>
            </div>
          </article>
        );
      }) : <p className="note">Completed 10·10·10 challenges will appear here.</p>}
    </div>
  );
}

export default function ChallengeHistory() {
  const { openMenu } = useChrome();
  return (
    <Screen paper header={<TopBar title="Challenge History" onMenu={openMenu} />}>
      <div className="stack challenge-history">
        <h1 className="h1">Challenge History</h1>
        <ChallengeHistoryList />
      </div>
    </Screen>
  );
}
