import { useState } from "react";

export default function useCompare() {
  const [items, setItems] = useState([]);
  
  const toggle = (p) => setItems(prev => {
    const exists = prev.find(x => x.id === p.id);
    if (exists) {
      return prev.filter(x => x.id !== p.id);
    } else {
      // Maksymalnie 2 elementy
      return [...prev.slice(0, 1), p];
    }
  });
  
  const clear = () => setItems([]);
  
  return { items, toggle, clear };
}
