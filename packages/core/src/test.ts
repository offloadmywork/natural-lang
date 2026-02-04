import { parse } from "./parser.js";
import * as fs from "fs";
import * as path from "path";

// Read the example file
const examplePath = path.join(__dirname, "../../../examples/simple.nl");
const content = fs.readFileSync(examplePath, "utf-8");

console.log("Parsing example.nl...\n");

const result = parse(content);

console.log("AST:");
console.log(JSON.stringify(result.ast, null, 2));

console.log("\n\nDiagnostics:");
for (const diag of result.diagnostics) {
  const severity = diag.severity.toUpperCase();
  console.log(`[${severity}] Line ${diag.range.start.line + 1}: ${diag.message}`);
}

console.log("\n\nConcepts found:");
const concepts = new Set<string>();
for (const section of result.ast.sections) {
  for (const concept of section.concepts) {
    concepts.add(concept.name);
  }
}
console.log([...concepts].sort().join(", "));
