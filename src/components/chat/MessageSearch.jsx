import { useState, useEffect, useRef } from "react";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";

export default function MessageSearch({ messages, onSelectMessage, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);

  useEffect(() => {
    if (query.trim()) {
      const filtered = messages.filter(m => 
        m.text?.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setSelectedIndex(-1);
    } else {
      setResults([]);
      setSelectedIndex(-1);
    }
  }, [query, messages]);

  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < results.length) {
      onSelectMessage?.(results[selectedIndex]);
    }
  }, [selectedIndex, results, onSelectMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => prev < results.length - 1 ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      onSelectMessage?.(results[selectedIndex]);
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200 z-20 shadow-md">
      <div className="p-3 flex items-center gap-2">
        <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Szukaj w wiadomościach (Ctrl+F)..."
          className="flex-1 border-0 outline-none text-sm"
        />
        {query && (
          <span className="text-xs text-gray-500">
            {results.length} {results.length === 1 ? 'wynik' : 'wyników'}
          </span>
        )}
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      {query && results.length > 0 && (
        <div className="px-3 pb-2 flex items-center justify-between text-xs text-gray-500">
          <span>Użyj ↑↓ do nawigacji, Enter do wyboru</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedIndex(prev => prev > 0 ? prev - 1 : 0)}
              disabled={selectedIndex <= 0}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <span>{selectedIndex + 1} / {results.length}</span>
            <button
              onClick={() => setSelectedIndex(prev => prev < results.length - 1 ? prev + 1 : prev)}
              disabled={selectedIndex >= results.length - 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

