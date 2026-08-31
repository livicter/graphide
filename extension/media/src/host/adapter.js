/**
 * VS Code / harness host. acquireVsCodeApi may be called once per webview.
 * The harness sets window.acquireVsCodeApi before main.js. The real host
 * injects the same global into the webview script scope.
 */
export function acquireHost() {
  const fn =
    typeof acquireVsCodeApi === "function"
      ? acquireVsCodeApi
      : typeof window !== "undefined"
        ? window.acquireVsCodeApi
        : null;
  if (typeof fn !== "function") {
    throw new Error("Graphide desk: acquireVsCodeApi is missing");
  }
  return fn();
}
