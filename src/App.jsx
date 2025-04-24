import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import Profile from "./components/Profile";
import SidebarLayout from "./components/SidebarLayout";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Redirección desde raíz a login */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Todas las rutas dentro del layout con sidebar */}
        <Route element={<SidebarLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}
