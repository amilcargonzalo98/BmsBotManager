// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import UsuariosPage from './pages/UsuariosPage';
import PuntosPage from './pages/PuntosPage';
import GroupPage from './pages/GroupPage';
import ClientPage from './pages/ClientPage';
import TwilioPage from './pages/TwilioPage';
import WhatsappPage from './pages/WhatsappPage';
import AlarmsPage from './pages/AlarmsPage';
import TendenciasPage from './pages/TendenciasPage';
import EventosPage from './pages/EventosPage';
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
        path="/grupos"
        element={
          <PrivateRoute>
            <Layout>
              <GroupPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/clientes"
        element={
          <PrivateRoute>
            <Layout>
              <ClientPage />
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
      <Route
        path="/alarmas"
        element={
          <PrivateRoute>
            <Layout>
              <AlarmsPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/tendencias"
        element={
          <PrivateRoute>
            <Layout>
              <TendenciasPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/eventos"
        element={
          <PrivateRoute>
            <Layout>
              <EventosPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/twilio"
        element={
          <PrivateRoute>
            <Layout>
              <TwilioPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/whatsapp"
        element={
          <PrivateRoute>
            <Layout>
              <WhatsappPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/usuarios" replace />} />
    </Routes>
  );
}
