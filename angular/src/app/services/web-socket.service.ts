import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private ws: WebSocket;
  constructor() {
    this.ws = new WebSocket('http://localhost:8080/ws/boilerplate');
    this.ws.onmessage = (event) => {
      console.log('ws: message', event);
    };
    this.ws.onerror = (event) => {
      console.log('ws: error');
    };
    this.ws.onclose = () => {
      console.log('ws: closed');
    };
  }
}
