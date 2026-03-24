// src/utils/fileIcons.js
export function isImage(mime = "") {
    return mime.startsWith("image/");
  }
  
  export function formatSize(bytes = 0) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  
  export function iconForMime(mime = "") {
    if (isImage(mime)) return "🖼️";
    if (mime.includes("pdf")) return "📄";
    if (mime.includes("zip")) return "🗜️";
    if (mime.includes("audio")) return "🎵";
    if (mime.includes("video")) return "🎬";
    if (mime.includes("excel") || mime.includes("spreadsheet")) return "📊";
    if (mime.includes("word") || mime.includes("msword")) return "📝";
    if (mime.includes("powerpoint")) return "📈";
    return "📎";
  }