import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import LoginPersonnel from "./pages/LoginPersonnel";
import ClientHome from "./pages/ClientHome";
import ForgotPassword from "./pages/ForgotPassword";
import ForgotPasswordPersonnel from "./pages/ForgotPasswordPersonnel";
import AdminDashboard from "./pages/AdminDashboard";
import TeamLeadDashboard from "./pages/TeamLeadDashboard";
import SupportDashboard from "./pages/SupportDashboard";
import ChangePassword from "./pages/ChangePassword";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login-personnel" element={<LoginPersonnel />} />
        <Route path="/register" element={<Register />} />
        <Route path="/client/dashboard" element={<ClientHome />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/forgot-password-personnel" element={<ForgotPasswordPersonnel />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/team-lead/dashboard" element={<TeamLeadDashboard />} />
        <Route path="/support/dashboard" element={<SupportDashboard />} />
        <Route path="/change-password" element={<ChangePassword />} />
      </Routes>
    </Router>
  );
}

export default App;