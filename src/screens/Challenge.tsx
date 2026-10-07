import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppNavigate } from "../lib/navigation";
import { Screen, TopBar } from "../components/AppShell";
import { Button, MarkerDots, Ico, useToast } from "../components/ui";
import { useChrome } from "../ui-chrome";
import {
  useStore,
  completeAction,
  undoLast,
  trackDone,
  totalActions,
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
import { MessagePresetSheet } from "../components/MessagePresetSheet";
import { RidePlanSheet } from "../components/RidePlanSheet";

const TRACKS: TrackId[] = ["reach", "spread", "bring"];

const META: Record<TrackId, { glyph: JSX.Element; title: string; desc: string }> = {
  reach: {
    glyph: <IcoPhone />,
    title: "Reach 10",
    desc: "Call or text 10 people you know and make sure they have a plan to vote.",
  },
  spread: {
    glyph: <IcoMail />,
    title: "Share 10",
    desc: "Send 10 emails or make 10 posts with useful voting information.",
  },
  bring: {
    glyph: <IcoUsers />,
    title: "Bring 10 to the polls",
    desc: "Help 10 people make a voting plan and follow through by casting their ballot.",
  },
};

/* Share: three intent groups instead of 7 identical buttons (§5) */
const SPREAD_GROUPS: { label: string; ids: string[] }[] = [
  { label: "Post / Social", ids: ["facebook", "x", "truth", "share"] },
  { label: "Direct", ids: ["email", "text"] },
];

const SHARE_MSG =
  "Make sure you're ready to vote — check your registration, find your polling place, and make a plan.";

export default function Challenge() {
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [ridePlanOpen, setRidePlanOpen] = useState(false);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const nav = useAppNavigate();
  const params = useParams();
  const { openMenu } = useChrome();
  const toast = useToast();
  const routeTrack = params.track === "share" ? "spread" : params.track;
  const active = (TRACKS.includes(routeTrack as TrackId) ? routeTrack : "reach") as TrackId;

  const s = useStore((x) => x);
  const st = officeFor(s.profile.state);
  const trk = s.challenge[active];
  const done = trackDone(trk);
  const m = META[active];
  const activeLabel = active === "spread" ? "Share" : active === "reach" ? "Reach" : "Bring";
  const total = totalActions(s);
  const referral = referralUrl(s.profile.referralCode, NATIONAL.overview.url);

  function selectTrack(index: number) {
    const track = TRACKS[index];
    if (!track) return;
    tabsRef.current[index]?.focus();
    // Same-page tab switch: no route view transition.
    nav(`/challenge/${track === "spread" ? "share" : track}`, { viewTransition: false });
  }

  function onTrackKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number | undefined;
    if (event.key === "ArrowLeft") next = (index + TRACKS.length - 1) % TRACKS.length;
    if (event.key === "ArrowRight") next = (index + 1) % TRACKS.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = TRACKS.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      selectTrack(next);
    }
  }

  return (
    <Screen paper bodyClassName="screen__body--challenge" header={<TopBar title="Challenge" onMenu={openMenu} />}>
      <div className="tabs tabs--paper" role="tablist">
        {TRACKS.map((t, index) => (
          <button
            key={t}
            ref={(element) => { tabsRef.current[index] = element; }}
            role="tab"
            aria-selected={t === active}
            tabIndex={t === active ? 0 : -1}
            className={`tab ${t === active ? "is-active" : ""}`}
            onClick={() => selectTrack(index)}
            onKeyDown={(event) => onTrackKeyDown(event, index)}
          >
            {t === "spread" ? "Share" : t === "reach" ? "Reach" : "Bring"} 10
          </button>
        ))}
      </div>

      <div className="challenge-layout">
        <div className={`track track--${active}`}>
            <div className="trackhead">
              <span className="trackhead__icon">{m.glyph}</span>
              <span className="track__headline">{m.title}</span>
            </div>
            <div className="track__count">{trk.count}/10</div>
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
                {SPREAD_GROUPS.map((g) => (
                  <div className="chan-group" key={g.label}>
                    <div className="chan-group__label">{g.label}</div>
                    <div className="action-grid">
                      {g.ids.map((id) => {
                        const c = SPREAD_CHANNELS.find((x) => x.id === id);
                        if (!c) return null;
                        return (
                          <button
                            key={c.id}
                            className="chip"
                            aria-label={c.id === "x" ? "X" : c.label}
                            onClick={() => {
                              void shareVia({ channel: c.id, title: "Join my 10·10·10 challenge", text: SHARE_MSG, url: referral, onToast: toast });
                              if (!done) completeAction("spread", c.id);
                            }}
                          >
                            <Ico name={c.icon} /> {c.id !== "x" && c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <Button variant="primary" block disabled={done} onClick={() => completeAction("spread", "manual")}>
                  Mark One Complete
                </Button>
              </div>
            )}

            {active === "bring" && (
              <div className="track__actions">
                <div className="action-grid">
                  {BRING_ACTIONS.map((a) => {
                    if (a.id === "ride") {
                      return (
                        <button key={a.id} type="button" className="chip" onClick={() => setRidePlanOpen(true)}>
                          <Ico name={a.icon} /> {a.label}
                        </button>
                      );
                    }
                    const href =
                      a.id === "register"
                        ? NATIONAL.register.url
                        : a.id === "check"
                          ? NATIONAL.checkStatus.url
                          : st.url;
                    return (
                      <a key={a.id} className="chip" href={href} target="_blank" rel="noopener noreferrer">
                        <Ico name={a.icon} /> {a.label}
                      </a>
                    );
                  })}
                </div>
                <Button variant="primary" block disabled={done} onClick={() => completeAction("bring", "manual")}>
                  Mark One Complete
                </Button>
                <p className="note">Numbered only — 10·10·10 never asks for their name.</p>
              </div>
            )}

            <Button className="challenge-message-preset" variant="ghost" block onClick={() => setMessagesOpen(true)}>
              Choose a message preset
            </Button>
            {done && <div className="track__done">✓ {activeLabel} 10 complete. Nice work.</div>}
        </div>

        {/* desktop-only: compact utility strip in place of the old right rail */}
        <div className="challenge-utility">
          <span>Overall <b>{total}</b>/30</span>
          <span className="challenge-utility__sep" aria-hidden>·</span>
          <a href={NATIONAL.overview.url} target="_blank" rel="noopener noreferrer">
            Useful Resources
          </a>
          <span className="challenge-utility__sep" aria-hidden>·</span>
          <button
            type="button"
            onClick={() => void shareVia({ channel: "share", title: "Join my 10·10·10 challenge", text: SHARE_MSG, url: referral, onToast: toast })}
          >
            Share Challenge
          </button>
        </div>
      </div>
      <MessagePresetSheet open={messagesOpen} onClose={() => setMessagesOpen(false)} />
      <RidePlanSheet open={ridePlanOpen} onClose={() => setRidePlanOpen(false)} />
    </Screen>
  );
}

/* Digits only, keeping a leading +: "+1 (555) 123-4567" -> "+15551234567". */
function sanitizeTel(raw: string): string {
  return raw.trim().replace(/(?!^\+)\D/g, "");
}

function needsIosPhoneField(): boolean {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!ios) return false;
  const standalone = window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const safari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  return safari || standalone;
}

/* Reach: contact picker is progressive enhancement; everything works without it. */
function ReachActions({ onComplete, done }: { onComplete: () => void; done: boolean }) {
  const toast = useToast();
  const ios = needsIosPhoneField();
  const [number, setNumber] = useState("");
  const hasPicker =
    ios && typeof (navigator as any).contacts?.select === "function";
  const tel = sanitizeTel(number);
  const canCall = tel.replace(/\D/g, "").length >= 7;

  /* The picker only fills the number field. Never navigate after it resolves. */
  async function pick() {
    try {
      // @ts-expect-error - Contact Picker API, not in TS lib
      const [c] = await navigator.contacts.select(["tel"], { multiple: false });
      const picked = c?.tel?.[0];
      if (picked) setNumber(picked);
      else toast("No number for that contact");
    } catch {
      /* cancelled / unsupported */
    }
  }

  const already = REACH_ACTIONS.find((a) => a.id === "already")!;

  return (
    <div className="track__actions">
      {ios && (
        <label className="field">
          <span className="field__label">Phone number</span>
          <input
            className="input"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="Phone number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
        </label>
      )}
      <div className="action-grid action-grid--3">
        {REACH_ACTIONS.filter((a) => a.id !== "already").map((a) => {
          if (ios && a.id === "call" && !canCall) {
            return (
              <button key={a.id} type="button" className="chip" disabled>
                <Ico name={a.icon} /> {a.label}
              </button>
            );
          }
          const href =
            a.id === "call" ? (ios ? `tel:${tel}` : "tel:") :
              a.id === "text" ? (ios ? `sms:${tel}` : "sms:") : "mailto:";
          return (
            <a key={a.id} className="chip" href={href}>
              <Ico name={a.icon} /> {a.label}
            </a>
          );
        })}
      </div>
      <button className="chip chip--block" disabled={done} onClick={onComplete}>
        <Ico name={already.icon} /> {already.label}
      </button>
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
