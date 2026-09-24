/** Argv tail for `graphide review`. Same flags `runReview` and the herd command pass. */

export function reviewArgv(
  root: string,
  opts?: { parent?: string; noParent?: boolean; flows?: string[] }
): string[] {
  const args = ["review", "--root", root, "--json", "--progress"];
  if (opts?.noParent && opts?.parent) {
    throw new Error("pass only one of --parent and --no-parent");
  }
  if (opts?.noParent) args.push("--no-parent");
  else if (opts?.parent) args.push("--parent", opts.parent);
  for (const f of opts?.flows || []) {
    if (f) args.push("--flow", f);
  }
  return args;
}
