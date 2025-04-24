import React from "react";

export function Button({ children, onClick, className = "", type = "button", ...props }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`w-full p-2 rounded text-white bg-blue-600 hover:bg-blue-700 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
