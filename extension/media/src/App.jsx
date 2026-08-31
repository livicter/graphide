import { ExportMenu } from "./chrome/ExportMenu.jsx";
import { GraphBar } from "./chrome/GraphBar.jsx";
import { Header } from "./chrome/Header.jsx";
import { KeysPane } from "./chrome/KeysPane.jsx";
import { LlmPane } from "./chrome/LlmPane.jsx";
import { ProbeDock } from "./chrome/ProbeDock.jsx";
import { Progress } from "./chrome/Progress.jsx";
import { Workspace } from "./chrome/Workspace.jsx";

/** Apple desk chrome. Same ids as the previous static html() / harness document. */
export function App() {
  return (
    <>
      <Header />
      <div id="tip" hidden />
      <div id="toast" hidden role="status" />
      <KeysPane />
      <ExportMenu />
      <Progress />
      <GraphBar />
      <ProbeDock />
      <section id="meta" />
      <Workspace />
      <section id="coverage" />
      <LlmPane />
      <footer id="status" />
    </>
  );
}
