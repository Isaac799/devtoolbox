class LocalStorageManager {
    constructor(inputSelector) {
      this.input = document.getElementById(inputSelector);
      
      if (!this.input) {
        console.info("Input element not found.");
        return;
      }
  
      this.storageKey = this.input.name ? `input-${this.input.name}` : 'input-value';
  
      this.loadFromLocalStorage();
  
      this.input.addEventListener("input", () => {
        this.saveToLocalStorage(this.input.value);
      });
    }
  
    saveToLocalStorage(value) {
      try {
        const data = { value, timestamp: Date.now() };
        localStorage.setItem(this.storageKey, JSON.stringify(data));
      } catch (error) {
        console.error(`Error saving to localStorage: ${error.message}`);
      }
    }
  
    loadFromLocalStorage() {
      try {
        const savedData = localStorage.getItem(this.storageKey);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          if (parsedData && Date.now() - parsedData.timestamp < 48 * 60 * 60 * 1000) {
            this.input.value = parsedData.value;
          }
        }
      } catch (error) {
        console.error(`Error loading from localStorage: ${error.message}`);
      }
    }
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    new LocalStorageManager("input");
  });
  