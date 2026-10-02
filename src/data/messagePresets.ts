export type MessageChannel = "text" | "email" | "social";
export type MessageCategory = "Friendly" | "Quick Reminder" | "Voting Info" | "10·10·10 Challenge";
export type MessagePreset = {
  id: string;
  channel: MessageChannel;
  category: MessageCategory;
  title: string;
  subject?: string;
  body: string;
};

export const MESSAGE_PRESETS: readonly MessagePreset[] = [
  { id: "text-friendly", channel: "text", category: "Friendly", title: "Check in", body: "Hey{first_name} — have you made your voting plan yet? You can check registration, polling info, and deadlines here: {official_link}" },
  { id: "text-reminder", channel: "text", category: "Quick Reminder", title: "Election reminder", body: "Quick reminder: the next known federal election is {election_date}. Want me to help you figure out where and when to vote?" },
  { id: "text-info", channel: "text", category: "Voting Info", title: "Official voting information", body: "Here are the official resources for registration, early voting, mail voting, and polling locations: {official_link}" },
  { id: "text-challenge", channel: "text", category: "10·10·10 Challenge", title: "Share the challenge", body: "I'm doing the 10·10·10 challenge: Reach 10. Share 10. Bring 10. Do you have a plan to vote? {site_link}" },
  { id: "email-friendly", channel: "email", category: "Friendly", title: "Offer help", subject: "Need help getting ready to vote?", body: "If you haven't made a plan yet, I can help you find the official information you need." },
  { id: "email-reminder", channel: "email", category: "Quick Reminder", title: "Make your voting plan", subject: "Make your voting plan", body: "Just checking in before {election_date}. You can verify your registration, find voting information, and review your ballot here: {official_link}" },
  { id: "email-info", channel: "email", category: "Voting Info", title: "Official resources for your state", subject: "Voting info for {state}", body: "Here are the official resources for registration, early voting, mail voting, and polling locations: {official_link}" },
  { id: "email-challenge", channel: "email", category: "10·10·10 Challenge", title: "Share the challenge", subject: "Join my 10·10·10 challenge", body: "I'm doing the 10·10·10 challenge: Reach 10. Share 10. Bring 10. Make your voting plan here: {site_link}" },
  { id: "social-friendly", channel: "social", category: "Friendly", title: "Help someone get ready", body: "Know someone who hasn't made a voting plan yet? Send them the official info and help them get ready: {site_link}" },
  { id: "social-reminder", channel: "social", category: "Quick Reminder", title: "Election reminder", body: "Election coming up? Check your registration, find your voting location, and make a plan: {official_link}" },
  { id: "social-info", channel: "social", category: "Voting Info", title: "Share official voting info", body: "Check registration, early/mail voting details, and your official ballot information here: {official_link}" },
  { id: "social-challenge", channel: "social", category: "10·10·10 Challenge", title: "Share the challenge", body: "I'm doing the 10·10·10 challenge: Reach 10. Share 10. Bring 10. Make your voting plan here: {site_link}" },
];

export type MessageValues = {
  first_name?: string;
  state?: string;
  election_date?: string;
  official_link?: string;
  site_link?: string;
};

export function renderMessageTemplate(template: string, values: MessageValues): string {
  return template.replace(/\{(first_name|state|election_date|official_link|site_link)\}/g, (_, key: keyof MessageValues) => values[key] ?? "");
}
