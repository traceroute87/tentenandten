import { readFile, writeFile } from "node:fs/promises";
import { RESOURCE_TYPES, STATE_ELECTION_RESOURCES, STATES, NATIONAL_VOTING_RESOURCES } from "../src/data.ts";

const checkedAt = new Date().toISOString();
const records = [
  ...STATE_ELECTION_RESOURCES,
  ...RESOURCE_TYPES.map((resourceType) => ({
    state: "US", jurisdiction: "United States", resourceType,
    label: NATIONAL_VOTING_RESOURCES[resourceType].name,
    url: NATIONAL_VOTING_RESOURCES[resourceType].url,
    sourceAuthority: NATIONAL_VOTING_RESOURCES[resourceType].url,
    lastChecked: "", verificationStatus: "verified" as const, quality: "fallback" as const,
  })),
];

function normalizeUrl(raw: string): string | undefined {
  try {
    const url = new URL(raw);
    if (!/^https?:$/.test(url.protocol)) return undefined;
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key);
    url.searchParams.sort();
    url.pathname = url.pathname.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
    return url.toString();
  } catch {
    return undefined;
  }
}

function genericDestination(raw: string): boolean {
  const path = new URL(raw).pathname.toLowerCase().replace(/\/+$/, "");
  return path === "" || path === "/" || /^\/(elections?|voting|voters?|vote)$/.test(path);
}

async function checkUrl(raw: string) {
  const redirects: string[] = [];
  let url = raw;
  let method = "GET";
  for (let hop = 0; hop <= 8; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    let response: Response;
    try {
      response = await fetch(url, { method, redirect: "manual", signal: controller.signal, headers: { "user-agent": "10-10-10-resource-audit/1.0" } });
    } catch (error) {
      clearTimeout(timer);
      return { httpStatus: null, success: false, finalUrl: url, redirected: redirects.length > 0, redirects, method, error: error instanceof Error ? error.message : String(error) };
    }
    clearTimeout(timer);
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return { httpStatus: response.status, success: false, finalUrl: url, redirected: true, redirects, method, error: "redirect response had no Location header" };
      const next = new URL(location, url).toString();
      redirects.push(next);
      url = next;
      continue;
    }
    let pageTitle = "";
    if (response.ok && method === "GET" && /text\/html/i.test(response.headers.get("content-type") ?? "")) {
      const html = await response.text();
      pageTitle = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
    } else {
      await response.body?.cancel().catch(() => {});
    }
    return { httpStatus: response.status, success: response.ok, finalUrl: url, redirected: redirects.length > 0, redirects, method, pageTitle, error: response.ok ? "" : response.statusText || "HTTP request failed" };
  }
  return { httpStatus: null, success: false, finalUrl: url, redirected: true, redirects, method, error: "redirect limit exceeded" };
}

const byState = new Map<string, typeof records>();
for (const row of records) byState.set(row.state, [...(byState.get(row.state) ?? []), row]);

const missingTypes = STATES.flatMap(({ code }) => {
  const types = new Set(STATE_ELECTION_RESOURCES.filter((row) => row.state === code).map((row) => row.resourceType));
  return RESOURCE_TYPES.filter((type) => !types.has(type)).map((resourceType) => ({ state: code, resourceType }));
});

const fallbackCountPerState = STATES.map(({ code, name }) => ({
  state: code,
  jurisdiction: name,
  count: STATE_ELECTION_RESOURCES.filter((row) => row.state === code && row.quality === "fallback").length,
}));

const duplicateMap = new Map<string, typeof records>();
for (const row of STATE_ELECTION_RESOURCES) {
  const normalizedUrl = normalizeUrl(row.url);
  if (normalizedUrl) {
    const key = `${row.state}\t${normalizedUrl}`;
    duplicateMap.set(key, [...(duplicateMap.get(key) ?? []), row]);
  }
}
const duplicateDestinations = [...duplicateMap.entries()].filter(([, rows]) => rows.length > 1).map(([key, rows]) => {
  const normalizedUrl = key.slice(key.indexOf("\t") + 1);
  const sharedPortal = /\b(voter|myvote|my-vote|voterview|portal|lookup|registration-check)\b/i.test(normalizedUrl);
  return { state: rows[0].state, normalizedUrl, resourceTypes: rows.map((row) => row.resourceType), labels: rows.map((row) => row.label), quality: rows.map((row) => row.quality), suspectedSharedPortal: sharedPortal };
});

const suspiciousGenericDestinations = STATE_ELECTION_RESOURCES.filter((row) => row.quality === "fallback" && genericDestination(row.url)).map((row) => ({ state: row.state, resourceType: row.resourceType, label: row.label, url: row.url }));
const malformedUrls = records.filter((row) => !normalizeUrl(row.url)).map((row) => ({ state: row.state, resourceType: row.resourceType, url: row.url }));

const uniqueUrls = [...new Set(records.map((row) => row.url))];
const urlChecks = new Map<string, Awaited<ReturnType<typeof checkUrl>>>();
let next = 0;
const workers = Array.from({ length: 8 }, async () => {
  while (next < uniqueUrls.length) {
    const url = uniqueUrls[next++];
    urlChecks.set(url, await checkUrl(url));
  }
});
await Promise.all(workers);

const results = records.map((row) => ({ ...row, normalizedUrl: normalizeUrl(row.url) ?? "", http: urlChecks.get(row.url) }));
let auditMatrix: Array<Record<string, unknown>> = [];
try { auditMatrix = JSON.parse(await readFile(new URL("../state-election-resource-audit.json", import.meta.url), "utf8")); } catch { /* exporter may not have been run yet */ }
const auditByKey = new Map(auditMatrix.map((row) => [`${row.state}:${row.resourceType}`, row]));
const checkedMatrix = STATE_ELECTION_RESOURCES
  .filter((row) => row.resourceType !== "whatToBring")
  .map((row) => {
    const prior = auditByKey.get(`${row.state}:${row.resourceType}`) ?? {};
    const http = urlChecks.get(row.url);
    return {
      ...prior,
      state: row.state,
      resourceType: row.resourceType,
      finalUrl: row.url,
      pageTitle: http?.pageTitle || "",
      sourceAuthority: row.sourceAuthority,
      classification: row.quality.toUpperCase(),
      verificationStatus: row.verificationStatus,
      lastChecked: row.quality === "fallback" || row.verificationStatus === "unverified_due_to_access_limit" ? "" : row.lastChecked || (http?.success ? checkedAt.slice(0, 10) : ""),
      verificationNote: `${(prior.verificationNote ?? "Official-source semantic review required.").replace(/ Automated HTTP .*$/, "")} Verification status: ${row.verificationStatus}. Automated HTTP ${http?.success ? `returned ${http.httpStatus}${http.redirected ? ` after redirect to ${http.finalUrl}` : ""}` : `did not verify reachability${http?.httpStatus ? ` (HTTP ${http.httpStatus})` : ""}`}.`,
    };
  });
const report = {
  checkedAt,
  summary: {
    jurisdictions: STATES.length,
    resources: records.length,
    uniqueUrls: uniqueUrls.length,
    httpSuccess: results.filter((row) => row.http?.success).length,
    httpFailure: results.filter((row) => !row.http?.success).length,
    redirects: [...urlChecks.values()].filter((result) => result.redirected).length,
    duplicateDestinations: duplicateDestinations.length,
    missingTypes: missingTypes.length,
    malformedUrls: malformedUrls.length,
    statesWithThreeOrMoreFallbacks: fallbackCountPerState.filter((row) => row.count >= 3),
  },
  fallbackCountPerState,
  duplicateDestinations,
  suspiciousGenericDestinations,
  missingTypes,
  malformedUrls,
  brokenOrRedirectedUrls: [...urlChecks.entries()].filter(([, result]) => !result.success || result.redirected).map(([url, result]) => ({ url, ...result })),
    resources: results,
    auditMatrix: checkedMatrix,
};

const output = process.argv.find((arg) => arg.startsWith("--output="))?.slice("--output=".length) ?? "state-election-resource-validation.json";
await writeFile(new URL(`../${output}`, import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(new URL("../state-election-resource-audit.json", import.meta.url), `${JSON.stringify(checkedMatrix, null, 2)}\n`);
console.log(JSON.stringify(report.summary, null, 2));
console.log(`Report written to ${output}`);
if (missingTypes.length || malformedUrls.length || results.some((row) => !row.http?.success)) process.exitCode = 1;
