import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import StudentApp from "../pages/StudentApp";
import StudentLogin from "../pages/StudentLogin";
import StudentRegister from "../pages/StudentRegister";
import StudentForgotPassword from "../pages/StudentForgotPassword";
import StudentResetPassword from "../pages/StudentResetPassword";
import AdminDashboard from "../pages/AdminDashboard";
import AdminLogin from "../pages/AdminLogin";
import PaymentGateway from "../pages/PaymentGateway"; // eslint-disable-line no-unused-vars

function RequireAdmin({ children }) {
  const adminToken = localStorage.getItem("adminToken");
  return adminToken ? children : <Navigate to="/admin/login" replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Student Auth */}
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/student/register" element={<StudentRegister />} />
        <Route path="/student/forgot-password" element={<StudentForgotPassword />} />
        <Route path="/student/reset-password/:token" element={<StudentResetPassword />} />

        {/* Student */}
        <Route path="/" element={<StudentApp />} />
        <Route path="/student" element={<StudentApp />} />
        <Route path="/payment-gateway" element={<PaymentGateway />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
