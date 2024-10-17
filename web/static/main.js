document.addEventListener("DOMContentLoaded", () => {
  let socket = null;
  let debounceTimer = null;
  const loadingOverlay = document.getElementById("loadingOverlay");
  const input = document.getElementById("input");
  const output = document.getElementById("output");

  if (!loadingOverlay || !input || !output) {
    console.info("Required elements are missing for WebSocket functionality");
    return;
  }

  input.disabled = true; // Disable input initially
  connectWebSocket();

  input.addEventListener("input", handleInput);

  function showLoading() {
    loadingOverlay.style.display = "flex";
    output.innerText = "waiting";
  }

  function hideLoading() {
    loadingOverlay.style.display = "none";
  }

  function handleInput() {
    clearTimeout(debounceTimer);
    showLoading();

    debounceTimer = setTimeout(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(input.value);
        output.innerText = "processing";
      } else {
        hideLoading();
        output.innerText = "cannot process";
        console.warn("WebSocket is not open. Message not sent.");
      }
    }, 500);
  }

  function handleMessage(event) {
    const highlightedContent = parseData(event.data);

    if (highlightedContent) {
      output.innerHTML = highlightedContent;
    }

    hideLoading();
  }

  function parseData(data) {
    const parts = data.trim().split("|");

    if (parts.length < 2) {
      return null; // Not enough data to parse
    }

    const filename = parts[0];
    const fileContent = parts[1];
    const fileExtension = filename.split(".").pop();

    let highlightedContent;

    switch (fileExtension) {
      case "js":
        highlightedContent = hljs.highlight(fileContent, { language: "javascript" }).value;
        break;
      case "html":
        highlightedContent = hljs.highlight(fileContent, { language: "html" }).value;
        break;
      case "css":
        highlightedContent = hljs.highlight(fileContent, { language: "css" }).value;
        break;
      case "pgsql":
        highlightedContent = hljs.highlight(fileContent, { language: "pgsql" }).value;
        break;
      case "sql":
        highlightedContent = hljs.highlight(fileContent, { language: "sql" }).value;
        break;
      default:
        highlightedContent = "failed to parse response";
        break;
    }

    return highlightedContent;
  }

  function handleOpen() {
    console.log("WebSocket connection established.");
    output.innerText = "connected";
    input.disabled = false; // Enable input when connected
    handleInput();
  }

  function handleError(error) {
    console.error("WebSocket error:", error);
  }

  function handleClose() {
    console.log("WebSocket connection closed");
    output.innerText = "disconnected, trying to reconnect...";
    input.disabled = true; // Disable input when disconnected
    attemptReconnect();
  }

  function attemptReconnect() {
    setTimeout(() => {
      connectWebSocket();
    }, 5000);
  }

  function connectWebSocket() {
    socket = new WebSocket(`ws://${window.location.host}/ws/boilerplate`);

    socket.addEventListener("open", handleOpen);
    socket.addEventListener("error", handleError);
    socket.addEventListener("close", handleClose);
    socket.addEventListener("message", handleMessage);
  }
});
