import { Injectable } from '@angular/core';
import { Notification } from '../structure';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notifications: Notification[] = [];

  constructor() {}

  public Add(notification: Notification) {
    this.notifications.push(notification);
    setTimeout(() => {
      let id = notification.id;
      let index = this.notifications.findIndex((e) => e.id === id);
      if (index === -1) {
        return;
      }
      this.notifications.splice(index, 1);
    }, notification.life);
  }

  public get Notifications() {
    return [...this.notifications];
  }
}
