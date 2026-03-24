import { useEffect, useRef } from "react";
import { getSocket } from "../lib/socket";

// Wyłącz socket.io jeśli backend nie działa
const SOCKET_ENABLED = import.meta.env.VITE_ENABLE_SOCKET !== 'false';

export function useSocket(meId, handlers = {}) {
  const ref = useRef(null);
  
  useEffect(() => {
    if (!SOCKET_ENABLED) {
      // Zwróć mock socket jeśli socket.io jest wyłączony
      ref.current = {
        on: () => {},
        off: () => {},
        emit: () => {},
        disconnect: () => {},
        connected: false
      };
      return () => {};
    }
    
    try {
      const s = getSocket();
      ref.current = s;
      
      // Join user room for notifications
      if (meId && s.connected) {
        s.emit("join", meId);
      } else if (meId) {
        // Poczekaj na połączenie
        s.once("connect", () => {
          s.emit("join", meId);
        });
      }
      
      // Set up event handlers
      Object.entries(handlers).forEach(([event, handler]) => {
        s.on(event, handler);
      });
      
      return () => { 
        try { 
          // Clean up event handlers
          Object.keys(handlers).forEach(event => {
            s.off(event);
          });
          // Nie rozłączaj socket jeśli jest używany przez inne komponenty
        } catch (e) {
          if (import.meta.env.DEV) {
            console.debug("Socket cleanup error (silenced):", e);
          }
        } 
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.debug("Socket initialization error (silenced):", error);
      }
      ref.current = {
        on: () => {},
        off: () => {},
        emit: () => {},
        disconnect: () => {},
        connected: false
      };
      return () => {};
    }
  }, [meId, handlers]);
  
  return ref.current;
}

// Default export for backward compatibility
export default useSocket;