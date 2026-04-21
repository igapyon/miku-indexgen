import { basename } from "node:path";

export function toPosixPath(path: string): string {
  return path.split("\\").join("/");
}

export function getFileExtension(filePath: string): string {
  const fileName = basename(filePath);
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex <= 0 || lastDotIndex === fileName.length - 1) {
    return "";
  }

  return fileName.slice(lastDotIndex + 1).toLowerCase();
}

export function getFileName(filePath: string): string {
  return basename(filePath);
}
