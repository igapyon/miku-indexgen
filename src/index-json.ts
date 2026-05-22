import type { RootIndex } from "./types.js";

export function formatIndexJson(index: RootIndex): string {
  const lines = ["{"];
  const rootProperties: Array<[string, unknown]> = [
    ["title", index.title],
    ["generator", index.generator],
    ["generation", index.generation],
    ["basePath", index.basePath],
  ];

  for (const [name, value] of rootProperties) {
    if (value !== undefined) {
      lines.push(` ${JSON.stringify(name)}: ${JSON.stringify(value)},`);
    }
  }

  lines.push(' "files": [');
  for (const [indexNumber, file] of index.files.entries()) {
    const comma = indexNumber + 1 < index.files.length ? "," : "";
    lines.push(`  ${JSON.stringify(file)}${comma}`);
  }
  lines.push(" ]");
  lines.push("}");

  return `${lines.join("\n")}\n`;
}
