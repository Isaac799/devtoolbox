class NavbarManager {
    constructor() {
      this.burger = document.querySelector(".navbar-burger");
      this.menu = document.querySelector("#navbar");
      this.notificationDeletes = document.querySelectorAll('.notification .delete');
  
      this.init();
    }
  
    init() {
      this.setupBurgerToggle();
      this.setupNotificationDeletes();
    }
  
    setupBurgerToggle() {
      if (this.burger && this.menu) {
        this.burger.addEventListener("click", () => {
          this.burger.classList.toggle("is-active");
          this.menu.classList.toggle("is-active");
        });
      } else {
        console.error("Navbar burger or menu not found.");
      }
    }
  
    setupNotificationDeletes() {
      if (this.notificationDeletes.length > 0) {
        this.notificationDeletes.forEach(($delete) => {
          const $notification = $delete.parentNode;
  
          $delete.addEventListener('click', () => {
            if ($notification && $notification.parentNode) {
              $notification.parentNode.removeChild($notification);
            } else {
              console.error("Notification or parent node not found.");
            }
          });
        });
      }
    }
  }
  
  class ModalManager {
    constructor(modalId, confirmButtonId, deleteFormId) {
      this.modalId = modalId;
      this.confirmButtonId = confirmButtonId;
      this.deleteFormId = deleteFormId;
    }
  
    openConfirmDeleteModal() {
      const modal = document.getElementById(this.modalId);
      if (modal) {
        modal.classList.add("is-active");
        const confirmDeleteButton = document.getElementById(this.confirmButtonId);
        if (confirmDeleteButton) {
          confirmDeleteButton.onclick = () => {
            const deleteForm = document.getElementById(this.deleteFormId);
            if (deleteForm) {
              deleteForm.submit();
            } else {
              console.error("Delete form not found.");
            }
          };
        } else {
          console.error("Confirm delete button not found.");
        }
      } else {
        console.error("Confirm modal not found.");
      }
    }
  
    closeConfirmDeleteModal() {
      const modal = document.getElementById(this.modalId);
      if (modal) {
        modal.classList.remove("is-active");
      } else {
        console.error("Confirm modal not found.");
      }
    }
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    const navbarManager = new NavbarManager();
    const modalManager = new ModalManager("confirmModal", "confirmDelete", "deleteForm");
  
    // Example usage:
    // modalManager.openConfirmDeleteModal();
    // modalManager.closeConfirmDeleteModal();
  });
  