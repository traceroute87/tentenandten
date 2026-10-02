import { useEffect, useMemo, useState } from "react";
import { MESSAGE_PRESETS, renderMessageTemplate, type MessageChannel } from "../data/messagePresets";
import { messageResourceType, nextKnownElection, STATES, votingResource } from "../data";
import { useStore } from "../store";
import { referralUrl, shareVia } from "../lib/share";
import { Button, Sheet, useToast } from "./ui";

const CHANNELS: { id: MessageChannel; label: string }[] = [
  { id: "text", label: "Text" },
  { id: "email", label: "Email" },
  { id: "social", label: "Social post" },
];

export function MessagePresetSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const profile = useStore((s) => s.profile);
  const votingState = useStore((s) => s.voting.state);
  const stateCode = votingState || profile.state;
  const stateName = STATES.find((s) => s.code === stateCode)?.name ?? "your state";
  const election = nextKnownElection();
  const siteLink = referralUrl(profile.referralCode);
  const [channel, setChannel] = useState<MessageChannel>("text");
  const [presetId, setPresetId] = useState("text-friendly");
  const [firstName, setFirstName] = useState("");
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const preset = MESSAGE_PRESETS.find((p) => p.id === presetId) ?? MESSAGE_PRESETS[0];
  const officialLink = votingResource(messageResourceType(preset.id), stateCode).url;
  const values = useMemo(() => ({
    first_name: firstName.trim() ? ` ${firstName.trim()}` : "",
    state: stateName,
    election_date: election ? new Date(`${election.date}T12:00:00`).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "the next known federal election",
    official_link: officialLink,
    site_link: siteLink,
  }), [firstName, stateName, election?.date, officialLink, siteLink]);

  useEffect(() => {
    setBody(renderMessageTemplate(preset.body, values));
    setSubject(renderMessageTemplate(preset.subject ?? "", values));
  }, [preset.id, values]);

  const presets = MESSAGE_PRESETS.filter((p) => p.channel === channel);
  const resourceLink = siteLink;
  const send = (target: string) => {
    const isSocial = ["facebook", "x", "truth", "share"].includes(target);
    const message = isSocial ? body.replace(resourceLink, "").trim() : body;
    void shareVia({ channel: target, title: subject || preset.title, text: message, url: isSocial ? resourceLink : "", subject, onToast: toast });
    if (target !== "copy") onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Message presets">
      <div className="stack-sm message-presets">
        <label className="field">
          <span className="field__label">Send as</span>
          <select className="select" value={channel} onChange={(e) => {
            const next = e.target.value as MessageChannel;
            setChannel(next);
            setPresetId(MESSAGE_PRESETS.find((p) => p.channel === next)!.id);
          }}>
            {CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Choose a preset</span>
          <select className="select" value={preset.id} onChange={(e) => setPresetId(e.target.value)}>
            {presets.map((p) => <option key={p.id} value={p.id}>{p.category} — {p.title}</option>)}
          </select>
        </label>

        <label className="field">
          <span className="field__label">First name (optional)</span>
          <input className="input" aria-label="Recipient first name (optional)" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </label>

        {channel === "email" && (
          <label className="field">
            <span className="field__label">Subject</span>
            <input className="input" aria-label="Email subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </label>
        )}

        <label className="field">
          <span className="field__label">Preview and edit before sending</span>
          <textarea className="input" aria-label="Message preview and editor" rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
        </label>

        {channel === "text" && <Button block onClick={() => send("text")}>Open Text Message</Button>}
        {channel === "email" && <Button block onClick={() => send("email")}>Open Email</Button>}
        {channel === "social" && (
          <div className="message-share-actions">
            {([ ["facebook", "Facebook"], ["x", "X"], ["truth", "Truth Social"], ["copy", "Copy"], ["share", "Share"] ] as const).map(([id, label]) => (
              <Button key={id} size="sm" variant="ghost" onClick={() => send(id)}>{label}</Button>
            ))}
          </div>
        )}
        <p className="note">Official links open outside 10·10·10. Address-specific lookups stay on the official site; this app does not ask for or save a street address.</p>
      </div>
    </Sheet>
  );
}
