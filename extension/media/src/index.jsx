import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { App } from "./App.jsx";
import { bootDesk } from "./graph/desk.js";

const el = document.getElementById("root");
if (!el) {
  throw new Error("Graphide desk: #root missing");
}

const root = createRoot(el);
flushSync(() => {
  root.render(<App />);
});
bootDesk();
