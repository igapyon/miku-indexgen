export function sanitizeTextForIndex(text: string): string {
  return text
    .normalize("NFC")
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g, " ")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, " ")
    .replace(/[\r\n\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateTextForIndex(text: string, maxLength = 256, omission = "..."): string {
  if (text.length <= maxLength) {
    return text;
  }

  if (maxLength <= omission.length) {
    return omission.slice(0, maxLength);
  }

  return `${text.slice(0, maxLength - omission.length)}${omission}`;
}
