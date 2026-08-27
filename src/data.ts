/* Static content: official resources, challenge config, timeline.
   NOT an election-law database — just a curated directory that routes users
   to the authoritative federal/state sources. */

export const LAST_CHECKED = "2026-08-27";
export const ELECTION_DAY = "2026-11-03"; // federal general

export type OfficialSource = { name: string; url: string; lastChecked: string };

export const NATIONAL: Record<string, OfficialSource> = {
  register: {
    name: "U.S. Government — Vote.gov",
    url: "https://vote.gov/",
    lastChecked: LAST_CHECKED,
  },
  overview: {
    name: "USA.gov — Voting and Elections",
    url: "https://www.usa.gov/voting",
    lastChecked: LAST_CHECKED,
  },
  checkStatus: {
    name: "Nat'l Assoc. of Secretaries of State — CanIVote",
    url: "https://www.canivote.org/",
    lastChecked: LAST_CHECKED,
  },
  eac: {
    name: "U.S. Election Assistance Commission",
    url: "https://www.eac.gov/voters",
    lastChecked: LAST_CHECKED,
  },
};

export const STATES: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" }, { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" }, { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" }, { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" }, { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" }, { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" }, { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" }, { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" }, { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

/** Official state election office homepages. Verify + bump lastChecked before each election. */
const S = (name: string, url: string): OfficialSource => ({ name, url, lastChecked: LAST_CHECKED });
export const STATE_ELECTION_OFFICE: Record<string, OfficialSource> = {
  AL: S("Alabama Secretary of State — Alabama Votes", "https://www.sos.alabama.gov/alabama-votes"),
  AK: S("Alaska Division of Elections", "https://www.elections.alaska.gov/"),
  AZ: S("Arizona Secretary of State — Elections", "https://azsos.gov/elections"),
  AR: S("Arkansas Secretary of State — Elections", "https://www.sos.arkansas.gov/elections"),
  CA: S("California Secretary of State — Elections", "https://www.sos.ca.gov/elections"),
  CO: S("Colorado Secretary of State — Elections", "https://www.sos.state.co.us/pubs/elections/"),
  CT: S("Connecticut Secretary of the State — Elections", "https://portal.ct.gov/SOTS/Election-Services/"),
  DE: S("Delaware Department of Elections", "https://elections.delaware.gov/"),
  DC: S("D.C. Board of Elections", "https://dcboe.org/"),
  FL: S("Florida Division of Elections", "https://dos.fl.gov/elections/"),
  GA: S("Georgia Secretary of State — Elections", "https://sos.ga.gov/elections-division-georgia-secretary-states-office"),
  HI: S("Hawaii Office of Elections", "https://elections.hawaii.gov/"),
  ID: S("Idaho Secretary of State — VoteIdaho", "https://voteidaho.gov/"),
  IL: S("Illinois State Board of Elections", "https://www.elections.il.gov/"),
  IN: S("Indiana Secretary of State — Elections", "https://www.in.gov/sos/elections/"),
  IA: S("Iowa Secretary of State — Elections", "https://sos.iowa.gov/elections/voterinformation/index.html"),
  KS: S("Kansas Secretary of State — Elections", "https://sos.ks.gov/elections/elections.html"),
  KY: S("Kentucky State Board of Elections", "https://elect.ky.gov/"),
  LA: S("Louisiana Secretary of State — Elections", "https://www.sos.la.gov/ElectionsAndVoting/"),
  ME: S("Maine Bureau of Corporations, Elections & Commissions", "https://www.maine.gov/sos/cec/elections/"),
  MD: S("Maryland State Board of Elections", "https://elections.maryland.gov/"),
  MA: S("Massachusetts Elections Division", "https://www.sec.state.ma.us/divisions/elections/elections-and-voting.htm"),
  MI: S("Michigan Secretary of State — Elections", "https://www.michigan.gov/sos/elections"),
  MN: S("Minnesota Secretary of State — Elections", "https://www.sos.state.mn.us/elections-voting/"),
  MS: S("Mississippi Secretary of State — Elections", "https://www.sos.ms.gov/elections-voting"),
  MO: S("Missouri Secretary of State — Elections", "https://www.sos.mo.gov/elections"),
  MT: S("Montana Secretary of State — Elections", "https://sosmt.gov/elections/"),
  NE: S("Nebraska Secretary of State — Elections", "https://sos.nebraska.gov/elections"),
  NV: S("Nevada Secretary of State — Elections", "https://www.nvsos.gov/sos/elections"),
  NH: S("New Hampshire Secretary of State — Elections", "https://www.sos.nh.gov/elections"),
  NJ: S("New Jersey Division of Elections", "https://www.nj.gov/state/elections/"),
  NM: S("New Mexico Secretary of State — Voting & Elections", "https://www.sos.nm.gov/voting-and-elections/"),
  NY: S("New York State Board of Elections", "https://elections.ny.gov/"),
  NC: S("North Carolina State Board of Elections", "https://www.ncsbe.gov/"),
  ND: S("North Dakota Secretary of State — Elections", "https://www.sos.nd.gov/elections"),
  OH: S("Ohio Secretary of State — Elections", "https://www.ohiosos.gov/elections/"),
  OK: S("Oklahoma State Election Board", "https://oklahoma.gov/elections.html"),
  OR: S("Oregon Secretary of State — Elections", "https://sos.oregon.gov/voting-elections/Pages/default.aspx"),
  PA: S("Pennsylvania Department of State — Vote.PA", "https://www.vote.pa.gov/"),
  RI: S("Rhode Island Department of State — Elections", "https://vote.sos.ri.gov/"),
  SC: S("South Carolina Election Commission — scVOTES", "https://scvotes.gov/"),
  SD: S("South Dakota Secretary of State — Elections", "https://sdsos.gov/elections-voting/"),
  TN: S("Tennessee Secretary of State — Elections", "https://sos.tn.gov/elections"),
  TX: S("Texas Secretary of State — VoteTexas", "https://www.votetexas.gov/"),
  UT: S("Utah Lt. Governor — Vote.Utah", "https://vote.utah.gov/"),
  VT: S("Vermont Secretary of State — Elections", "https://sos.vermont.gov/elections/"),
  VA: S("Virginia Department of Elections", "https://www.elections.virginia.gov/"),
  WA: S("Washington Secretary of State — Elections", "https://www.sos.wa.gov/elections"),
  WV: S("West Virginia Secretary of State — Elections", "https://sos.wv.gov/elections"),
  WI: S("Wisconsin Elections Commission — MyVote", "https://myvote.wi.gov/"),
  WY: S("Wyoming Secretary of State — Elections", "https://sos.wyo.gov/elections/"),
};

export function officeFor(code?: string): OfficialSource {
  return (code && STATE_ELECTION_OFFICE[code]) || NATIONAL.overview;
}

/* ---------- challenge config ---------- */
export type ActionDef = { id: string; label: string; icon: string };

export const REACH_ACTIONS: ActionDef[] = [
  { id: "call", label: "Call", icon: "phone" },
  { id: "text", label: "Text", icon: "chat" },
  { id: "email", label: "Email", icon: "mail" },
  { id: "already", label: "I already contacted someone", icon: "check" },
];

export const SPREAD_CHANNELS: ActionDef[] = [
  { id: "facebook", label: "Facebook", icon: "facebook" },
  { id: "x", label: "X", icon: "x" },
  { id: "truth", label: "Truth Social", icon: "truth" },
  { id: "share", label: "Share", icon: "share" },
  { id: "text", label: "Text", icon: "chat" },
  { id: "email", label: "Email", icon: "mail" },
  { id: "copy", label: "Copy Link", icon: "copy" },
];

export const BRING_ACTIONS: ActionDef[] = [
  { id: "register", label: "Help Them Register", icon: "edit" },
  { id: "check", label: "Check Registration", icon: "search" },
  { id: "polling", label: "Find Polling Place", icon: "pin" },
  { id: "id", label: "Check ID / What to Bring", icon: "id" },
  { id: "early", label: "Early Voting", icon: "calendar" },
  { id: "mail", label: "Mail Voting", icon: "mail" },
  { id: "ballot", label: "Sample Ballot", icon: "book" },
  { id: "plan", label: "Make a Voting Plan", icon: "check" },
  { id: "ride", label: "Help With a Ride", icon: "car" },
];

/* ---------- voting plan checklist ---------- */
export const VOTING_STEPS: { id: string; label: string; icon: string; source: keyof typeof NATIONAL | "state" }[] = [
  { id: "registration", label: "Check my registration", icon: "search", source: "checkStatus" },
  { id: "method", label: "Decide how I'll vote", icon: "edit", source: "state" },
  { id: "polling", label: "Find my polling place", icon: "pin", source: "state" },
  { id: "id", label: "Check ID / what I need", icon: "id", source: "state" },
  { id: "early", label: "Check early voting", icon: "calendar", source: "state" },
  { id: "mail", label: "Mail / absentee voting", icon: "mail", source: "state" },
  { id: "ballot", label: "View official sample ballot", icon: "book", source: "state" },
  { id: "electionday", label: "Election Day plan", icon: "pin", source: "state" },
];

/* ---------- help needs ---------- */
export const HELP_NEEDS: { id: string; label: string; icon: string; source: keyof typeof NATIONAL | "state"; blurb: string }[] = [
  { id: "register", label: "Register to Vote", icon: "edit", source: "register", blurb: "Register or update your address at the official government site. Takes a few minutes; have your ID or SSN handy." },
  { id: "check", label: "Check Registration", icon: "search", source: "checkStatus", blurb: "Confirm you're registered at your current address before any deadlines." },
  { id: "where", label: "Find Where to Vote", icon: "pin", source: "state", blurb: "Look up your assigned polling place or a nearby early-voting site from your state's official tool." },
  { id: "bring", label: "What They Need to Bring", icon: "id", source: "state", blurb: "ID rules vary by state. Check what counts as acceptable ID where you live." },
  { id: "early", label: "Early Voting", icon: "calendar", source: "state", blurb: "Many states let you vote in person before Election Day. Check dates and locations." },
  { id: "mail", label: "Vote by Mail", icon: "mail", source: "state", blurb: "Request a mail/absentee ballot, and check the return deadline and postmark rules." },
  { id: "ballot", label: "Sample Ballot", icon: "book", source: "state", blurb: "Preview what's on your ballot so voting goes fast." },
  { id: "firsttime", label: "First-Time Voter Help", icon: "star", source: "overview", blurb: "New to voting? Here's the whole process in plain English." },
];

/* ---------- 2026 timeline (generic; state deadlines vary) ---------- */
export type Milestone = { id: string; date: string; label: string; urgent?: boolean };
export const TIMELINE: Milestone[] = [
  { id: "reg-soon", date: "2026-10-05", label: "Registration deadlines are approaching in many states" },
  { id: "early", date: "2026-10-20", label: "Early voting is starting in many states" },
  { id: "eve", date: "2026-11-02", label: "Election Day is tomorrow — finalize your plan", urgent: true },
  { id: "day", date: "2026-11-03", label: "Today is Election Day", urgent: true },
];
