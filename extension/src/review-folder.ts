export function reviewFolder(configured: string | undefined, workspacePath: string | undefined): string {
  const trimmed = typeof configured === "string" ? configured.trim() : "";
  if (trimmed) return trimmed;
  if (!workspacePath) throw new Error("Open a workspace folder");
  return workspacePath;
}
