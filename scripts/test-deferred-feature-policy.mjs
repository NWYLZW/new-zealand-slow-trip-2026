import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const file = fileURLToPath(new URL("../src/adventure/AdventureDeferredFeature.jsx", import.meta.url));
const source = await readFile(file, "utf8");

assert.match(source, /featureLoadTimeout\s*=\s*15000/, "Feature loads need a finite timeout");
assert.match(source, /lazy\(\(\) => loadWithTimeout\(load\)\)/, "All lazy features must use the timeout wrapper");
assert.match(source, /setAttempt\(value => value \+ 1\)/, "Feature errors need a retry path");
assert.match(source, /role=\{failed \? "alert" : "status"\}/, "Feature failures need accessible feedback");

console.log(JSON.stringify({ timeoutMs: 15000, retry: true, failureFeedback: true }));
