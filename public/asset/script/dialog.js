window.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("htmx:afterSettle", () => {
    const dialogs = document.getElementsByTagName("dialog");
    for (const dialog of dialogs) {
      dialog.showModal();
      dialog.addEventListener("close", () => {
        dialog.remove();
      });
    }
  });
});
