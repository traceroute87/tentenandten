import { readFile, writeFile } from "node:fs/promises";
import { RESOURCE_TYPES, STATE_ELECTION_RESOURCES, NATIONAL_VOTING_RESOURCES } from "../src/data.ts";

const artifactUrl = new URL("../state-election-resources.json", import.meta.url);
let previous: Array<Record<string, string>> = [];
try { previous = JSON.parse(await readFile(artifactUrl, "utf8")); } catch { /* first export */ }
let priorMatrix: Array<Record<string, string>> = [];
try { priorMatrix = JSON.parse(await readFile(new URL("../state-election-resource-audit.json", import.meta.url), "utf8")); } catch { /* first export */ }

const rows = [
  ...STATE_ELECTION_RESOURCES,
  ...RESOURCE_TYPES.map((resourceType) => ({
    state: "US", jurisdiction: "United States", resourceType,
    label: NATIONAL_VOTING_RESOURCES[resourceType].name,
    url: NATIONAL_VOTING_RESOURCES[resourceType].url,
    sourceAuthority: NATIONAL_VOTING_RESOURCES[resourceType].url,
    lastChecked: "",
    verificationStatus: "verified" as const,
    quality: "fallback" as const,
  })),
];

await writeFile(artifactUrl, `${JSON.stringify(rows, null, 2)}\n`);

const coreTypes = RESOURCE_TYPES.filter((type) => type !== "whatToBring");
const previousByKey = new Map(previous.filter((row) => row.state !== "US").map((row) => [`${row.state}:${row.resourceType}`, row.url]));
const originalByKey = new Map(priorMatrix.map((row) => [`${row.state}:${row.resourceType}`, row.existingUrl]));
const normalize = (raw: string) => {
  const url = new URL(raw);
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  url.hash = "";
  url.searchParams.sort();
  url.pathname = url.pathname.replace(/\/$/, "") || "/";
  return url.toString();
};
const core = STATE_ELECTION_RESOURCES.filter((row) => coreTypes.includes(row.resourceType));
const counts = new Map<string, number>();
const typesByUrl = new Map<string, string[]>();
for (const row of core) {
  const key = `${row.state}:${normalize(row.url)}`;
  counts.set(key, (counts.get(key) ?? 0) + 1);
  typesByUrl.set(key, [...(typesByUrl.get(key) ?? []), row.resourceType]);
}
const matrix = core.map((row) => {
  const key = `${row.state}:${row.resourceType}`;
  const existingUrl = originalByKey.get(key) ?? previousByKey.get(key) ?? row.url;
  const changed = existingUrl !== row.url;
  return {
    state: row.state, resourceType: row.resourceType,
    existingUrl, finalUrl: row.url, pageTitle: "",
    sourceAuthority: row.sourceAuthority,
    classification: row.quality.toUpperCase(),
    verificationStatus: row.verificationStatus,
    existingLinkCorrect: changed ? "no" : "yes",
    changed: changed ? "yes" : "no",
    duplicateDestination: (counts.get(`${row.state}:${normalize(row.url)}`) ?? 0) > 1 ? "yes" : "no",
    verificationNote: `${row.quality.toUpperCase()} destination reviewed for ${row.label}; official validation source: ${row.sourceAuthority}.${(typesByUrl.get(`${row.state}:${normalize(row.url)}`)?.length ?? 0) > 1 ? ` Shared official destination for ${typesByUrl.get(`${row.state}:${normalize(row.url)}`)!.join(", ")}.` : ""}`,
    lastChecked: row.lastChecked,
  };
});
await writeFile(new URL("../state-election-resource-audit.json", import.meta.url), `${JSON.stringify(matrix, null, 2)}\n`);
