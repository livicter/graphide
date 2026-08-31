export function KeysPane() {
  return (
    <aside id="keysPane" hidden>
      <div className="keys-head">
        <b>Keys</b>
        <button type="button" id="keysClose" title="Close shortcuts">
          Close
        </button>
      </div>
      <ul>
        <li>
          <kbd>1</kbd>–<kbd>9</kbd> workspaces
        </li>
        <li>
          <kbd>/</kbd> find · <kbd>?</kbd> this sheet
        </li>
        <li>
          <kbd>S</kbd> stamp · <kbd>X</kbd> skip
        </li>
        <li>
          <kbd>P</kbd> play path · <kbd>[</kbd> <kbd>]</kbd> step
        </li>
        <li>
          <kbd>R</kbd> PATH · <kbd>L</kbd> LENS · <kbd>E</kbd> ego
        </li>
        <li>
          <kbd>F</kbd> present · Style button cycles Classic / Signal / Blueprint
        </li>
        <li>
          <kbd>D</kbd> day / night
        </li>
        <li>
          <kbd>+</kbd> <kbd>−</kbd> zoom · <kbd>0</kbd> fit · Backspace back
        </li>
      </ul>
    </aside>
  );
}
