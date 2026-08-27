import { useEffect, useState } from "react";
import { Screen, TopBar } from "../components/AppShell";
import { Button } from "../components/ui";
import { ShareSheet } from "../components/ShareSheet";
import { useChrome } from "../ui-chrome";
import { useAuth } from "../auth";
import { supabase } from "../lib/supabase";
import { useStore, totalActions, trackDone } from "../store";
import { IcoCheckCircle } from "../lib/icons";

type Community = {
  participants: number;
  actions_completed: number;
  challenges_completed: number;
  verified_referrals: number;
  states_represented: number;
};

const MILES: { id: "reach" | "spread" | "bring"; label: string }[] = [
  { id: "reach", label: "Reach 10" },
  { id: "spread", label: "Spread 10" },
  { id: "bring", label: "Bring 10" },
];

export default function Impact() {
  const { openMenu } = useChrome();
  const { session, configured } = useAuth();
  const [share, setShare] = useState(false);
  const [community, setCommunity] = useState<Community | null>(null);
  const s = useStore((x) => x);
  const total = totalActions(s);
  const allDone = total >= 30;

  useEffect(() => {
    if (!supabase) return;
    supabase.rpc("community_stats").then(({ data }) => data && setCommunity(data as Community));
  }, []);

  const shareMsg = allDone
    ? "I just finished the 10·10·10 challenge — 30 actions to help people vote. Your turn:"
    : `I'm ${total}/30 through the 10·10·10 challenge — helping people get to the polls. Join me:`;

  return (
    <Screen paper header={<TopBar title="Impact" onMenu={openMenu} />}>
      <div className="stack">
        <section>
          <div className="section-label">Your Impact</div>
          <div className="stats">
            <div className="stat">
              <div className="stat__n">{total}/30</div>
              <div className="stat__l">Actions completed</div>
            </div>
            <div className="stat">
              <div className="stat__n">{session ? s.referrals.verified : "—"}</div>
              <div className="stat__l">Verified referrals</div>
            </div>
            <div className="stat">
              <div className="stat__n">{session ? s.referrals.friendsStarted : "—"}</div>
              <div className="stat__l">Friends who started 10·10·10</div>
            </div>
          </div>
          {!session && configured && (
            <p className="note" style={{ marginTop: 8 }}>
              Create an account to earn a referral link and track verified referrals.
            </p>
          )}
        </section>

        <section className="card--paper">
          <div className="section-label">Challenge Progress</div>
          {MILES.map((m) => {
            const done = trackDone(s.challenge[m.id]);
            const n = s.challenge[m.id].count;
            return (
              <div key={m.id} className={`milestone ${done ? "is-complete" : ""}`}>
                <span className="milestone__ico">
                  <IcoCheckCircle width={20} height={20} />
                </span>
                <span className="milestone__name">{m.label}</span>
                <span className="milestone__state">
                  {done ? "Completed" : `${10 - n} to go`}
                </span>
              </div>
            );
          })}
          <div className={`milestone ${allDone ? "is-complete" : ""}`}>
            <span className="milestone__ico">
              <IcoCheckCircle width={20} height={20} />
            </span>
            <span className="milestone__name">10·10·10 Complete</span>
            <span className="milestone__state">{allDone ? "Completed" : `${30 - total} to go`}</span>
          </div>
        </section>

        <Button block onClick={() => setShare(true)}>
          Share My Progress
        </Button>

        <section className="card--paper">
          <div className="section-label">10·10·10 Together</div>
          {community ? (
            <div className="grid-2" style={{ gap: 12 }}>
              <Stat n={community.participants} l="Participants" />
              <Stat n={community.actions_completed} l="Actions completed in-app" />
              <Stat n={community.verified_referrals} l="Verified referrals" />
              <Stat n={community.states_represented} l="States represented" />
            </div>
          ) : (
            <p className="note">
              {configured
                ? "Loading community totals…"
                : "Community totals appear once the backend is connected. We only show numbers we can verify."}
            </p>
          )}
        </section>
      </div>

      <ShareSheet
        open={share}
        onClose={() => setShare(false)}
        title="Share my progress"
        message={shareMsg}
      />
    </Screen>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div className="stat">
      <div className="stat__n">{n.toLocaleString()}</div>
      <div className="stat__l">{l}</div>
    </div>
  );
}
