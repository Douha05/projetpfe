import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import RegisterPersonnel from "./pages/RegisterPersonnel";
import Login from "./pages/Login";
import LoginPersonnel from "./pages/LoginPersonnel";
import ClientHome from "./pages/ClientHome";
import ForgotPassword from "./pages/ForgotPassword";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login-personnel" element={<LoginPersonnel />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register-personnel" element={<RegisterPersonnel />} />
        <Route path="/client/dashboard" element={<ClientHome />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </Router>
  );
}

export default App;