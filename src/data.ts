/* Static content: official resources, challenge config, timeline.
   NOT an election-law database — just a curated directory that routes users
   to the authoritative federal/state sources. */

export const ELECTION_DAY = "2026-11-03"; // federal general

export type OfficialSource = { name: string; url: string };

export const NATIONAL: Record<string, OfficialSource> = {
  register: {
    name: "U.S. Government — Vote.gov",
    url: "https://vote.gov/register",
  },
  overview: {
    name: "USA.gov — Voting and Elections",
    url: "https://www.usa.gov/voting",
  },
  checkStatus: {
    name: "U.S. Government — Vote.gov registration and status selector",
    url: "https://vote.gov/register",
  },
  eac: {
    name: "U.S. Election Assistance Commission",
    url: "https://www.eac.gov/voters",
  },
  electionDates: {
    name: "USA.gov — When to Vote",
    url: "https://www.usa.gov/when-to-vote",
  },
  stateLocalOffice: {
    name: "USA.gov — State and Local Election Offices",
    url: "https://www.usa.gov/state-election-office",
  },
  pollingPlace: {
    name: "USA.gov — Find Your Polling Place",
    url: "https://www.usa.gov/find-polling-place",
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

/** Official state election resource indexes, used when no verified direct tool is configured. */
const S = (name: string, url: string): OfficialSource => ({ name, url });
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

export type VotingResourceType =
  | "electionDates"
  | "registration"
  | "earlyVoting"
  | "absentee"
  | "ballot"
  | "pollingPlace"
  | "whatToBring"
  | "electionOffice";

export const NATIONAL_VOTING_RESOURCES: Record<VotingResourceType, OfficialSource> = {
  electionDates: NATIONAL.electionDates,
  registration: NATIONAL.register,
  earlyVoting: { name: "USA.gov — Early in-person voting", url: "https://www.usa.gov/early-voting" },
  absentee: { name: "USA.gov — Absentee voting and voting by mail", url: "https://www.usa.gov/absentee-voting" },
  ballot: { name: "USA.gov — Sample ballots and voter guides", url: "https://www.usa.gov/who-you-can-vote-for" },
  pollingPlace: NATIONAL.pollingPlace,
  whatToBring: NATIONAL.eac,
  electionOffice: NATIONAL.stateLocalOffice,
};

const VERIFIED_DATE = "2026-10-02";
const direct = (name: string, url: string, validationSource: string): VotingResource => ({ name, url, status: "direct", verifiedDate: VERIFIED_DATE, validationSource });
const fallback = (name: string, url: string, validationSource: string, verifiedDate = ""): VotingResource => ({ name, url, status: "state-fallback", verifiedDate, validationSource });

/** Only direct state resource URLs verified for that specific function belong here. */
const CURATED_STATE_RESOURCE_OVERRIDES: Partial<Record<string, Partial<Record<VotingResourceType, OfficialSource>>>> = {
  OH: {
    registration: direct("Ohio Voter Search — registration status", "https://voterlookup.ohiosos.gov/VoterLookup.aspx", "https://www.ohiosos.gov/directories/county-boards-of-elections"),
    ballot: direct("Ohio Secretary of State — Sample Ballot Directory", "https://www.ohiosos.gov/directories/sample-ballot", "https://www.ohiosos.gov/elections"),
    pollingPlace: direct("Ohio Voter Search — polling location", "https://voterlookup.ohiosos.gov/VoterLookup.aspx", "https://www.ohiosos.gov/directories/county-boards-of-elections"),
    whatToBring: direct("Ohio Secretary of State — Voter ID requirements", "https://www.ohiosos.gov/elections/voter-ID-requirements", "https://www.ohiosos.gov/elections"),
    electionOffice: direct("Ohio County Boards of Elections Directory", "https://www.ohiosos.gov/directories/county-boards-of-elections", "https://www.ohiosos.gov/elections"),
  },
  OK: {
    electionDates: direct("Oklahoma State Election Board — Next Election", "https://www.oklahoma.gov/elections/elections-results/next-election.html", "https://www.oklahoma.gov/elections.html"),
    registration: fallback("Oklahoma OK Voter Portal — verified registration, status, and voter tools", "https://www.oklahoma.gov/elections/ovp.html", "https://www.oklahoma.gov/elections/ovp.html"),
    earlyVoting: direct("Oklahoma — In-person absentee (early) voting", "https://www.oklahoma.gov/elections/voters/early-voting.html", "https://www.oklahoma.gov/elections/ovp.html"),
    absentee: direct("Oklahoma State Election Board — Absentee Voting", "https://www.oklahoma.gov/elections/voters/absentee-voting.html", "https://www.oklahoma.gov/elections/ovp.html"),
    ballot: fallback("Oklahoma OK Voter Portal — sample ballot access", "https://www.oklahoma.gov/elections/ovp.html", "https://www.oklahoma.gov/elections/ovp.html"),
    pollingPlace: fallback("Oklahoma OK Voter Portal — polling and early voting lookup access", "https://www.oklahoma.gov/elections/ovp.html", "https://www.oklahoma.gov/elections/ovp.html"),
    whatToBring: direct("Oklahoma State Election Board — Proof of Identity", "https://www.oklahoma.gov/elections/voters/proof-of-identity.html", "https://www.oklahoma.gov/elections/ovp.html"),
    electionOffice: direct("Oklahoma County Election Board directory", "https://www.oklahoma.gov/elections/about-us/county-election-boards.html", "https://www.oklahoma.gov/elections.html"),
  },
  OR: {
    electionDates: direct("Oregon Secretary of State — 2026 Election Dates and Deadlines", "https://sos.oregon.gov/elections/pages/election-dates.aspx", "https://sos.oregon.gov/elections/pages/election-dates.aspx"),
    registration: fallback("Oregon — My Vote registration lookup linked by the Secretary of State", "https://sos.oregon.gov/elections/Pages/voteinor.aspx", "https://sos.oregon.gov/elections/Pages/voteinor.aspx"),
    earlyVoting: fallback("Oregon — all-mail voting; no statewide in-person early-voting period", "https://sos.oregon.gov/elections/Pages/voteinor.aspx", "https://sos.oregon.gov/elections/Pages/voteinor.aspx"),
    absentee: fallback("Oregon — vote-by-mail and absentee information", "https://sos.oregon.gov/elections/Pages/voteinor.aspx", "https://sos.oregon.gov/elections/Pages/voteinor.aspx"),
    ballot: fallback("Oregon — My Vote personalized ballot lookup linked by the Secretary of State", "https://sos.oregon.gov/elections/Pages/voteinor.aspx", "https://sos.oregon.gov/elections/pages/current-election.aspx"),
    pollingPlace: fallback("Oregon — all-mail elections; use the official drop-box locator", "https://sos.oregon.gov/elections/Pages/drop-box-locator.aspx", "https://sos.oregon.gov/elections/pages/current-election.aspx"),
    electionOffice: direct("Oregon County Elections Officials Directory", "https://sos.oregon.gov/elections/Pages/county-officials.aspx", "https://sos.oregon.gov/elections/Pages/election-information.aspx"),
  },
  PA: {
    electionDates: direct("Pennsylvania Department of State — Upcoming Elections", "https://www.pa.gov/agencies/vote/elections/upcoming-elections", "https://www.pa.gov/agencies/vote"),
    registration: fallback("Pennsylvania — voter registration status tool linked from the state registration page", "https://www.pa.gov/agencies/vote/voter-registration", "https://www.pa.gov/agencies/vote/voter-registration"),
    earlyVoting: direct("Pennsylvania — vote in person by mail ballot before Election Day", "https://www.pa.gov/agencies/vote/voter-support/mail-in-and-absentee-ballot/mail-ballot-before-election-day", "https://www.pa.gov/agencies/vote"),
    absentee: direct("Pennsylvania Department of State — Mail-in and Absentee Ballot", "https://www.pa.gov/agencies/vote/voter-support/mail-in-and-absentee-ballot", "https://www.pa.gov/agencies/vote"),
    ballot: fallback("Pennsylvania official voter information and county-issued ballot links", "https://www.pa.gov/agencies/vote", "https://www.pa.gov/agencies/vote"),
    pollingPlace: direct("Pennsylvania — Find your local polling place", "https://www.pa.gov/services/vote/find-your-local-polling-place", "https://www.pa.gov/agencies/vote"),
    whatToBring: direct("Pennsylvania — ID requirements at the polling place", "https://www.pa.gov/services/vote/find-your-local-polling-place", "https://www.pa.gov/agencies/vote"),
    electionOffice: direct("Pennsylvania County Election Officials Directory", "https://www.pa.gov/agencies/vote/contact-us/contact-your-election-officials", "https://www.pa.gov/agencies/vote"),
  },
  RI: {
    registration: fallback("Rhode Island — Voter Information Center registration status and update", "https://vote.sos.ri.gov/", "https://vote.sos.ri.gov/"),
    earlyVoting: fallback("Rhode Island — voter center with early voting information", "https://vote.sos.ri.gov/", "https://vote.sos.ri.gov/"),
    absentee: fallback("Rhode Island — voter center with mail ballot request", "https://vote.sos.ri.gov/", "https://vote.sos.ri.gov/"),
    ballot: direct("Rhode Island Voter Information Center — Sample Ballot lookup", "https://vote.sos.ri.gov/Home/PollingPlaces", "https://vote.sos.ri.gov/"),
    pollingPlace: direct("Rhode Island Voter Information Center — Polling Place lookup", "https://vote.sos.ri.gov/Home/PollingPlaces", "https://vote.sos.ri.gov/"),
    whatToBring: direct("Rhode Island — Vote on Election Day and valid photo ID", "https://vote.sos.ri.gov/Voter/VoteatthePolls", "https://vote.sos.ri.gov/"),
    electionOffice: direct("Rhode Island Local Boards of Canvassers Directory", "https://vote.sos.ri.gov/Elections/LocalBoards", "https://vote.sos.ri.gov/"),
  },
  SD: {
    electionDates: direct("South Dakota — 2026 Election Information", "https://sdsos.gov/elections-voting/upcoming-elections/general-information/", "https://www.sdsos.gov/elections-voting/default.aspx"),
    registration: direct("South Dakota Voter Information Portal — registration check", "https://vip.sdsos.gov/VIPLogin.aspx", "https://www.sdsos.gov/elections-voting/voting/register-to-vote/"),
    earlyVoting: direct("South Dakota Secretary of State — In-person absentee voting", "https://sdsos.gov/elections-voting/voting/absentee-voting.aspx", "https://www.sdsos.gov/elections-voting/voting/absentee-voting.aspx"),
    absentee: direct("South Dakota Secretary of State — Absentee Voting", "https://sdsos.gov/elections-voting/voting/absentee-voting.aspx", "https://www.sdsos.gov/elections-voting/default.aspx"),
    ballot: direct("South Dakota Voter Information Portal — sample ballot", "https://vip.sdsos.gov/VIPLogin.aspx", "https://www.sdsos.gov/elections-voting/voting/register-to-vote/"),
    pollingPlace: direct("South Dakota Voter Information Portal — polling place lookup", "https://vip.sdsos.gov/VIPLogin.aspx", "https://sdsos.gov/elections-voting/voting/where-do-i-vote.aspx"),
    whatToBring: direct("South Dakota — voter ID and voting information", "https://www.sdsos.gov/elections-voting/voting/default.aspx", "https://www.sdsos.gov/elections-voting/default.aspx"),
    electionOffice: direct("South Dakota County Auditor Contact List", "https://vip.sdsos.gov/CountyAuditors.aspx", "https://sdsos.gov/elections-voting/voting/absentee-voting.aspx"),
  },
  SC: {
    registration: direct("South Carolina MySCVotes — registration lookup", "https://vrems.scvotes.sc.gov/Voter/Login?PageMode=VoterInformation", "https://scvotes.gov/voters/"),
    earlyVoting: direct("South Carolina Election Commission — 2026 Early Voting", "https://scvotes.gov/voters/early-voting/", "https://scvotes.gov/voters/"),
    absentee: direct("South Carolina Election Commission — Absentee Voting", "https://scvotes.gov/voters/absentee-voting/", "https://scvotes.gov/voters/"),
    ballot: direct("South Carolina MySCVotes — personalized sample ballot", "https://vrems.scvotes.sc.gov/Voter/Login?PageMode=Sampleballot", "https://scvotes.gov/voters/"),
    pollingPlace: direct("South Carolina MySCVotes — polling place lookup", "https://vrems.scvotes.sc.gov/Voter/Login?PageMode=PollingPlace", "https://scvotes.gov/voters/"),
    whatToBring: direct("South Carolina Election Commission — Voter ID requirements", "https://scvotes.gov/voters/how-to-vote/", "https://scvotes.gov/voters/"),
    electionOffice: direct("South Carolina County Voter Registration & Election Offices", "https://scvotes.gov/contact/county-voter-registration-election-offices/", "https://scvotes.gov/voters/"),
    electionDates: fallback("South Carolina Election Commission — Upcoming Elections", "https://scvotes.gov/", "https://scvotes.gov/"),
  },
  TN: {
    registration: direct("Tennessee Voter Registration Lookup", "https://tnmap.tn.gov/voterlookup/", "https://sos.tn.gov/elections"),
    earlyVoting: direct("Tennessee GoVoteTN - early voting locations", "https://web.go-vote-tn.elections.tn.gov/options", "https://sos.tn.gov/elections/services/download-the-govotetn-app"),
    whatToBring: fallback("Tennessee Secretary of State - Voter ID information", "https://sos.tn.gov/elections", "https://sos.tn.gov/elections"),
    ballot: direct("Tennessee GoVoteTN - sample ballot information", "https://web.go-vote-tn.elections.tn.gov/options", "https://sos.tn.gov/elections/services/download-the-govotetn-app"),
    absentee: fallback("Tennessee Secretary of State - absentee voting information", "https://sos.tn.gov/elections", "https://sos.tn.gov/elections"),
    electionDates: fallback("Tennessee Secretary of State - election calendar", "https://sos.tn.gov/elections", "https://sos.tn.gov/elections"),
    pollingPlace: direct("Tennessee GoVoteTN - polling location lookup", "https://web.go-vote-tn.elections.tn.gov/options", "https://sos.tn.gov/elections/services/download-the-govotetn-app"),
    electionOffice: direct("Tennessee GoVoteTN - county election commission information", "https://web.go-vote-tn.elections.tn.gov/options", "https://sos.tn.gov/elections/services/download-the-govotetn-app"),
  },  TX: {
    electionDates: direct("Texas Secretary of State — 2026 November General Election", "https://www.sos.texas.gov/elections/laws/2026-november-general-election.shtml", "https://www.sos.texas.gov/elections/"),
    earlyVoting: direct("VoteTexas — Early Voting", "https://www.votetexas.gov/voting/early-voting.html", "https://www.votetexas.gov/"),
    absentee: direct("VoteTexas — Application for Ballot by Mail", "https://www.votetexas.gov/voting-by-mail/application-for-ballot-by-mail.html", "https://www.votetexas.gov/"),
    pollingPlace: direct("VoteTexas — Find Your Polling Place", "https://www.votetexas.gov/voting/where.html", "https://www.votetexas.gov/"),
    whatToBring: direct("VoteTexas — Voter ID", "https://www.votetexas.gov/voting/need-id.html", "https://www.votetexas.gov/"),
    electionOffice: direct("Texas County Voter Registration Officials Directory", "https://www.sos.texas.gov/elections/voter/votregduties.shtml", "https://www.sos.texas.gov/elections/voter/reqvr.shtml"),
    registration: fallback("Texas Secretary of State — Check registration status through the official voter portal", "https://www.sos.texas.gov/elections/voter/reqvr.shtml", "https://www.votetexas.gov/"),
    ballot: fallback("Texas — county-issued sample ballot lookup information", "https://www.sos.texas.gov/elections/laws/2026-november-general-election.shtml", "https://www.sos.texas.gov/elections/laws/2026-november-general-election.shtml"),
  },
  UT: {
    electionDates: direct("Utah Lieutenant Governor — Current Election Information", "https://vote.utah.gov/current-election-information/", "https://vote.utah.gov/"),
    registration: direct("Utah Voter Search — voter information", "https://votesearch.utah.gov/voter-search/search/search-by-voter/voter-info", "https://vote.utah.gov/current-election-information/"),
    earlyVoting: fallback("Utah — county-administered early voting information", "https://vote.utah.gov/current-election-information/", "https://vote.utah.gov/current-election-information/"),
    absentee: direct("Utah — Track My Ballot", "https://vote.utah.gov/track-my-ballot/", "https://vote.utah.gov/current-election-information/"),
    ballot: fallback("Utah — county-specific ballot information", "https://vote.utah.gov/current-election-information/", "https://vote.utah.gov/current-election-information/"),
    pollingPlace: fallback("Utah — county election officials provide voting locations", "https://vote.utah.gov/contact-your-county-election-officials/", "https://vote.utah.gov/"),
    whatToBring: direct("Utah — Voter ID requirements", "https://vote.utah.gov/voter-id-requirements/", "https://vote.utah.gov/"),
    electionOffice: direct("Utah County Election Officials Directory", "https://vote.utah.gov/contact-your-county-election-officials/", "https://vote.utah.gov/"),
  },
  VT: {
    electionDates: direct("Vermont Secretary of State - Elections Calendar", "https://sos.vermont.gov/elections/elections-calendar", "https://sos.vermont.gov/elections/town-clerks/election-procedures"),
    registration: direct("Vermont Voter Portal - registration status and registration", "https://vote.vermont.gov", "https://sos.vermont.gov/elections/voters/registration"),
    earlyVoting: direct("Vermont Secretary of State - Early & Absentee Voting", "https://sos.vermont.gov/elections/voters/early-absentee-voting", "https://sos.vermont.gov/elections/voters/early-absentee-voting"),
    absentee: direct("Vermont Secretary of State - Early & Absentee Voting", "https://sos.vermont.gov/elections/voters/early-absentee-voting", "https://sos.vermont.gov/elections/voters/early-absentee-voting"),
    ballot: direct("Vermont Voter Portal - personalized sample ballot and voter guide", "https://vote.vermont.gov", "https://sos.vermont.gov/elections/voters"),
    pollingPlace: direct("Vermont Secretary of State - Polling Location Information", "https://sos.vermont.gov/elections/voters/polling-places", "https://sos.vermont.gov/elections/voters/polling-places"),
    whatToBring: direct("Vermont Secretary of State - Election Day ID FAQs", "https://sos.vermont.gov/elections/voters/voter-faqs", "https://sos.vermont.gov/elections/voters/voter-faqs"),
    electionOffice: direct("Vermont Secretary of State - Town Clerks & Election Workers directory", "https://sos.vermont.gov/elections/town-clerks", "https://sos.vermont.gov/elections/town-clerks"),
  },
  VA: {
    electionDates: direct("Virginia Department of Elections — Election Dates and Deadlines", "https://www.elections.virginia.gov/casting-a-ballot/calendars-schedules/", "https://www.elections.virginia.gov/"),
    registration: direct("Virginia Citizen Portal — Check Registration Status", "https://vote.elections.virginia.gov/VoterInformation/Lookup/status", "https://www.elections.virginia.gov/"),
    earlyVoting: direct("Virginia Department of Elections — Early Voting", "https://www.elections.virginia.gov/casting-a-ballot/early-absentee/", "https://www.elections.virginia.gov/"),
    absentee: direct("Virginia Citizen Portal — Absentee Ballot Lookup", "https://vote.elections.virginia.gov/VoterInformation/Lookup/absentee", "https://www.elections.virginia.gov/"),
    ballot: direct("Virginia Polling Place Lookup — personalized ballot information", "https://www.elections.virginia.gov/casting-a-ballot/polling-place-lookup/", "https://www.elections.virginia.gov/"),
    pollingPlace: direct("Virginia Citizen Portal — Polling Place Lookup", "https://vote.elections.virginia.gov/VoterInformation/Lookup/polling", "https://www.elections.virginia.gov/"),
    whatToBring: direct("Virginia Department of Elections — Voter ID", "https://www.elections.virginia.gov/registration/voterid/", "https://www.elections.virginia.gov/"),
    electionOffice: direct("Virginia Local Registrar Lookup", "https://vote.elections.virginia.gov/VoterInformation/PublicContactLookup", "https://www.elections.virginia.gov/"),
  },
  WA: {
    electionDates: direct("Washington Secretary of State — Election Dates and Deadlines", "https://www.sos.wa.gov/elections", "https://www.sos.wa.gov/elections"),
    registration: direct("Washington VoteWA Voter Portal", "https://voter.votewa.gov/", "https://www.sos.wa.gov/elections"),
    earlyVoting: fallback("Washington — all-mail voting; county voting centers provide in-person assistance", "https://www.sos.wa.gov/elections/voters/helpful-information/frequently-asked-questions-voting-mail", "https://www.sos.wa.gov/elections"),
    absentee: direct("Washington Secretary of State — Vote-by-Mail", "https://www.sos.wa.gov/elections/voters/helpful-information/frequently-asked-questions-voting-mail", "https://www.sos.wa.gov/elections"),
    ballot: direct("Washington VoteWA Voter Portal — personalized ballot and voter guide", "https://voter.votewa.gov/", "https://www.sos.wa.gov/elections"),
    pollingPlace: fallback("Washington — locate county voting centers and ballot drop boxes", "https://www.sos.wa.gov/vi/node/6011", "https://www.sos.wa.gov/elections"),
    whatToBring: fallback("Washington — all-mail voting; review official voter information", "https://www.sos.wa.gov/elections", "https://www.sos.wa.gov/elections"),
    electionOffice: direct("Washington County Elections Offices Directory", "https://www.sos.wa.gov/elections/voters/voter-registration/county-elections-offices", "https://www.sos.wa.gov/elections"),
  },
  WI: {
    registration: direct("Wisconsin MyVote — registration status", "https://myvote.wi.gov/My-Voter-Info", "https://myvote.wi.gov/My-Voter-Info"),
    electionDates: direct("Wisconsin MyVote - 2026 election deadlines", "https://myvote.wi.gov/en-us/Voter-Deadlines", "https://myvote.wi.gov/en-us/Voter-Deadlines"),
    earlyVoting: direct("Wisconsin MyVote - in-person absentee voting options", "https://myvote.wi.gov/en-us/MyLocalAbsenteeOptions", "https://myvote.wi.gov/en-us/Voter-Deadlines"),
    absentee: direct("Wisconsin MyVote — Absentee voting", "https://myvote.wi.gov/My-Voter-Info", "https://myvote.wi.gov/My-Voter-Info"),
    ballot: direct("Wisconsin MyVote — What's on my ballot", "https://myvote.wi.gov/My-Voter-Info", "https://myvote.wi.gov/My-Voter-Info"),
    pollingPlace: direct("Wisconsin MyVote — Find polling place", "https://myvote.wi.gov/My-Voter-Info", "https://myvote.wi.gov/My-Voter-Info"),
    whatToBring: direct("Wisconsin Elections Commission - Acceptable Photo IDs", "https://myvote.wi.gov/Portals/0/Documents/AcceptablePhotoIDs.pdf?ver=vS9TnMVULlI9Yi0mGe-P0g%3D%3Dacceptable_photo_ids_for_voting_in_wi_pdf_20769", "https://myvote.wi.gov/en-us/Voter-Deadlines"),
    electionOffice: direct("Wisconsin MyVote - Find My Municipal Clerk", "https://myvote.wi.gov/en-us/My-Municipal-Clerk", "https://myvote.wi.gov/en-us/My-Municipal-Clerk"),
  },
  WY: {
    electionDates: direct("Wyoming Secretary of State — 2026 Key Election Dates", "https://sos.wyo.gov/Elections/Docs/2026/2026_Key_Election_Dates.pdf", "https://sos.wyo.gov/Elections/"),
    registration: fallback("Wyoming Votes — official voter information and registration links", "https://letsvotewyo.org/", "https://sos.wyo.gov/Elections/Voting.aspx"),
    earlyVoting: fallback("Wyoming Secretary of State — in-person and absentee voting information", "https://sos.wyo.gov/Elections/Voting.aspx", "https://sos.wyo.gov/Elections/Voting.aspx"),
    absentee: direct("Wyoming Secretary of State — Absentee Voting", "https://sos.wyo.gov/Elections/State/AbsenteeVoting.aspx", "https://sos.wyo.gov/Elections/Voting.aspx"),
    ballot: direct("Wyoming Voter Information Tool — ballot and election information", "https://myelectionday.sos.wyo.gov/WYVOTES/Pages/VOSearch.aspx", "https://sos.wyo.gov/Elections/Voting.aspx"),
    pollingPlace: direct("Wyoming Voter Information Tool — polling place locator", "https://myelectionday.sos.wyo.gov/WYVOTES/Pages/VOSearch.aspx", "https://sos.wyo.gov/Elections/") ,
    whatToBring: fallback("Wyoming Secretary of State — voter ID and election information", "https://sos.wyo.gov/Elections/Voting.aspx", "https://sos.wyo.gov/Elections/Voting.aspx"),
    electionOffice: direct("Wyoming County Clerks Directory", "https://sos.wyo.gov/Elections/Docs/WYCountyClerks.pdf", "https://sos.wyo.gov/Elections/Voting.aspx"),
  },
  IL: {
    electionDates: direct("Illinois State Board of Elections - 2026 Election Calendar", "https://www.elections.il.gov/Main/CalendarEventsAll.aspx", "https://www.elections.il.gov/Main/CalendarEventsAll.aspx"),
    registration: fallback("Illinois — official voter information; registration lookup could not be inspected", "https://www.elections.il.gov/InformationForVoters.aspx?MID=I0cuvBFuZRw%3D", "https://www.elections.il.gov/"),
    earlyVoting: fallback("Illinois — official voter information and local early voting locations", "https://www.elections.il.gov/InformationForVoters.aspx?MID=I0cuvBFuZRw%3D", "https://www.elections.il.gov/"),
    absentee: fallback("Illinois — official voter information and vote-by-mail", "https://www.elections.il.gov/InformationForVoters.aspx?MID=I0cuvBFuZRw%3D", "https://www.elections.il.gov/"),
    ballot: fallback("Illinois — sample ballots are supplied by local election authorities", "https://www.elections.il.gov/InformationForVoters.aspx?MID=I0cuvBFuZRw%3D", "https://www.elections.il.gov/"),
    pollingPlace: fallback("Illinois — official voter information and polling-place locator", "https://www.elections.il.gov/InformationForVoters.aspx?MID=I0cuvBFuZRw%3D", "https://www.elections.il.gov/"),
    whatToBring: fallback("Illinois — official voter guide and identification information", "https://www.elections.il.gov/InformationForVoters.aspx?MID=I0cuvBFuZRw%3D", "https://www.elections.il.gov/"),
    electionOffice: fallback("Illinois — contact local election authority", "https://www.elections.il.gov/InformationForVoters.aspx?MID=I0cuvBFuZRw%3D", "https://www.elections.il.gov/"),
  },
  WV: {
    registration: { name: "West Virginia Secretary of State — Check voter registration", url: "https://apps.sos.wv.gov/Elections/Voter/AmIRegisteredToVote" },
    earlyVoting: { name: "West Virginia Secretary of State — Early voting locations", url: "https://sos.wv.gov/early-voting-locations" },
    absentee: { name: "West Virginia Secretary of State — Absentee voting", url: "https://sos.wv.gov/absentee-voting-information" },
    pollingPlace: { name: "West Virginia Secretary of State — Find polling place", url: "https://apps.sos.wv.gov/Elections/Voter/FindMyPollingPlace" },
    whatToBring: { name: "West Virginia Secretary of State — Voter identification information", url: "https://sos.wv.gov/be-registered-and-ready" },
    electionOffice: STATE_ELECTION_OFFICE.WV,
  },
};

export type ResourceStatus = "direct" | "state-fallback" | "national-fallback";
export type VotingResource = OfficialSource & { status: ResourceStatus; verifiedDate: string; validationSource: string };
export const RESOURCE_TYPES: VotingResourceType[] = ["electionDates", "registration", "earlyVoting", "absentee", "ballot", "pollingPlace", "whatToBring", "electionOffice"];
export const STATE_RESOURCES: Record<string, Record<VotingResourceType, VotingResource>> = Object.fromEntries(STATES.map(({ code, name }) => {
  const office = STATE_ELECTION_OFFICE[code];
  return [code, Object.fromEntries(RESOURCE_TYPES.map((type) => [type, {
    name: `${name} official election resource index (fallback)`, url: office.url,
    status: "state-fallback" as const, verifiedDate: "", validationSource: office.url,
  }]))];
})) as Record<string, Record<VotingResourceType, VotingResource>>;
const DIRECT_RESOURCES: Partial<Record<string, Partial<Record<VotingResourceType, VotingResource>>>> = {
  ...Object.fromEntries(Object.entries(CURATED_STATE_RESOURCE_OVERRIDES).filter(([code]) => code !== "WV")),
  AL: {
    electionDates: direct("Alabama Secretary of State — Upcoming elections", "https://www.sos.alabama.gov/alabama-votes/voter/upcoming-elections", "https://www.sos.alabama.gov/alabama-votes/voter/election-information"),
    registration: direct("Alabama VoterView — registration status", "https://myinfo.alabamavotes.gov/VoterView", "https://www.sos.alabama.gov/alabama-votes/voter/election-information"),
    absentee: direct("Alabama Secretary of State — Absentee voting", "https://www.sos.alabama.gov/alabama-votes/voter/absentee-voting", "https://www.sos.alabama.gov/alabama-votes/voter/election-information"),
    ballot: direct("Alabama Secretary of State — 2026 General Election sample ballots", "https://www.sos.alabama.gov/alabama-votes/2026-general-election-sample-ballots", "https://www.sos.alabama.gov/alabama-votes/voter/election-information/2026"),
    pollingPlace: direct("Alabama VoterView — polling lookup", "https://myinfo.alabamavotes.gov/VoterView", "https://www.sos.alabama.gov/alabama-votes/voter/election-information"),
    whatToBring: direct("Alabama Secretary of State — Voter ID", "https://www.sos.alabama.gov/alabama-votes/voter/voter-id", "https://www.sos.alabama.gov/alabama-votes/voter/election-information"),
  },
  AK: {
    electionDates: direct("Alaska Division of Elections — Election Calendar", "https://www.elections.alaska.gov/calendar/", "https://www.elections.alaska.gov/election-information/"),
    registration: direct("Alaska Division of Elections — My Voter Information", "https://myvoterportal.alaska.gov/", "https://www.elections.alaska.gov/"),
    ballot: direct("Alaska Division of Elections — Sample Ballots", "https://www.elections.alaska.gov/sample-ballots/", "https://www.elections.alaska.gov/"),
    pollingPlace: direct("Alaska Division of Elections — Polling Place Locations", "https://www.elections.alaska.gov/election-polls/", "https://www.elections.alaska.gov/"),
    electionOffice: direct("Alaska Division of Elections — Regional office contacts", "https://www.elections.alaska.gov/contact-information/", "https://www.elections.alaska.gov/"),
  },
  AZ: {
    electionDates: direct("Arizona Secretary of State - 2026 Election Information", "https://azsos.gov/elections/election-information/2026-election-info", "https://azsos.gov/elections"),
    registration: direct("Arizona Voter Information Portal", "https://my.arizona.vote/PortalList.aspx", "https://azsos.gov/elections/voters/voting-elections"),
    earlyVoting: direct("Arizona Secretary of State — Voting in Elections", "https://azsos.gov/elections/voters/voting-elections", "https://azsos.gov/elections"),
    absentee: direct("Arizona Secretary of State — Voting in Elections", "https://azsos.gov/elections/voters/voting-elections", "https://azsos.gov/elections"),
    ballot: fallback("Arizona Secretary of State - 2026 election information and county sample-ballot resources", "https://azsos.gov/elections/election-information/2026-election-info", "https://azsos.gov/elections/voters"),
    pollingPlace: direct("Arizona Voter Information Portal", "https://my.arizona.vote/PortalList.aspx", "https://azsos.gov/elections/about-elections/elections-procedures/election-day-operations"),
    whatToBring: direct("Arizona Secretary of State — Election Day / voter ID", "https://azsos.gov/elections/voters/voting-elections", "https://azsos.gov/elections"),
    electionOffice: direct("Arizona Secretary of State — County election contacts", "https://azsos.gov/elections/about-elections/county-election-contact-info", "https://azsos.gov/elections"),
  },
  AR: {
    electionDates: direct("Arkansas Secretary of State — 2026 Election Calendar", "https://www.sos.arkansas.gov/uploads/elections/2026_Election_Calendar_Rev._7-2026_.pdf", "https://sos.arkansas.gov/elections/for-voters"),
    registration: direct("Arkansas VoterView — registration status", "https://www.voterview.ar-nova.org/voterview", "https://sos.arkansas.gov/elections/for-voters"),
    earlyVoting: direct("Arkansas Secretary of State — Voting in Arkansas", "https://www.sos.arkansas.gov/elections/voter-information/voter-registration-information/voting-in-arkansas", "https://sos.arkansas.gov/elections/for-voters"),
    absentee: direct("Arkansas Secretary of State — Absentee voting", "https://www.sos.arkansas.gov/elections/voter-information/absentee-voting", "https://sos.arkansas.gov/elections/for-voters"),
    ballot: direct("Arkansas VoterView — sample ballots", "https://www.voterview.ar-nova.org/voterview", "https://sos.arkansas.gov/elections/for-voters"),
    pollingPlace: direct("Arkansas VoterView — polling sites", "https://www.voterview.ar-nova.org/voterview", "https://sos.arkansas.gov/elections/for-voters"),
    whatToBring: direct("Arkansas Secretary of State — Voting in Arkansas", "https://www.sos.arkansas.gov/elections/voter-information/voter-registration-information/voting-in-arkansas", "https://sos.arkansas.gov/elections/for-voters"),
  },
  CA: {
    electionDates: direct("California Secretary of State — 2026 key dates", "https://www.sos.ca.gov/elections/upcoming-elections/general-election-november-3-2026/key-dates-deadlines", "https://www.sos.ca.gov/elections/upcoming-elections/general-election-november-3-2026/key-dates-deadlines"),
    registration: direct("California Secretary of State — Check registration status", "https://voterstatus.sos.ca.gov/", "https://www.sos.ca.gov/elections/registration-status"),
    earlyVoting: direct("California Secretary of State — CA Early Voting", "https://caearlyvoting.sos.ca.gov/", "https://www.sos.ca.gov/elections/voting-info/ways-vote/"),
    absentee: direct("California Secretary of State — Ways to Vote / vote by mail", "https://www.sos.ca.gov/elections/voting-info/ways-vote/", "https://www.sos.ca.gov/elections/voting-info/ways-vote/"),
    ballot: direct("California Secretary of State — County Voter Information Guide", "https://www.sos.ca.gov/elections/publications-and-resources/state-county-vig", "https://www.sos.ca.gov/elections/publications-and-resources/state-county-vig"),
    pollingPlace: direct("California Secretary of State — Find Your Polling Place", "https://www.sos.ca.gov/elections/polling-place", "https://www.sos.ca.gov/elections/voting-info/ways-vote/"),
    whatToBring: direct("California Secretary of State - Voter ID and registration requirements", "https://elections.cdn.sos.ca.gov/pdfs/voter-id-and-reg-requirements.pdf", "https://www.sos.ca.gov/elections/voter-registration"),
    electionOffice: direct("California Secretary of State — County Elections Map", "https://www.sos.ca.gov/elections/map", "https://www.sos.ca.gov/elections/map"),
  },
  CO: {
    electionDates: direct("Colorado Secretary of State — 2026 Election Calendar", "https://www.sos.state.co.us/pubs/elections/calendars/2026ElectionCalendar.pdf", "https://www.sos.state.co.us/pubs/elections/calendars/2026ElectionCalendar.pdf"),
    registration: direct("Colorado Secretary of State — Find My Voter Registration", "https://sos.state.co.us/voter/pages/pub/olvr/findVoterReg.xhtml", "https://sos.state.co.us/voter/pages/pub/home.xhtml?_land=sp"),
    ballot: direct("Colorado Secretary of State — Personalized sample ballot", "https://myballot.coloradosos.gov/app", "https://sos.state.co.us/voter/pages/pub/home.xhtml?_land=sp"),
    pollingPlace: direct("Colorado Secretary of State — Find ballot drop-off and voting locations", "https://www.coloradosos.gov/pubs/elections/VIP.html", "https://sos.state.co.us/voter/pages/pub/home.xhtml?_land=sp"),
    whatToBring: direct("Colorado Secretary of State — Acceptable forms of identification", "https://www.sos.state.co.us/pubs/elections/vote/acceptableFormsOfID.html", "https://sos.state.co.us/voter/pages/pub/home.xhtml?_land=sp"),
  },
  CT: {
    electionDates: direct("Connecticut Secretary of the State — 2026 Election Calendar", "https://portal.ct.gov/-/media/sots/electionservices/calendars/2026-elections/2026-election-calendar-122325.pdf", "https://portal.ct.gov/sots/common-elements/v5-template---redesign/elections--voting--home-page"),
    earlyVoting: direct("Connecticut Secretary of the State — 2026 Early Voting Locations", "https://portal.ct.gov/-/media/sots/electionservices/early-voting/2026/early-voting-locations--november-3--2026.pdf", "https://portal.ct.gov/sots/common-elements/v5-template---redesign/elections--voting--home-page"),
    absentee: direct("Connecticut Secretary of the State — 2026 Absentee Voting information", "https://portal.ct.gov/sots/election-services/voter-information/2026-absentee-voting---updates-and-information", "https://portal.ct.gov/sots/common-elements/v5-template---redesign/elections--voting--home-page"),
    ballot: direct("Connecticut Secretary of the State — November 2026 town sample ballots", "https://portal.ct.gov/sots/election-services/town-ballots/2026-november-town-election-ballots", "https://portal.ct.gov/sots/common-elements/v5-template---redesign/elections--voting--home-page"),
    whatToBring: direct("Connecticut Secretary of the State — Where and how to vote / identification", "https://portal.ct.gov/sots/election-services/voter-information/where-and-how-do-i-vote", "https://portal.ct.gov/sots/election-services/voter-information/where-and-how-do-i-vote"),
    electionOffice: direct("Connecticut Secretary of the State — Town Clerk and Registrar directory", "https://portal.ct.gov/sots/election-services/find-your-town-clerk-registrar-and-elected-officials/find-your-town-clerk-registrar-of-voters-and-elected-officials", "https://portal.ct.gov/sots/election-services/find-your-town-clerk-registrar-and-elected-officials/find-your-town-clerk-registrar-of-voters-and-elected-officials"),
  },
  DE: {
    electionDates: direct("Delaware Department of Elections — 2026 Election Calendar", "https://elections.delaware.gov/public/calendar/pdfs/2026ElectionCalendar.pdf", "https://elections.delaware.gov/elections/general/general.html"),
    registration: direct("Delaware Voter Portal — registration lookup", "https://ivote.de.gov/VoterView", "https://elections.delaware.gov/voter/votereg.html"),
    earlyVoting: direct("Delaware Department of Elections — 2026 voting locations and early voting schedule", "https://elections.delaware.gov/elections/votinglocations.html", "https://elections.delaware.gov/voter/waystovote.html"),
    absentee: direct("Delaware Department of Elections — Absentee voting", "https://elections.delaware.gov/voter/absentee/index.html", "https://elections.delaware.gov/voter/waystovote.html"),
    ballot: fallback("Delaware Department of Elections — 2026 General Election ballot information (ballots not yet posted)", "https://elections.delaware.gov/elections/general/general.html", "https://elections.delaware.gov/elections/general/general.html"),
    pollingPlace: direct("Delaware Voter Portal — polling location search", "https://ivote.de.gov/VoterView", "https://elections.delaware.gov/elections/general/general.html"),
    whatToBring: direct("Delaware Department of Elections — Voter identification FAQ", "https://elections.delaware.gov/voter/VotingFAQ.html", "https://elections.delaware.gov/voter/VotingFAQ.html"),
    electionOffice: direct("Delaware Department of Elections — County offices and contacts", "https://elections.delaware.gov/locations.html", "https://elections.delaware.gov/locations.html"),
  },
  FL: {
    electionDates: direct("Florida Division of Elections — Election Dates", "https://dos.fl.gov/elections/for-voters/election-dates/?lv=true", "https://dos.fl.gov/elections/for-voters/"),
    registration: direct("Florida Division of Elections — Voter Information Lookup", "https://dos.fl.gov/elections/for-voters/check-your-voter-status-and-polling-place/", "https://dos.fl.gov/elections/for-voters/"),
    earlyVoting: direct("Florida Division of Elections — Early Voting and Secure Ballot Intake Stations", "https://dos.fl.gov/elections/for-voters/voting/early-voting-and-secure-ballot-intake-stations/?lv=true", "https://dos.fl.gov/elections/for-voters/"),
    absentee: direct("Florida Division of Elections — Vote-by-Mail", "https://dos.fl.gov/elections/for-voters/voting/vote-by-mail", "https://dos.fl.gov/elections/for-voters/"),
    ballot: fallback("Florida county Supervisors of Elections — sample ballots are county-specific", "https://dos.fl.gov/elections/contacts/supervisor-of-elections", "https://dos.fl.gov/elections/contacts/supervisor-of-elections"),
    pollingPlace: fallback("Florida county Supervisors of Elections — polling places are county-specific", "https://dos.fl.gov/elections/contacts/supervisor-of-elections", "https://dos.fl.gov/elections/contacts/supervisor-of-elections"),
    whatToBring: direct("Florida Division of Elections — Voter ID and voting FAQ", "https://dos.fl.gov/elections/contacts/frequently-asked-questions/faq-voting/", "https://dos.fl.gov/elections/for-voters/"),
    electionOffice: direct("Florida Division of Elections — County Supervisor of Elections directory", "https://dos.fl.gov/elections/contacts/supervisor-of-elections", "https://dos.fl.gov/elections/contacts/supervisor-of-elections"),
  },
  GA: {
    electionDates: direct("Georgia Secretary of State — 2026 Elections Calendar", "https://sos.ga.gov/sites/default/files/forms/2026%20Elections%20Calendar.pdf", "https://sos.ga.gov/page/elections-faq"),
    registration: direct("Georgia My Voter Page — registration lookup", "https://mvp.sos.ga.gov/s/", "https://sos.ga.gov/page/elections-faq"),
    earlyVoting: direct("Georgia Secretary of State — How-to Guide: Voting", "https://sos.ga.gov/how-to-guide/how-guide-voting", "https://sos.ga.gov/page/elections-faq"),
    absentee: direct("Georgia Secretary of State — How-to Guide: Voting / absentee voting", "https://sos.ga.gov/how-to-guide/how-guide-voting", "https://sos.ga.gov/page/elections-faq"),
    ballot: direct("Georgia My Voter Page — personalized sample ballot", "https://mvp.sos.ga.gov/s/", "https://sos.ga.gov/page/elections-faq"),
    pollingPlace: direct("Georgia My Voter Page — polling and early voting locations", "https://mvp.sos.ga.gov/s/", "https://sos.ga.gov/page/elections-faq"),
    whatToBring: direct("Georgia Secretary of State — Voter Identification Requirements", "https://sos.ga.gov/page/georgia-voter-identification-requirements", "https://sos.ga.gov/page/elections-faq"),
    electionOffice: direct("Georgia My Voter Page — county election offices", "https://mvp.sos.ga.gov/s/county-election-offices", "https://sos.ga.gov/page/elections-faq"),
  },
  DC: {
    electionDates: direct("District of Columbia Board of Elections — 2026 General Election Calendar", "https://dcboe.org/getmedia/4d04f4a1-fb2a-4f8a-809f-d3f708f232df/2026-General-Election-Calendar-Version-08072025.pdf", "https://dcboe.org/elections/2026-elections"),
    registration: direct("DC Board of Elections — Check Voter Registration Status", "https://apps.dcboe.org/VRS", "https://dcboe.org/"),
    earlyVoting: direct("DC Board of Elections — 2026 Vote Centers and early voting", "https://dcboe.org/elections/2026-elections", "https://dcboe.org/"),
    absentee: direct("DC Board of Elections — Mail Ballot Request", "https://dcboe.org/voters/casting-your-vote/mail-ballot-request", "https://dcboe.org/"),
    ballot: direct("DC Board of Elections — 2026 General Election sample ballots", "https://dcboe.org/elections/2026-elections", "https://dcboe.org/"),
    pollingPlace: direct("DC Board of Elections — Vote Center Locator", "https://dcgis.maps.arcgis.com/apps/instant/nearby/index.html?appid=763576faa0b1470ca0559c377cf3b497", "https://dcboe.org/"),
  },
  HI: {
    electionDates: direct("Hawaii Office of Elections — 2026 dates and deadlines", "https://elections.hawaii.gov/voting/voting-in-hawaii/", "https://elections.hawaii.gov/"),
    registration: direct("Hawaii Online Voter Registration and status", "https://olvr.hawaii.gov/", "https://elections.hawaii.gov/register-to-vote/register-online-to-vote/"),
    earlyVoting: direct("Hawaii Voter Service Centers and Ballot Drop Boxes", "https://elections.hawaii.gov/voter-service-centers-and-places-of-deposit/", "https://elections.hawaii.gov/"),
    absentee: direct("Hawaii Office of Elections — Voting by mail and alternate address", "https://elections.hawaii.gov/resources/cast-your-vote-in-comfort/", "https://elections.hawaii.gov/"),
    ballot: fallback("Hawaii Office of Elections — County-administered ballots (fallback)", "https://elections.hawaii.gov/resources/county-election-divisions/", "https://elections.hawaii.gov/"),
    pollingPlace: fallback("Hawaii Office of Elections — In-person service centers (mail-ballot state)", "https://elections.hawaii.gov/voter-service-centers-and-places-of-deposit/", "https://elections.hawaii.gov/"),
    whatToBring: direct("Hawaii Office of Elections — Voting in Hawaii", "https://elections.hawaii.gov/voting/voting-in-hawaii/", "https://elections.hawaii.gov/"),
    electionOffice: direct("Hawaii County Elections Divisions", "https://elections.hawaii.gov/resources/county-election-divisions/", "https://elections.hawaii.gov/"),
  },
  ID: {
    electionDates: direct("Idaho Secretary of State — Election Calendar", "https://voteidaho.gov/calendar/", "https://voteidaho.gov/"),
    earlyVoting: direct("Idaho Secretary of State — Early and in-person absentee voting by county", "https://voteidaho.gov/casting-your-ballot/", "https://voteidaho.gov/"),
    absentee: direct("Idaho Secretary of State — Absentee voting", "https://voteidaho.gov/casting-your-ballot/", "https://voteidaho.gov/"),
    ballot: direct("Idaho Secretary of State — What’s on the ballot", "https://voteidaho.gov/on-the-ballots/", "https://voteidaho.gov/"),
    pollingPlace: direct("Idaho Secretary of State — Find polling location", "https://voteidaho.gov/casting-your-ballot/", "https://voteidaho.gov/"),
    whatToBring: direct("Idaho Secretary of State — Guide to voting in person", "https://voteidaho.gov/guide-to-vote-in-person/", "https://voteidaho.gov/"),
    electionOffice: direct("Idaho County Clerk directory", "https://voteidaho.gov/county-clerk/", "https://voteidaho.gov/"),
  },
  IA: {
    electionDates: direct("Iowa Secretary of State — Three-year Election Calendar", "https://sos.iowa.gov/three-year-election-calendar", "https://sos.iowa.gov/voters"),
    registration: direct("Iowa Secretary of State — Check registration status", "https://apps.sos.iowa.gov/elections/voterreg/regtovote/search.aspx", "https://sos.iowa.gov/voters"),
    earlyVoting: direct("Iowa Secretary of State — Absentee voting, including in-person early voting", "https://sos.iowa.gov/voters/absentee-voting", "https://sos.iowa.gov/voters"),
    absentee: direct("Iowa Secretary of State — Absentee voting", "https://sos.iowa.gov/voters/absentee-voting", "https://sos.iowa.gov/voters"),
    pollingPlace: direct("Iowa Secretary of State — Find Your Polling Place", "https://apps.sos.iowa.gov/elections/voterreg/pollingplace/search.aspx", "https://sos.iowa.gov/voters"),
    whatToBring: direct("Iowa Secretary of State — Voter ID FAQs", "https://sos.iowa.gov/voters/voter-id-faq", "https://sos.iowa.gov/voters"),
    electionOffice: direct("Iowa County Auditor directory", "https://sos.iowa.gov/auditors", "https://sos.iowa.gov/voters"),
  },
  IN: {
    electionDates: direct("Indiana Secretary of State — 2026 Election Calendar", "https://www.in.gov/sos/elections/files/2026-Election-Calendar-Election-Administrators-Edition-Revised-March-2026.pdf", "https://www.in.gov/sos/elections/voter-information/"),
    registration: direct("Indiana Voters — registration status and voter portal", "https://indianavoters.in.gov/", "https://www.in.gov/sos/elections/voter-information/register-to-vote/"),
    earlyVoting: direct("Indiana Secretary of State — In-person absentee voting", "https://www.in.gov/sos/elections/voter-information/ways-to-vote/absentee-voting/", "https://www.in.gov/sos/elections/voter-information/"),
    absentee: direct("Indiana Secretary of State — Absentee voting", "https://www.in.gov/sos/elections/voter-information/ways-to-vote/absentee-voting/", "https://www.in.gov/sos/elections/voter-information/"),
    ballot: direct("Indiana Voters — Who’s on my ballot", "https://indianavoters.in.gov/", "https://www.in.gov/sos/elections/voter-information/register-to-vote/"),
    pollingPlace: direct("Indiana Voters — Find polling place", "https://indianavoters.in.gov/", "https://www.in.gov/sos/elections/voter-information/register-to-vote/"),
    whatToBring: direct("Indiana Secretary of State — Photo ID Law", "https://www.in.gov/sos/elections/voter-information/photo-id-law/", "https://www.in.gov/sos/elections/voter-information/"),
    electionOffice: direct("Indiana Voters — County election contact information", "https://indianavoters.in.gov/", "https://www.in.gov/sos/elections/voter-information/ways-to-vote/absentee-voting/"),
  },
  KS: {
    electionDates: direct("Kansas Secretary of State — 2026 election dates", "https://www.sos.ks.gov/elections/important-election-dates.html", "https://www.sos.ks.gov/elections/"),
    registration: direct("Kansas VoterView — registration status", "https://kansasvoterinfo.gov/VoterView", "https://www.sos.ks.gov/elections/voter-information.html"),
    earlyVoting: fallback("Kansas Secretary of State — Advance voting information (county schedules)", "https://www.sos.ks.gov/elections/voter-information.html", "https://www.sos.ks.gov/elections/voter-information.html"),
    absentee: direct("Kansas Secretary of State — Advance voting by mail", "https://www.sos.ks.gov/elections/voter-information.html", "https://www.sos.ks.gov/elections/voter-information.html"),
    ballot: fallback("Kansas Secretary of State — Official election resources (county ballot systems)", "https://www.sos.ks.gov/elections/elections.html", "https://www.sos.ks.gov/elections/elections.html"),
    pollingPlace: direct("Kansas VoterView — polling place lookup", "https://kansasvoterinfo.gov/VoterView", "https://www.sos.ks.gov/elections/voter-information.html"),
    whatToBring: direct("Kansas Secretary of State — Photo ID requirements", "https://www.sos.ks.gov/elections/voter-information.html", "https://www.sos.ks.gov/elections/voter-information.html"),
    electionOffice: fallback("Kansas Secretary of State — County election officer directory (fallback)", "https://www.sos.ks.gov/elections/elections.html", "https://www.sos.ks.gov/elections/elections.html"),
  },
  KY: {
    electionDates: direct("Kentucky State Board of Elections — Election calendar", "https://elect.ky.gov/Resources/Pages/Election-Calendar.aspx", "https://elect.ky.gov/"),
    registration: direct("Kentucky Voter Information Center — Check registration status", "https://vrsws.sos.ky.gov/VIC/", "https://elect.ky.gov/"),
    earlyVoting: fallback("Kentucky State Board of Elections — Early voting locations (official fallback)", "https://elect.ky.gov/", "https://elect.ky.gov/"),
    absentee: direct("Kentucky State Board of Elections — Absentee voting eligibility and process", "https://elect.ky.gov/Voters/Pages/Absentee-Voting-By-Mail.aspx", "https://elect.ky.gov/"),
    ballot: direct("Kentucky Secretary of State — County sample ballots", "https://web.sos.ky.gov/electionballots/", "https://vrsws.sos.ky.gov/ovrweb/govoteky/"),
    pollingPlace: direct("Kentucky Voter Information Center — Find polling place", "https://vrsws.sos.ky.gov/VIC/", "https://elect.ky.gov/"),
    whatToBring: direct("Kentucky State Board of Elections — Voter ID requirements", "https://elect.ky.gov/Voters/Pages/Absentee-Excused-In-Person.aspx", "https://elect.ky.gov/"),
    electionOffice: direct("Kentucky County Clerks directory", "https://elect.ky.gov/About-Us/Pages/County-Clerks.aspx", "https://elect.ky.gov/"),
  },
  LA: {
    electionDates: direct("Louisiana Secretary of State — Election dates", "https://www.sos.la.gov/elections-voting/election-dates", "https://www.sos.la.gov/elections-voting/"),
    registration: fallback("Louisiana Secretary of State — Voter registration portal link (official fallback)", "https://www.sos.la.gov/elections-voting/online-voter-registration", "https://www.sos.la.gov/elections-voting/online-voter-registration"),
    earlyVoting: fallback("Louisiana Secretary of State — Early voting information and parish locations (official fallback)", "https://www.sos.la.gov/elections-voting/voting-early-faqs", "https://www.sos.la.gov/elections-voting/voting-early-faqs"),
    absentee: direct("Louisiana Secretary of State — Absentee voting", "https://www.sos.la.gov/elections-voting/ways-to-vote", "https://www.sos.la.gov/elections-voting/ways-to-vote"),
    ballot: direct("Louisiana Secretary of State — Sample ballots", "https://www.sos.la.gov/elections-voting/sample-ballots", "https://www.sos.la.gov/elections-voting/sample-ballots"),
    pollingPlace: fallback("Louisiana Secretary of State — Polling location lookup instructions (portal unavailable during verification)", "https://www.sos.la.gov/elections-voting/polling-locations", "https://www.sos.la.gov/elections-voting/polling-locations"),
    whatToBring: direct("Louisiana Secretary of State — Voter identification requirements", "https://www.sos.la.gov/elections-voting/ways-to-vote", "https://www.sos.la.gov/elections-voting/ways-to-vote"),
    electionOffice: fallback("Louisiana Secretary of State — Parish registrar information (official fallback)", "https://www.sos.la.gov/elections-voting/ways-to-vote", "https://www.sos.la.gov/elections-voting/ways-to-vote"),
  },
  ME: {
    electionDates: direct("Maine Secretary of State — Upcoming elections", "https://www.maine.gov/sos/elections-voting/upcoming-elections", "https://www.maine.gov/sos/elections-voting/"),
    registration: fallback("Maine municipal election officials — registration status is checked locally", "https://www.maine.gov/sos/elections-voting/find-a-municipal-clerk-or-registrar", "https://www.maine.gov/sos/elections-voting/registering-to-vote"),
    earlyVoting: direct("Maine Secretary of State — In-person absentee voting before Election Day", "https://www.maine.gov/sos/elections-voting/absentee-guide", "https://www.maine.gov/sos/elections-voting/information-about-voting"),
    absentee: direct("Maine Secretary of State — Absentee voting", "https://www.maine.gov/sos/elections-voting/absentee-voting", "https://www.maine.gov/sos/elections-voting/information-about-voting"),
    ballot: direct("Maine Voter Information Lookup — Sample ballot by address", "https://www.maine.gov/portal/government/edemocracy/voter_lookup.php", "https://www.maine.gov/sos/elections-voting/information-about-voting"),
    pollingPlace: direct("Maine Voter Information Lookup — Voting place by address", "https://www.maine.gov/portal/government/edemocracy/voter_lookup.php", "https://www.maine.gov/sos/elections-voting/information-about-voting"),
    whatToBring: direct("Maine Secretary of State — Voter guide", "https://www.maine.gov/sos/elections-voting/state-of-maine-voter-guide", "https://www.maine.gov/sos/elections-voting/information-about-voting"),
    electionOffice: direct("Maine Municipal Clerk and Registrar directory", "https://www.maine.gov/sos/elections-voting/find-a-municipal-clerk-or-registrar", "https://www.maine.gov/sos/elections-voting/upcoming-elections"),
  },
  MD: {
    electionDates: direct("Maryland State Board of Elections — 2026 Gubernatorial Election dates", "https://elections.maryland.gov/elections/2026/index.html", "https://elections.maryland.gov/"),
    registration: direct("Maryland Voter Services — registration and voter status lookup", "https://voterservices.elections.maryland.gov/VoterSearch", "https://elections.maryland.gov/"),
    earlyVoting: direct("Maryland State Board of Elections — 2026 Early Voting", "https://elections.maryland.gov/voting/early_voting.html", "https://elections.maryland.gov/"),
    absentee: direct("Maryland State Board of Elections — Mail-In Voting", "https://elections.maryland.gov/voting/absentee.html", "https://elections.maryland.gov/"),
    ballot: fallback("Maryland State Board of Elections — 2026 certified ballot information", "https://elections.maryland.gov/elections/2026/index.html", "https://elections.maryland.gov/elections/2026/index.html"),
    pollingPlace: direct("Maryland Voter Services — Find your polling place", "https://voterservices.elections.maryland.gov/PollingPlaceSearch", "https://elections.maryland.gov/elections/2026/index.html"),
    whatToBring: direct("Maryland State Board of Elections — Election Day FAQ", "https://elections.maryland.gov/voting/election_day_questions.html", "https://elections.maryland.gov/"),
    electionOffice: direct("Maryland Local Boards of Elections directory", "https://elections.maryland.gov/about/county_boards.html", "https://elections.maryland.gov/"),
  },
  MA: {
    electionDates: direct("Massachusetts Elections Division — Upcoming Elections", "https://www.sec.state.ma.us/divisions/elections/recent-updates/upcoming-elections.htm", "https://www.sec.state.ma.us/divisions/elections/elections-and-voting.htm"),
    registration: direct("Massachusetts — Check My Voter Registration Status", "https://www.sec.state.ma.us/VoterRegistrationSearch/MyVoterRegStatus.aspx", "https://www.sec.state.ma.us/divisions/elections/elections-and-voting.htm"),
    earlyVoting: direct("Massachusetts — How to Vote Early", "https://www.sec.state.ma.us/divisions/elections/voting-information/vote-early.htm", "https://www.sec.state.ma.us/divisions/elections/elections-and-voting.htm"),
    absentee: direct("Massachusetts — Voting by Mail", "https://www.sec.state.ma.us/divisions/elections/voting-information/vote-by-mail.htm", "https://www.sec.state.ma.us/divisions/elections/elections-and-voting.htm"),
    ballot: fallback("Massachusetts Elections Division — 2026 candidate and ballot question information", "https://www.sec.state.ma.us/divisions/elections/recent-updates/upcoming-elections.htm", "https://www.sec.state.ma.us/divisions/elections/elections-and-voting.htm"),
    pollingPlace: direct("Massachusetts — Find My Election Information", "https://www.sec.state.ma.us/WhereDoIVoteMA/WhereDoIVote", "https://www.sec.state.ma.us/divisions/elections/elections-and-voting.htm"),
    whatToBring: direct("Massachusetts — Voter Identification Requirements", "https://www.sec.state.ma.us/divisions/elections/voting-information/identification-requirements.htm", "https://www.sec.state.ma.us/divisions/elections/elections-and-voting.htm"),
    electionOffice: direct("Massachusetts — Find Local Election Offices", "https://www.sec.state.ma.us/divisions/elections/voter-resources/find-my-local-election-office.htm", "https://www.sec.state.ma.us/divisions/elections/elections-and-voting.htm"),
  },
  MI: {
    electionDates: direct("Michigan Secretary of State — Election dates and deadlines", "https://www.michigan.gov/sos/elections/voting", "https://www.michigan.gov/sos/elections"),
    registration: fallback("Michigan Secretary of State — Registration and status resources", "https://www.michigan.gov/sos/elections/voting/register-to-vote", "https://www.michigan.gov/sos/elections/voting/register-to-vote"),
    earlyVoting: direct("Michigan Secretary of State — Early in-person voting", "https://www.michigan.gov/sos/elections/voting/early-in-person-voting", "https://www.michigan.gov/sos/elections"),
    absentee: direct("Michigan Secretary of State — Absentee voting", "https://www.michigan.gov/sos/elections/voting/absentee-voting", "https://www.michigan.gov/sos/elections/voting"),
    ballot: fallback("Michigan Secretary of State — Ballot information (personalized lookup linked but not accessible during verification)", "https://www.michigan.gov/sos/elections/voting", "https://www.michigan.gov/sos/elections/voting"),
    pollingPlace: fallback("Michigan Secretary of State — Voter information and polling lookup link", "https://www.michigan.gov/sos/elections/voting", "https://www.michigan.gov/sos/elections/voting"),
    whatToBring: direct("Michigan Secretary of State — First-time voters and ID rules", "https://www.michigan.gov/sos/elections/voting/first-time-voters", "https://www.michigan.gov/sos/elections"),
    electionOffice: fallback("Michigan Secretary of State — Voter and local clerk information", "https://www.michigan.gov/sos/elections/voting/voters", "https://www.michigan.gov/sos/elections/voting"),
  },
  MN: {
    electionDates: direct("Minnesota Secretary of State — Elections Calendar", "https://www.sos.mn.gov/election-administration-campaigns/elections-calendar/", "https://www.sos.mn.gov/elections-voting/"),
    registration: fallback("Minnesota Secretary of State — Check your registration", "https://www.sos.mn.gov/elections-voting/register-to-vote/", "https://www.sos.mn.gov/elections-voting/register-to-vote/"),
    earlyVoting: direct("Minnesota Secretary of State — Vote early in person", "https://www.sos.mn.gov/elections-voting/other-ways-to-vote/", "https://www.sos.mn.gov/elections-voting/"),
    absentee: direct("Minnesota Secretary of State — Vote early by mail", "https://www.sos.mn.gov/elections-voting/other-ways-to-vote/vote-early-by-mail/", "https://www.sos.mn.gov/elections-voting/"),
    ballot: fallback("Minnesota Secretary of State — Sample ballot lookup (official tool linked; lookup service not accessible during verification)", "https://www.sos.mn.gov/elections-voting/whats-on-my-ballot/", "https://www.sos.mn.gov/elections-voting/"),
    pollingPlace: fallback("Minnesota Secretary of State — Find where you vote (official tool linked; lookup service not accessible during verification)", "https://www.sos.mn.gov/elections-voting/election-day-voting/", "https://www.sos.mn.gov/elections-voting/"),
    whatToBring: direct("Minnesota Secretary of State — Do I need to bring ID?", "https://www.sos.mn.gov/elections-voting/election-day-voting/do-i-need-to-bring-id/", "https://www.sos.mn.gov/elections-voting/"),
    electionOffice: direct("Minnesota County Election Office Directory", "https://www.sos.mn.gov/elections-voting/find-county-election-office/", "https://www.sos.mn.gov/elections-voting/"),
  },
  MO: {
    electionDates: direct("Missouri Secretary of State — 2026 Election Calendar", "https://www.sos.mo.gov/elections/calendar/2026cal", "https://www.sos.mo.gov/elections"),
    registration: direct("Missouri Voter Information Lookup — Check registration", "https://voteroutreach.sos.mo.gov/portal/", "https://www.sos.mo.gov/elections/goVoteMissouri/register"),
    earlyVoting: fallback("Missouri Secretary of State — Voting information including in-person absentee voting", "https://www.sos.mo.gov/elections/goVoteMissouri", "https://www.sos.mo.gov/elections/goVoteMissouri"),
    absentee: fallback("Missouri Secretary of State — Absentee voting information", "https://www.sos.mo.gov/elections/goVoteMissouri", "https://www.sos.mo.gov/elections/goVoteMissouri"),
    ballot: direct("Missouri Voter Information Lookup — sample ballot by address", "https://voteroutreach.sos.mo.gov/portal/", "https://www.sos.mo.gov/elections/govotemissouri/electionday"),
    pollingPlace: direct("Missouri Voter Information Lookup — polling place by address", "https://voteroutreach.sos.mo.gov/portal/", "https://www.sos.mo.gov/elections/govotemissouri/electionday"),
    whatToBring: direct("Missouri Secretary of State — Voter ID", "https://www.sos.mo.gov/voterid", "https://www.sos.mo.gov/elections"),
    electionOffice: direct("Missouri Local Election Authority Directory", "https://www.sos.mo.gov/elections/govoteMissouri/localelectionauthority", "https://www.sos.mo.gov/elections/govotemissouri/electionday"),
  },
  MS: {
    electionDates: direct("Mississippi Secretary of State — 2026 Elections Calendar", "https://www.sos.ms.gov/content/documents/elections/2026%20Elections%20Calendar.pdf", "https://www.sos.ms.gov/yall-vote"),
    registration: direct("Mississippi — Verify Voter Registration", "https://www.msegov.com/sos/voter_registration/amiregistered/Search", "https://www.sos.ms.gov/yall-vote"),
    earlyVoting: direct("Mississippi Secretary of State — Absentee Voting Information", "https://www.sos.ms.gov/yall-vote/absentee-voting-information", "https://www.sos.ms.gov/yall-vote"),
    absentee: direct("Mississippi Secretary of State — Absentee Voting Information", "https://www.sos.ms.gov/yall-vote/absentee-voting-information", "https://www.sos.ms.gov/yall-vote"),
    ballot: direct("Mississippi My Election Day — personalized ballot lookup", "https://myelectionday.sos.state.ms.us/VoterOutreach/Pages/VOSearch.aspx", "https://www.sos.ms.gov/yall-vote"),
    pollingPlace: direct("Mississippi My Election Day — polling place lookup", "https://myelectionday.sos.state.ms.us/VoterOutreach/Pages/VOSearch.aspx", "https://www.sos.ms.gov/yall-vote"),
    whatToBring: direct("Mississippi Secretary of State — Voter ID", "https://www.sos.ms.gov/voter-id", "https://www.sos.ms.gov/yall-vote"),
    electionOffice: direct("Mississippi County Election Information", "https://www.sos.ms.gov/elections-voting/county-election-information", "https://www.sos.ms.gov/yall-vote"),
  },
  MT: {
    electionDates: fallback("Montana Secretary of State — Election and voter resource index", "https://sosmt.gov/elections/", "https://sosmt.gov/elections/"),
    registration: direct("Montana Voter Information Lookup — registration status", "https://voterportal.mt.gov/WhereToVote.aspx", "https://votemt.gov/"),
    earlyVoting: fallback("Montana Vote Montana — absentee and in-person early voting information", "https://votemt.gov/absentee-ballot/", "https://votemt.gov/"),
    absentee: direct("Montana Vote Montana — Absentee Ballot", "https://votemt.gov/absentee-ballot/", "https://votemt.gov/"),
    ballot: direct("Montana Voter Information Lookup — personalized sample ballot", "https://voterportal.mt.gov/WhereToVote.aspx", "https://sosmt.gov/secretary-of-state-christi-jacobsen-sample-ballots-available-for-november-3rd-general-election/"),
    pollingPlace: direct("Montana Secretary of State — Polling Location and Satellite Office Lookup", "https://sosmt.gov/elections/polling-location-satellite-office-locations/", "https://votemt.gov/"),
    whatToBring: direct("Montana Vote Montana — Voter Identification", "https://votemt.gov/voter-identification/", "https://votemt.gov/"),
    electionOffice: direct("Montana County Election Administrators directory", "https://sosmt.gov/elections/election-administrators-contact-list/", "https://votemt.gov/"),
  },
  NE: {
    electionDates: direct("Nebraska Secretary of State — 2026 Official Election Calendar", "https://sos.nebraska.gov/sites/default/files/doc/elections/2026/2026_Election_Calendar.pdf", "https://sos.nebraska.gov/elections"),
    registration: direct("Nebraska VoterCheck — registration information", "https://www.votercheck.necvr.ne.gov/voterview/registrant/newregistrant", "https://sos.nebraska.gov/elections"),
    earlyVoting: direct("Nebraska Secretary of State — Early Voting", "https://sos.nebraska.gov/elections/early-voting", "https://sos.nebraska.gov/elections"),
    absentee: direct("Nebraska Secretary of State — Early Voting (mail ballot process)", "https://sos.nebraska.gov/elections/early-voting", "https://sos.nebraska.gov/elections"),
    ballot: direct("Nebraska VoterCheck — personalized sample ballot", "https://www.votercheck.necvr.ne.gov/voterview/", "https://sos.nebraska.gov/secretary-state-certifies-ballot-2026-general-election"),
    pollingPlace: direct("Nebraska VoterCheck — polling place lookup", "https://www.votercheck.necvr.ne.gov/voterview/", "https://sos.nebraska.gov/elections/election-day-faq"),
    whatToBring: direct("Nebraska Secretary of State — Voter ID", "https://sos.nebraska.gov/voter-id", "https://sos.nebraska.gov/elections"),
    electionOffice: direct("Nebraska County Election Office Directory", "https://sos.nebraska.gov/election-officials-contact-information", "https://sos.nebraska.gov/elections"),
  },
  NV: {
    electionDates: direct("Nevada Secretary of State — 2026 Election Information", "https://www.nvsos.gov/sos/elections/election-information/2026-election-information", "https://www.nvsos.gov/sos/elections"),
    registration: fallback("Nevada Secretary of State — voter registration and VOTE.NV.gov lookup link", "https://www.nvsos.gov/sos/elections/election-information/2026-election-information", "https://www.nvsos.gov/sos/elections/election-information/2026-election-information"),
    earlyVoting: fallback("Nevada Secretary of State — 2026 early-voting dates and county location links", "https://www.nvsos.gov/sos/elections/election-information/2026-election-information", "https://www.nvsos.gov/sos/elections/election-information/2026-election-information"),
    absentee: fallback("Nevada Secretary of State — 2026 mail ballot information", "https://www.nvsos.gov/sos/elections/election-information/2026-election-information", "https://www.nvsos.gov/sos/elections/election-information/2026-election-information"),
    ballot: fallback("Nevada Secretary of State — 2026 ballot question guide and county ballot tools", "https://www.nvsos.gov/sos/elections/election-information/2026-election-information", "https://www.nvsos.gov/sos/elections/election-information/2026-election-information"),
    pollingPlace: fallback("Nevada Secretary of State — county polling location lookup links", "https://www.nvsos.gov/sos/elections/election-information/2026-election-information", "https://www.nvsos.gov/sos/elections/election-information/2026-election-information"),
    whatToBring: fallback("Nevada Secretary of State — voter information index", "https://www.nvsos.gov/sos/elections/election-information/2026-election-information", "https://www.nvsos.gov/sos/elections/election-information/2026-election-information"),
    electionOffice: fallback("Nevada Secretary of State — county election offices", "https://www.nvsos.gov/sos/elections/election-information/2026-election-information", "https://www.nvsos.gov/sos/elections/election-information/2026-election-information"),
  },
  NH: {
    electionDates: direct("New Hampshire Secretary of State — 2026–2027 Political Calendar", "https://www.sos.nh.gov/elections/2026-2027-political-calendar", "https://www.sos.nh.gov/elections"),
    registration: fallback("New Hampshire — local registration and voter lookup information", "https://www.sos.nh.gov/elections/voters/voting-new-hampshire", "https://www.sos.nh.gov/elections"),
    earlyVoting: fallback("New Hampshire — no general early-voting period; absentee and local clerk options", "https://www.sos.nh.gov/elections/voters/absentee-ballots/request-absentee-ballot", "https://www.sos.nh.gov/elections/voters"),
    absentee: direct("New Hampshire Secretary of State — Request an Absentee Ballot", "https://www.sos.nh.gov/elections/voters/absentee-ballots/request-absentee-ballot", "https://www.sos.nh.gov/elections"),
    ballot: fallback("New Hampshire Secretary of State — State sample ballot search (local ballots vary by town)", "https://www.sos.nh.gov/elections/sample-ballots", "https://www.sos.nh.gov/elections"),
    pollingPlace: fallback("New Hampshire Secretary of State — Voter information lookup (town-managed polling places)", "https://www.sos.nh.gov/elections/register-vote/polls-election-day", "https://www.sos.nh.gov/elections"),
    whatToBring: fallback("New Hampshire Secretary of State — Register to Vote and required documentation", "https://www.sos.nh.gov/elections/voters/voting-new-hampshire", "https://www.sos.nh.gov/elections"),
    electionOffice: fallback("New Hampshire Secretary of State — election official resources", "https://www.sos.nh.gov/elections/election-officials-0", "https://www.sos.nh.gov/elections"),
  },
  NJ: {
    electionDates: direct("New Jersey Division of Elections — 2026 Election Information", "https://www.nj.gov/state/elections/election-information-2026.shtml", "https://www.nj.gov/state/elections/"),
    registration: fallback("New Jersey — registration status lookup (official tool linked but blocked during verification)", "https://www.nj.gov/state/elections/voter-registration.shtml", "https://www.nj.gov/state/elections/voter-registration.shtml"),
    earlyVoting: direct("New Jersey Division of Elections — 3 Ways to Vote / early voting", "https://www.nj.gov/state/elections/vote-3-ways-to-vote.shtml", "https://www.nj.gov/state/elections/vote-3-ways-to-vote.shtml"),
    absentee: direct("New Jersey Division of Elections — Vote-By-Mail", "https://www.nj.gov/state/elections/vote-by-mail.shtml", "https://www.nj.gov/state/elections/vote-3-ways-to-vote.shtml"),
    ballot: fallback("New Jersey — sample ballots are county issued; 2026 election information", "https://www.nj.gov/state/elections/election-information-2026.shtml", "https://www.nj.gov/state/elections/election-information-2026.shtml"),
    pollingPlace: fallback("New Jersey — polling place lookup link (official vendor tool blocked during verification)", "https://www.nj.gov/state/elections/vote-polling-location.shtml", "https://www.nj.gov/state/elections/vote-polling-location.shtml"),
    whatToBring: fallback("New Jersey Division of Elections — Voter ID and voting FAQ", "https://www.nj.gov/state/elections/vote-faq.shtml", "https://www.nj.gov/state/elections/"),
    electionOffice: direct("New Jersey County Election Officials directory", "https://www.nj.gov/state/elections/vote-county-election-officials.shtml", "https://www.nj.gov/state/elections/vote-polling-location.shtml"),
  },
  NM: {
    electionDates: direct("New Mexico Secretary of State — 2026 statewide election information", "https://www.sos.nm.gov/voting-and-elections/", "https://www.sos.nm.gov/voting-and-elections/"),
    registration: fallback("New Mexico Voter Information Portal — official voter resources (lookup redirects unpredictably)", "https://www.nmvote.gov/", "https://www.nmvote.gov/"),
    earlyVoting: direct("New Mexico Secretary of State — Absentee and Early Voting", "https://www.sos.nm.gov/voting-and-elections/absentee-and-early-voting/", "https://www.nmvote.gov/"),
    absentee: direct("New Mexico Secretary of State — Absentee and Early Voting", "https://www.sos.nm.gov/voting-and-elections/absentee-and-early-voting/", "https://www.nmvote.gov/"),
    ballot: fallback("New Mexico Voter Information Portal — official voter resources (lookup redirects unpredictably)", "https://www.nmvote.gov/", "https://www.nmvote.gov/"),
    pollingPlace: fallback("New Mexico Voter Information Portal — official voter resources (lookup redirects unpredictably)", "https://www.nmvote.gov/", "https://www.nmvote.gov/"),
    whatToBring: direct("New Mexico Secretary of State — Voting identification requirements", "https://www.sos.nm.gov/voting-and-elections/voting-faqs/voting/", "https://www.nmvote.gov/"),
    electionOffice: direct("New Mexico County Clerk directory", "https://www.sos.nm.gov/voting-and-elections/county-clerk-information/", "https://www.nmvote.gov/"),
  },
  NY: {
    electionDates: direct("New York State Board of Elections — 2026 Political Calendar", "https://elections.ny.gov/2026-political-calendar", "https://elections.ny.gov/"),
    registration: direct("New York Poll Site Search and Voter Lookup", "https://voterlookup.elections.ny.gov/", "https://elections.ny.gov/ways-vote"),
    earlyVoting: direct("New York State Board of Elections — Early Voting", "https://elections.ny.gov/early-voting", "https://elections.ny.gov/ways-vote"),
    absentee: direct("New York State Board of Elections — Request a Ballot", "https://elections.ny.gov/request-ballot", "https://elections.ny.gov/ways-vote"),
    ballot: fallback("New York — sample ballots are issued by county boards; official voting information", "https://elections.ny.gov/ways-vote", "https://elections.ny.gov/ways-vote"),
    pollingPlace: direct("New York Poll Site Search and Voter Lookup", "https://voterlookup.elections.ny.gov/", "https://elections.ny.gov/ways-vote"),
    whatToBring: fallback("New York State Board of Elections — Ways to Vote", "https://elections.ny.gov/ways-vote", "https://elections.ny.gov/"),
    electionOffice: direct("New York County Boards of Elections Directory", "https://publicreporting.elections.ny.gov/CountyBoardRoster/CountyBoardRoster", "https://elections.ny.gov/ways-vote"),
  },
  NC: {
    electionDates: direct("North Carolina State Board of Elections — Upcoming Election", "https://www.ncsbe.gov/voting/upcoming-election", "https://www.ncsbe.gov/"),
    registration: direct("North Carolina Voter Search — registration lookup", "https://vt.ncsbe.gov/RegLkup/", "https://www.ncsbe.gov/voting/voter-lookup"),
    earlyVoting: direct("North Carolina State Board of Elections — Vote Early in Person", "https://www.ncsbe.gov/voting/vote-early-person", "https://www.ncsbe.gov/"),
    absentee: direct("North Carolina State Board of Elections — Vote By Mail", "https://www.ncsbe.gov/voting/vote-mail", "https://www.ncsbe.gov/"),
    ballot: direct("North Carolina Voter Search — sample ballot lookup", "https://vt.ncsbe.gov/RegLkup/", "https://www.ncsbe.gov/voting/sample-ballot"),
    pollingPlace: direct("North Carolina Voter Search — assigned polling place lookup", "https://vt.ncsbe.gov/RegLkup/", "https://www.ncsbe.gov/voting/voter-lookup"),
    whatToBring: direct("North Carolina State Board of Elections — Voter ID", "https://www.ncsbe.gov/voting/voter-id", "https://www.ncsbe.gov/"),
    electionOffice: direct("North Carolina County Boards of Elections Search", "https://vt.ncsbe.gov/BOEInfo/", "https://www.ncsbe.gov/about-elections/county-boards-elections"),
  },
  ND: {
    electionDates: direct("North Dakota Secretary of State — Current and Past Elections", "https://www.sos.nd.gov/elections/voter/elections-currentpast", "https://www.sos.nd.gov/elections"),
    registration: fallback("North Dakota — voter registration is not used; official voter resources", "https://www.sos.nd.gov/elections/voter", "https://www.sos.nd.gov/elections"),
    earlyVoting: direct("North Dakota Secretary of State — How to Vote (early voting and absentee options)", "https://www.sos.nd.gov/elections/voter/voting-north-dakota/how-do-i-vote", "https://www.sos.nd.gov/elections/voter"),
    absentee: direct("North Dakota Secretary of State — Absentee ballot request and voting options", "https://vip.sos.nd.gov/absentee/Default.aspx", "https://www.sos.nd.gov/elections"),
    ballot: direct("North Dakota My Voting Information Portal — sample ballot lookup", "https://vip.sos.nd.gov/WhereToVote.aspx?ptlPKID=7&ptlhPKID=50&tab=AddressandVotingTimes", "https://www.sos.nd.gov/elections/voter/voting-north-dakota/where-do-i-vote"),
    pollingPlace: direct("North Dakota My Voting Information Portal — polling place lookup", "https://vip.sos.nd.gov/WhereToVote.aspx?ptlPKID=7&ptlhPKID=50&tab=AddressandVotingTimes", "https://www.sos.nd.gov/elections/voter/voting-north-dakota/where-do-i-vote"),
    whatToBring: direct("North Dakota Secretary of State — Forms of Voter ID", "https://www.sos.nd.gov/elections/voter/voting-north-dakota/forms-voter-id", "https://www.sos.nd.gov/elections/voter"),
    electionOffice: direct("North Dakota Current Elected Officials", "https://www.sos.nd.gov/elections/voter/current-officials", "https://www.sos.nd.gov/elections/voter"),
  },
  OH: {
    registration: direct("Ohio Voter Search — registration status", "https://voterlookup.ohiosos.gov/VoterLookup.aspx", "https://www.ohiosos.gov/directories/county-boards-of-elections"),
    ballot: direct("Ohio Secretary of State — Sample Ballot Directory", "https://www.ohiosos.gov/directories/sample-ballot", "https://www.ohiosos.gov/elections"),
    pollingPlace: direct("Ohio Voter Search — polling location", "https://voterlookup.ohiosos.gov/VoterLookup.aspx", "https://www.ohiosos.gov/directories/county-boards-of-elections"),
    whatToBring: direct("Ohio Secretary of State — Voter ID requirements", "https://www.ohiosos.gov/elections/voter-ID-requirements", "https://www.ohiosos.gov/elections"),
    electionOffice: direct("Ohio County Boards of Elections Directory", "https://www.ohiosos.gov/directories/county-boards-of-elections", "https://www.ohiosos.gov/elections"),
  },
  OK: {
    electionDates: direct("Oklahoma State Election Board — Next Election", "https://www.oklahoma.gov/elections/elections-results/next-election.html", "https://www.oklahoma.gov/elections.html"),
    registration: fallback("Oklahoma OK Voter Portal — verified registration, status, and voter tools", "https://www.oklahoma.gov/elections/ovp.html", "https://www.oklahoma.gov/elections/ovp.html"),
    earlyVoting: direct("Oklahoma — In-person absentee (early) voting", "https://www.oklahoma.gov/elections/voters/early-voting.html", "https://www.oklahoma.gov/elections/ovp.html"),
    absentee: direct("Oklahoma State Election Board — Absentee Voting", "https://www.oklahoma.gov/elections/voters/absentee-voting.html", "https://www.oklahoma.gov/elections/ovp.html"),
    ballot: fallback("Oklahoma OK Voter Portal — sample ballot access", "https://www.oklahoma.gov/elections/ovp.html", "https://www.oklahoma.gov/elections/ovp.html"),
    pollingPlace: fallback("Oklahoma OK Voter Portal — polling and early voting lookup access", "https://www.oklahoma.gov/elections/ovp.html", "https://www.oklahoma.gov/elections/ovp.html"),
    whatToBring: direct("Oklahoma State Election Board — Proof of Identity", "https://www.oklahoma.gov/elections/voters/proof-of-identity.html", "https://www.oklahoma.gov/elections/ovp.html"),
    electionOffice: direct("Oklahoma County Election Board directory", "https://www.oklahoma.gov/elections/about-us/county-election-boards.html", "https://www.oklahoma.gov/elections.html"),
  },
  OR: {
    electionDates: direct("Oregon Secretary of State — Upcoming Elections and 2026 dates", "https://sos.oregon.gov/elections/pages/current-election.aspx", "https://sos.oregon.gov/elections/Pages/default.aspx"),
    registration: fallback("Oregon — My Vote registration lookup linked by the Secretary of State", "https://sos.oregon.gov/elections/Pages/voteinor.aspx", "https://sos.oregon.gov/elections/Pages/voteinor.aspx"),
    earlyVoting: fallback("Oregon — all-mail voting; no statewide in-person early-voting period", "https://sos.oregon.gov/elections/Pages/voteinor.aspx", "https://sos.oregon.gov/elections/Pages/voteinor.aspx"),
    absentee: fallback("Oregon — vote-by-mail and absentee information", "https://sos.oregon.gov/elections/Pages/voteinor.aspx", "https://sos.oregon.gov/elections/Pages/voteinor.aspx"),
    ballot: fallback("Oregon — My Vote personalized ballot lookup linked by the Secretary of State", "https://sos.oregon.gov/elections/Pages/voteinor.aspx", "https://sos.oregon.gov/elections/pages/current-election.aspx"),
    pollingPlace: fallback("Oregon — all-mail elections; use the official drop-box locator", "https://sos.oregon.gov/elections/Pages/drop-box-locator.aspx", "https://sos.oregon.gov/elections/pages/current-election.aspx"),
    electionOffice: direct("Oregon County Elections Officials Directory", "https://sos.oregon.gov/elections/Pages/county-officials.aspx", "https://sos.oregon.gov/elections/Pages/election-information.aspx"),
  },
  PA: {
    electionDates: direct("Pennsylvania Department of State — Upcoming Elections", "https://www.pa.gov/agencies/vote/elections/upcoming-elections", "https://www.pa.gov/agencies/vote"),
    registration: fallback("Pennsylvania — voter registration status tool linked from the state registration page", "https://www.pa.gov/agencies/vote/voter-registration", "https://www.pa.gov/agencies/vote/voter-registration"),
    earlyVoting: direct("Pennsylvania — vote in person by mail ballot before Election Day", "https://www.pa.gov/agencies/vote/voter-support/mail-in-and-absentee-ballot/mail-ballot-before-election-day", "https://www.pa.gov/agencies/vote"),
    absentee: direct("Pennsylvania Department of State — Mail-in and Absentee Ballot", "https://www.pa.gov/agencies/vote/voter-support/mail-in-and-absentee-ballot", "https://www.pa.gov/agencies/vote"),
    ballot: fallback("Pennsylvania official voter information and county-issued ballot links", "https://www.pa.gov/agencies/vote", "https://www.pa.gov/agencies/vote"),
    pollingPlace: direct("Pennsylvania — Find your local polling place", "https://www.pa.gov/services/vote/find-your-local-polling-place", "https://www.pa.gov/agencies/vote"),
    whatToBring: direct("Pennsylvania — ID requirements at the polling place", "https://www.pa.gov/services/vote/find-your-local-polling-place", "https://www.pa.gov/agencies/vote"),
    electionOffice: direct("Pennsylvania County Election Officials Directory", "https://www.pa.gov/agencies/vote/contact-us/contact-your-election-officials", "https://www.pa.gov/agencies/vote"),
  },
  RI: {
    registration: fallback("Rhode Island — Voter Information Center registration status and update", "https://vote.sos.ri.gov/", "https://vote.sos.ri.gov/"),
    earlyVoting: fallback("Rhode Island — voter center with early voting information", "https://vote.sos.ri.gov/", "https://vote.sos.ri.gov/"),
    absentee: fallback("Rhode Island — voter center with mail ballot request", "https://vote.sos.ri.gov/", "https://vote.sos.ri.gov/"),
    ballot: direct("Rhode Island Voter Information Center — Sample Ballot lookup", "https://vote.sos.ri.gov/Home/PollingPlaces", "https://vote.sos.ri.gov/"),
    pollingPlace: direct("Rhode Island Voter Information Center — Polling Place lookup", "https://vote.sos.ri.gov/Home/PollingPlaces", "https://vote.sos.ri.gov/"),
    whatToBring: direct("Rhode Island — Vote on Election Day and valid photo ID", "https://vote.sos.ri.gov/Voter/VoteatthePolls", "https://vote.sos.ri.gov/"),
    electionOffice: direct("Rhode Island Local Boards of Canvassers Directory", "https://vote.sos.ri.gov/Elections/LocalBoards", "https://vote.sos.ri.gov/"),
  },
  SD: {
    electionDates: direct("South Dakota — 2026 Election Information", "https://sdsos.gov/elections-voting/upcoming-elections/general-information/", "https://www.sdsos.gov/elections-voting/default.aspx"),
    registration: direct("South Dakota Voter Information Portal — registration check", "https://vip.sdsos.gov/VIPLogin.aspx", "https://www.sdsos.gov/elections-voting/voting/register-to-vote/"),
    earlyVoting: direct("South Dakota Secretary of State — In-person absentee voting", "https://sdsos.gov/elections-voting/voting/absentee-voting.aspx", "https://www.sdsos.gov/elections-voting/voting/absentee-voting.aspx"),
    absentee: direct("South Dakota Secretary of State — Absentee Voting", "https://sdsos.gov/elections-voting/voting/absentee-voting.aspx", "https://www.sdsos.gov/elections-voting/default.aspx"),
    ballot: direct("South Dakota Voter Information Portal — sample ballot", "https://vip.sdsos.gov/VIPLogin.aspx", "https://www.sdsos.gov/elections-voting/voting/register-to-vote/"),
    pollingPlace: direct("South Dakota Voter Information Portal — polling place lookup", "https://vip.sdsos.gov/VIPLogin.aspx", "https://sdsos.gov/elections-voting/voting/where-do-i-vote.aspx"),
    whatToBring: direct("South Dakota — voter ID and voting information", "https://www.sdsos.gov/elections-voting/voting/default.aspx", "https://www.sdsos.gov/elections-voting/default.aspx"),
    electionOffice: direct("South Dakota County Auditor Contact List", "https://vip.sdsos.gov/CountyAuditors.aspx", "https://sdsos.gov/elections-voting/voting/absentee-voting.aspx"),
  },  WV: {
    ...Object.fromEntries(Object.entries(CURATED_STATE_RESOURCE_OVERRIDES.WV ?? {}).map(([type, source]) => [type, type === "electionOffice" ? fallback(source.name, source.url, "https://sos.wv.gov/elections") : direct(source.name, source.url, "https://sos.wv.gov/elections")])),
  },
};
for (const [code, resources] of Object.entries(DIRECT_RESOURCES)) Object.assign(STATE_RESOURCES[code], resources);

export function votingResource(type: VotingResourceType, stateCode?: string): OfficialSource {
  const direct = stateCode ? STATE_RESOURCES[stateCode]?.[type] : undefined;
  if (direct) return direct;
  if (stateCode && STATE_ELECTION_OFFICE[stateCode]) {
    const office = STATE_ELECTION_OFFICE[stateCode];
    return { ...office, name: `${office.name} — official resource index (fallback)` };
  }
  return NATIONAL_VOTING_RESOURCES[type];
}

export function messageResourceType(presetId: string): VotingResourceType {
  if (presetId.includes("-info")) return "electionOffice";
  if (presetId === "social-reminder") return "pollingPlace";
  if (presetId === "email-reminder") return "ballot";
  return "registration";
}

export type ElectionType =
  | "presidential"
  | "midterm"
  | "federal_primary"
  | "state"
  | "local"
  | "special"
  | "runoff"
  | "ballot_measure";
export type ElectionScope = "Federal" | "State" | "Local";
export type ElectionInfo = {
  id: string;
  name: string;
  date: string;
  type: ElectionType;
  scope: ElectionScope;
  stateCode?: string;
  registrationDeadline?: string;
  source: OfficialSource;
  expired?: boolean;
};

export const UPCOMING_ELECTIONS: ElectionInfo[] = [
  {
    id: "2026-federal-midterm",
    name: "2026 Federal Midterm General Election",
    date: "2026-11-03",
    type: "midterm",
    scope: "Federal",
    source: { name: "USA.gov — Congressional and Midterm Elections", url: "https://www.usa.gov/midterm-elections" },
  },
  {
    id: "2028-presidential-general",
    name: "2028 Presidential General Election",
    date: "2028-11-07",
    type: "presidential",
    scope: "Federal",
    source: { name: "USA.gov — Presidential Election Process", url: "https://www.usa.gov/presidential-election-process" },
  },
];

export function localCalendarDate(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function nextKnownElection(today = localCalendarDate()): ElectionInfo | undefined {
  return UPCOMING_ELECTIONS
    .map((e) => ({ ...e, ...electionStatus(e, today) }))
    .filter((e) => !e.expired)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
}

export function electionStatus(election: ElectionInfo, today = localCalendarDate()) {
  return { expired: election.date < today };
}

export const ELECTION_TYPE_LABELS: Record<ElectionType, string> = {
  presidential: "Presidential",
  midterm: "Midterm / Congressional",
  federal_primary: "Federal primary",
  state: "State election",
  local: "Local election",
  special: "Special election",
  runoff: "Runoff",
  ballot_measure: "Ballot measure",
};

export function electionCardData(election: ElectionInfo, stateCode?: string) {
  return {
    ...election,
    resources: [
      { type: "electionDates", label: "State and local election dates", source: votingResource("electionDates", stateCode) },
      { type: "registration", label: "Registration and deadlines", source: votingResource("registration", stateCode) },
      { type: "earlyVoting", label: "Early voting information", source: votingResource("earlyVoting", stateCode) },
      { type: "absentee", label: "Mail and absentee voting", source: votingResource("absentee", stateCode) },
      { type: "ballot", label: "Sample ballot / What’s on my ballot", source: votingResource("ballot", stateCode) },
      { type: "pollingPlace", label: "Find polling place", source: votingResource("pollingPlace", stateCode) },
      { type: "electionOffice", label: "Local/state election office", source: votingResource("electionOffice", stateCode) },
    ],
  };
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
  { id: "election-day", label: "Election Day Info", icon: "calendar" },
];

/* ---------- help needs ---------- */
export const HELP_NEEDS: { id: string; label: string; icon: string; source: keyof typeof NATIONAL | "state"; blurb: string }[] = [
  { id: "register", label: "Register to Vote", icon: "edit", source: "register", blurb: "Register or update your address at the official government site. Takes a few minutes; have your ID or SSN handy." },
  { id: "check", label: "Check Registration", icon: "search", source: "checkStatus", blurb: "Confirm you're registered at your current address before any deadlines." },
  { id: "where", label: "Find Where to Vote", icon: "pin", source: "state", blurb: "Look up your assigned polling place or a nearby early-voting site from your state's official tool." },
  { id: "bring", label: "What Do I Bring?", icon: "id", source: "state", blurb: "ID rules vary by state. Check what counts as acceptable ID where you live." },
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
