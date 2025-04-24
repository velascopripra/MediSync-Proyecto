import React from "react";

export function Input({ type = "text", placeholder, value, onChange, ...props }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      {...props}
    />
  );
}
