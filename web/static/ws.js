class WebSocketManager {
  constructor() {
    this.socket = null;
    this.debounceTimer = null;
    this.loadingOverlay = document.getElementById("loadingOverlay");
    this.input = document.getElementById("input");
    this.output = document.getElementById("output");

    if (!this.loadingOverlay || !this.input || !this.output) {
      console.info("required elements are missing for ws functionality");
      return;
    }
   
    this.input.disabled = true; // Disable input initially
    this.connectWebSocket();

    this.input.addEventListener("input", () => this.handleInput());
  }

  showLoading() {
    this.loadingOverlay.style.display = "flex";
    this.output.innerText = "waiting";
  }

  hideLoading() {
    this.loadingOverlay.style.display = "none";
  }

  handleInput() {
    clearTimeout(this.debounceTimer);
    this.showLoading();

    this.debounceTimer = setTimeout(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(this.input.value);
        this.output.innerText = "processing";
      } else {
        this.hideLoading();
        this.output.innerText = "cannot process";
        console.warn("WebSocket is not open. Message not sent.");
      }
    }, 500);
  }

  handleMessage(event) {
    this.output.innerText = event.data;
    this.hideLoading();
  }

  handleOpen() {
    console.log("WebSocket connection established.");
    this.output.innerText = "connected";
    this.input.disabled = false; // Enable input when connected
    this.handleInput()
  }

  handleError(error) {
    console.error("WebSocket error:", error);
  }

  handleClose() {
    console.log("WebSocket connection closed");
    this.output.innerText = "disconnected, trying to reconnect...";
    this.input.disabled = true; // Disable input when disconnected
    this.attemptReconnect();
  }

  attemptReconnect() {
    setTimeout(() => {
      this.connectWebSocket();
    }, 5000);
  }

  connectWebSocket() {
    this.socket = new WebSocket(`ws://${window.location.host}/ws/boilerplate`);

    this.socket.addEventListener("open", () => this.handleOpen());
    this.socket.addEventListener("error", (error) => this.handleError(error));
    this.socket.addEventListener("close", () => this.handleClose());
    this.socket.addEventListener("message", (event) => this.handleMessage(event));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new WebSocketManager();
});
