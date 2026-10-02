import { writeFile } from "node:fs/promises";
import { RESOURCE_TYPES, STATES, STATE_RESOURCES, NATIONAL_VOTING_RESOURCES } from "../src/data.ts";

const rows = [
  ...STATES.flatMap(({ code, name }) => RESOURCE_TYPES.map((type) => ({
    state: code, jurisdiction: name, resourceType: type, ...STATE_RESOURCES[code][type],
  }))),
  ...RESOURCE_TYPES.map((resourceType) => ({
    state: "US", jurisdiction: "United States", resourceType,
    ...NATIONAL_VOTING_RESOURCES[resourceType], status: "national-fallback", verifiedDate: "",
    validationSource: NATIONAL_VOTING_RESOURCES[resourceType].url,
  })),
];

await writeFile(new URL("../state-election-resources.json", import.meta.url), `${JSON.stringify(rows, null, 2)}\n`);
