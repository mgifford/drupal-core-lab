/**
 * @file
 * Compare the "before" and "after" screen-reader captures and print a summary.
 *
 * Usage: node diff.mjs   (after running test:before and test:after)
 */
import { readFileSync } from "node:fs";

function load(label) {
  return JSON.parse(readFileSync(`sr-output/screenreader-${label}.json`, "utf8"));
}

function has(list, needle) {
  return list.join("\n").toLowerCase().includes(needle.toLowerCase());
}

let before;
let after;
try {
  before = load("before");
  after = load("after");
}
catch (e) {
  console.error("Could not load both captures. Run `npm run test:before` and `npm run test:after` first.");
  console.error(String(e.message || e));
  process.exit(1);
}

const checks = [
  {
    name: 'Hidden managed_file is NOT announced on load (default state)',
    before: !has(before.defaultState, "managed file — initially hidden"),
    after: !has(after.defaultState, "managed file — initially hidden"),
  },
  {
    name: 'Required is announced after toggling (Scenario 2)',
    before: has(before.afterToggles, "required"),
    after: has(after.afterToggles, "required"),
  },
  {
    name: 'Fieldset text still announced after toggle (Scenario 3, WCAG 3.3.1)',
    before: has(before.afterToggles, "this field should always stay visible"),
    after: has(after.afterToggles, "this field should always stay visible"),
  },
];

console.log("\nScreen-reader semantics: before vs after MR !7305\n");
for (const c of checks) {
  const flip = c.before !== c.after ? "  <-- changed" : "";
  console.log(`- ${c.name}`);
  console.log(`    before: ${c.before}   after: ${c.after}${flip}`);
}
console.log("\nFull phrase logs are in sr-output/screenreader-{before,after}.json.\n");
