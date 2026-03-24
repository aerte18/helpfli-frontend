import React from "react";

const Attachments = ({ file, setFile }) => {
  return (
    <div className="flex items-center gap-2">
      <label className="cursor-pointer bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded">
        📎 Dodaj plik
        <input
          type="file"
          hidden
          onChange={(e) => setFile(e.target.files[0])}
        />
      </label>
      {file && (
        <div className="text-sm text-gray-600">
          {file.name}
          <button onClick={() => setFile(null)} className="ml-2 text-red-500">
            ✖
          </button>
        </div>
      )}
    </div>
  );
};

export default Attachments;