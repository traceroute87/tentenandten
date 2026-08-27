import { Sheet, Ico, useToast } from "./ui";
import { useStore } from "../store";
import { referralUrl, shareVia } from "../lib/share";
import { SPREAD_CHANNELS } from "../data";

/** Reusable share tray. The voter resource is the payload; the referral code
    rides along only when the user is signed in. */
export function ShareSheet({
  open,
  onClose,
  title = "Share",
  message,
  resourceUrl,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  resourceUrl?: string;
}) {
  const code = useStore((s) => s.profile.referralCode);
  const toast = useToast();
  const url = referralUrl(code, resourceUrl);

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {resourceUrl && (
        <p className="note" style={{ marginBottom: 10 }}>
          Sends the official voter resource first{code ? " · your referral link is included" : ""}.
        </p>
      )}
      <div className="share-grid">
        {SPREAD_CHANNELS.map((c) => (
          <button
            key={c.id}
            className="share-btn"
            onClick={() => {
              void shareVia({ channel: c.id, text: message, url, onToast: toast });
              if (c.id !== "copy") onClose();
            }}
          >
            <Ico name={c.icon} />
            {c.label}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
