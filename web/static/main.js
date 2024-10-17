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
    // const highlightedContent = parseData(event.data);

    // if (highlightedContent) {
    //   output.innerHTML = highlightedContent;
    // }

    output.innerHTML = event.data

    hideLoading();
  }

  // function parseData(data) {
  //   const parts = data.split("|");

  //   if (parts.length < 2) {
  //     return null; // Not enough data to parse
  //   }

  //   const highlightedContents = [];

  //   for (let i = 0; i < parts.length; i += 2) {
  //     const filename = parts[i];
  //     const fileContent = parts[i + 1];

  //     if (!fileContent) {
  //       console.error("Missing content for filename:", filename);
  //       continue;
  //     }

  //     const fileExtension = filename.split(".").pop();
  //     let highlightedContent;

  //     const options = {
  //       language: fileExtension,
  //     };

  //     switch (fileExtension) {
  //       case "js":
  //         highlightedContent = hljs.highlight(fileContent, {
  //           ...options,
  //           language: "javascript",
  //         }).value;
  //         break;
  //       case "html":
  //         highlightedContent = hljs.highlight(fileContent, {
  //           ...options,
  //           language: "html",
  //         }).value;
  //         break;
  //       case "css":
  //         highlightedContent = hljs.highlight(fileContent, {
  //           ...options,
  //           language: "css",
  //         }).value;
  //         break;
  //       case "pgsql":
  //         highlightedContent = hljs.highlight(fileContent, {
  //           ...options,
  //           language: "pgsql",
  //         }).value;
  //         break;
  //       case "sql":
  //         highlightedContent = hljs.highlight(fileContent, {
  //           ...options,
  //           language: "sql",
  //         }).value;
  //         break;
  //       default:
  //         console.error("Failed to parse response");
  //         console.log("\tfilename :>> ", filename);
  //         console.log("\tfileExtension :>> ", fileExtension);
  //         highlightedContent = fileContent; // Fallback to plain content
  //         break;
  //     }

  //     highlightedContents.push(highlightedContent);
  //   }

  //   return highlightedContents;
  // }

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
