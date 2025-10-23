class Dialog {
  /**
   * @type {HTMLDialogElement}
   */
  dialog;

  /**
   * @type {HTMLButtonElement}
   */
  dialogBtnOpen;

  /**
   * @param {string} identifier os the suffix to "dialog-" element ids to search for 
   * @param {boolean} optional is if a dialog may not be rendered for some reason
   */
  constructor(identifier, optional) {
    try {
      this.dialog = this.mustEl("dialog-" + identifier);
      this.dialogBtnOpen = this.mustEl("dialog-open-" + identifier);
    } catch (err) {
      if (optional) {
        return;
      }
      console.error(err);
    }
    this.addListeners();
  }

  mustEl(s) {
    const el = document.getElementById(s);
    if (!el) {
      throw new Error("missing element: " + JSON.stringify(s));
    }
    return el;
  }

  addListeners() {
    this.dialogBtnOpen.addEventListener("click", () => {
      console.log("showModal");
      this.dialog.showModal();
    });
  }
}

function discoverDialogs() {
  console.log("discoverDialogs");

  new Dialog("schema");
  new Dialog("entity");
  new Dialog("attribute");
  new Dialog("examples");

  new Dialog("settings");
  new Dialog("download", true);
}

window.addEventListener("DOMContentLoaded", () => {
  discoverDialogs();
  document.body.addEventListener("htmx:afterSettle", () => {
    discoverDialogs();
  });
});
