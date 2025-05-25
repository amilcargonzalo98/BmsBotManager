// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import UsuariosPage from './pages/UsuariosPage';
import PuntosPage from './pages/PuntosPage';
import Layout from './components/Layout'; 
import { useAuth } from './context/AuthContext';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/usuarios"
        element={
          <PrivateRoute>
            <Layout>
              <UsuariosPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/puntos"
        element={
          <PrivateRoute>
            <Layout>
              <PuntosPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/usuarios" replace />} />
    </Routes>
  );
}
