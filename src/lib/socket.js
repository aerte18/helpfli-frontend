import { io } from "socket.io-client";

// Użyj proxy Vite dla socket.io (relatywny URL) zamiast bezpośredniego połączenia
// Vite proxy automatycznie przekierowuje /socket.io na backend
const SOCKET_URL = window.location.origin; // Użyj proxy Vite

// Wyłącz socket.io jeśli backend nie działa (zmienna środowiskowa)
const SOCKET_ENABLED = import.meta.env.VITE_ENABLE_SOCKET !== 'false';

let socket;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

export function getSocket() {
  if (!SOCKET_ENABLED) {
    // Zwróć mock socket jeśli socket.io jest wyłączony
    return {
      on: () => {},
      off: () => {},
      emit: () => {},
      disconnect: () => {},
      connected: false
    };
  }
  
  if (!socket) {
    const token = localStorage.getItem("token");
    
    socket = io(SOCKET_URL, {
      path: '/socket.io',
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: MAX_CONNECTION_ATTEMPTS,
      reconnectionDelay: 2000,
      timeout: 10000,
      autoConnect: true,
      // Wycisz błędy - nie pokazuj w konsoli
      forceNew: false,
    });
    
    // Wycisz błędy w konsoli - nie pokazuj użytkownikowi
    socket.on("connect_error", (err) => {
      connectionAttempts++;
      // Tylko loguj w trybie deweloperskim i tylko pierwsze 3 próby
      if (import.meta.env.DEV && connectionAttempts <= MAX_CONNECTION_ATTEMPTS) {
        // Connection attempt failed (silenced in production)
      }
      // Po 3 próbach wyłącz socket.io
      if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
        socket.disconnect();
        socket = null; // Reset socket aby można było spróbować ponownie później
      }
    });
    
    socket.on("disconnect", (reason) => {
      // Nie loguj normalnych rozłączeń
      if (import.meta.env.DEV && reason !== "io client disconnect" && reason !== "transport close") {
        // Socket disconnected (silenced in production)
      }
    });
    
    socket.on("connect", () => {
      connectionAttempts = 0; // Reset przy udanym połączeniu
      if (import.meta.env.DEV) {
        // Socket connected successfully (silenced in production)
      }
    });
  }
  return socket;
}























