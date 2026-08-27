import { useNavigate, useParams } from "react-router-dom";
import { Screen, TopBar } from "../components/AppShell";
import { Button, MarkerDots, Ico, useToast } from "../components/ui";
import { useChrome } from "../ui-chrome";
import {
  useStore,
  completeAction,
  undoLast,
  trackDone,
  type TrackId,
} from "../store";
import {
  REACH_ACTIONS,
  BRING_ACTIONS,
  SPREAD_CHANNELS,
  NATIONAL,
  officeFor,
} from "../data";
import { referralUrl, shareVia } from "../lib/share";
import { IcoPhone, IcoMail, IcoUsers } from "../lib/icons";

const TRACKS: TrackId[] = ["reach", "spread", "bring"];

const META: Record<TrackId, { glyph: JSX.Element; title: string; desc: string }> = {
  reach: {
    glyph: <IcoPhone />,
    title: "Reach 10 people you know",
    desc: "Call or text 10 people in your immediate circle and make sure they have a plan to vote.",
  },
  spread: {
    glyph: <IcoMail />,
    title: "Spread the word 10 times",
    desc: "Send 10 targeted emails or create 10 social posts that share useful election information.",
  },
  bring: {
    glyph: <IcoUsers />,
    title: "Bring 10 to the polls",
    desc: "Help 10 people make a voting plan and actually cast their ballot.",
  },
};

const SHARE_MSG =
  "Make sure you're ready to vote — check your registration, find your polling place, and make a plan.";

export default function Challenge() {
  const nav = useNavigate();
  const params = useParams();
  const { openMenu } = useChrome();
  const toast = useToast();
  const active = (TRACKS.includes(params.track as TrackId) ? params.track : "reach") as TrackId;

  const s = useStore((x) => x);
  const st = officeFor(s.profile.state);
  const trk = s.challenge[active];
  const done = trackDone(trk);
  const m = META[active];
  const referral = referralUrl(s.profile.referralCode, NATIONAL.overview.url);

  return (
    <Screen paper header={<TopBar title="Challenge" onMenu={openMenu} />}>
      <div className="tabs tabs--paper" role="tablist">
        {TRACKS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={t === active}
            className={`tab ${t === active ? "is-active" : ""}`}
            onClick={() => nav(`/challenge/${t}`)}
          >
            {t} 10
          </button>
        ))}
      </div>

      <div className="track">
        <div className="track__badge">{m.glyph}</div>
        <div className="track__count">{trk.count}/10</div>
        <div className="track__headline">{m.title}</div>
        <p className="track__desc">{m.desc}</p>

        <MarkerDots
          trackId={active}
          value={trk.count}
          onUndoLast={() => undoLast(active)}
        />

        {active === "reach" && (
          <ReachActions onComplete={() => completeAction("reach", "manual")} done={done} />
        )}

        {active === "spread" && (
          <div className="track__actions">
            <div className="action-grid">
              {SPREAD_CHANNELS.map((c) => (
                <button
                  key={c.id}
                  className="chip"
                  onClick={() => {
                    void shareVia({ channel: c.id, text: SHARE_MSG, url: referral, onToast: toast });
                    if (!done) completeAction("spread", c.id);
                  }}
                >
                  <Ico name={c.icon} /> {c.label}
                </button>
              ))}
            </div>
            <Button variant="ghost-dark" block disabled={done} onClick={() => completeAction("spread", "manual")}>
              Mark One Complete
            </Button>
          </div>
        )}

        {active === "bring" && (
          <div className="track__actions">
            <div className="action-grid">
              {BRING_ACTIONS.map((a) => {
                const href =
                  a.id === "register"
                    ? NATIONAL.register.url
                    : a.id === "check"
                      ? NATIONAL.checkStatus.url
                      : a.id === "ride"
                        ? undefined
                        : st.url;
                return href ? (
                  <a key={a.id} className="chip" href={href} target="_blank" rel="noopener noreferrer">
                    <Ico name={a.icon} /> {a.label}
                  </a>
                ) : (
                  <span key={a.id} className="chip">
                    <Ico name={a.icon} /> {a.label}
                  </span>
                );
              })}
            </div>
            <Button variant="primary" block disabled={done} onClick={() => completeAction("bring", "manual")}>
              Mark One Complete
            </Button>
            <p className="note">Numbered only — 10·10·10 never asks for their name.</p>
          </div>
        )}

        {done && <div className="track__done">✓ {active} 10 complete. Nice work.</div>}
      </div>
    </Screen>
  );
}

/* Reach: contact picker is progressive enhancement; everything works without it. */
function ReachActions({ onComplete, done }: { onComplete: () => void; done: boolean }) {
  const toast = useToast();
  const hasPicker =
    "contacts" in navigator && typeof (navigator as any).contacts?.select === "function";

  async function pick() {
    try {
      // @ts-expect-error - Contact Picker API, not in TS lib
      const [c] = await navigator.contacts.select(["tel", "name"], { multiple: false });
      const tel = c?.tel?.[0];
      if (tel) location.href = `tel:${tel}`;
      else toast("No number for that contact");
    } catch {
      /* cancelled / unsupported */
    }
  }

  return (
    <div className="track__actions">
      <div className="action-grid">
        {REACH_ACTIONS.map((a) => {
          if (a.id === "already") {
            return (
              <button key={a.id} className="chip" disabled={done} onClick={onComplete}>
                <Ico name={a.icon} /> {a.label}
              </button>
            );
          }
          const href =
            a.id === "call" ? "tel:" : a.id === "text" ? "sms:" : "mailto:";
          return (
            <a key={a.id} className="chip" href={href}>
              <Ico name={a.icon} /> {a.label}
            </a>
          );
        })}
      </div>
      {hasPicker && (
        <Button variant="solid-navy" block onClick={pick}>
          Choose Contact
        </Button>
      )}
      <Button variant="primary" block disabled={done} onClick={onComplete}>
        Mark One Complete
      </Button>
    </div>
  );
}
