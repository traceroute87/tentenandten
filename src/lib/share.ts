/* Build shareable URLs (referral code appended only when signed in) and
   route to a channel. The useful voter resource is always the payload;
   the referral is a query param on the app URL. */
import { track } from "../analytics";

export function referralUrl(code?: string, resourceUrl?: string): string {
  const base = window.location.origin + "/";
  const u = new URL(base);
  if (code) u.searchParams.set("r", code);
  if (resourceUrl) u.searchParams.set("res", resourceUrl);
  return u.toString();
}

type ShareArgs = {
  channel: string;
  text: string;
  url: string;
  onToast?: (msg: string) => void;
};

export async function shareVia({ channel, text, url, onToast }: ShareArgs) {
  track("share", { channel });
  const enc = encodeURIComponent;
  const msg = `${text} ${url}`;
  switch (channel) {
    case "facebook":
      open(`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}&quote=${enc(text)}`);
      return;
    case "x":
      open(`https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`);
      return;
    case "truth":
      open(`https://truthsocial.com/share?title=${enc(text)}&url=${enc(url)}`);
      return;
    case "text":
      location.href = `sms:?&body=${enc(msg)}`;
      return;
    case "email":
      location.href = `mailto:?subject=${enc("A quick way to get ready to vote")}&body=${enc(msg)}`;
      return;
    case "copy":
      try {
        await navigator.clipboard.writeText(msg);
        onToast?.("Link copied");
      } catch {
        onToast?.("Copy failed — long-press the link");
      }
      return;
    case "share":
    default:
      if (navigator.share) {
        try {
          await navigator.share({ text, url });
        } catch {
          /* user cancelled */
        }
      } else {
        try {
          await navigator.clipboard.writeText(msg);
          onToast?.("Link copied");
        } catch {
          onToast?.("Sharing not supported here");
        }
      }
  }
}

function open(u: string) {
  window.open(u, "_blank", "noopener,noreferrer");
}
