import { readFileSync, writeFileSync } from "node:fs";
import iconv from "iconv-lite";

export function normalizeEncodingName(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[-\s]/g, "_");

  switch (normalized) {
    case "utf8":
    case "utf_8":
      return "utf8";
    case "shiftjis":
    case "shift_jis":
    case "sjis":
    case "ms_kanji":
    case "cp932":
    case "windows_31j":
      return "shift_jis";
    default:
      throw new Error(`Unsupported encoding: ${value}`);
  }
}

export function parseEncodingOption(value: string): string {
  const encoding = normalizeEncodingName(value);
  if (!iconv.encodingExists(encoding)) {
    throw new Error(`Unsupported encoding: ${value}`);
  }
  return encoding;
}

export function readTextFile(filePath: string, encoding: string): string {
  return iconv.decode(readFileSync(filePath), encoding);
}

export function writeTextFile(filePath: string, content: string, encoding: string): void {
  writeFileSync(filePath, iconv.encode(content, encoding));
}
