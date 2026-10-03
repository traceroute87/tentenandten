/* Build shareable URLs (referral code appended only when signed in) and
   route to a channel. The useful voter resource is always the payload;
   the referral is a query param on the app URL. */
import { track } from "../analytics";

export function referralUrl(code?: string, resourceUrl?: string): string {
  const base = (import.meta.env.PROD ? "https://tentenandten.com" : window.location.origin) + "/";
  const u = new URL(base);
  if (code) u.searchParams.set("r", code);
  if (resourceUrl) u.searchParams.set("res", resourceUrl);
  return u.toString();
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    let input: HTMLTextAreaElement | undefined;
    try {
      input = document.createElement("textarea");
      input.value = text;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      input?.remove();
    }
  }
}

type ShareArgs = {
  channel: string;
  title?: string;
  text: string;
  url: string;
  subject?: string;
  onToast?: (msg: string) => void;
};

export async function shareVia({ channel, title, text, url, subject, onToast }: ShareArgs) {
  track("share", { channel });
  const enc = encodeURIComponent;
  const msg = url ? `${text} ${url}` : text;
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
      location.href = `mailto:?subject=${enc(subject ?? "A quick way to get ready to vote")}&body=${enc(msg)}`;
      return;
    case "copy":
      onToast?.(await copyText(msg) ? "Link copied" : "Copy failed");
      return;
    case "share":
    default:
      if (navigator.share) {
        try {
          await navigator.share({ title: title ?? subject ?? "10·10·10", text, url });
        } catch {
          /* user cancelled */
        }
      } else {
        onToast?.(await copyText(msg) ? "Copied — paste it anywhere." : "Could not copy the message.");
      }
  }
}

function open(u: string) {
  window.open(u, "_blank", "noopener,noreferrer");
}
