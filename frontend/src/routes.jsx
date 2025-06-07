import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import AddTransaction from './pages/AddTransaction';
import EditTransaction from './pages/EditTransaction';
import Goals from './pages/Goals';
import Alerts from './pages/Alerts';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Definir las rutas de la aplicación
const router = createBrowserRouter([
  // Rutas de autenticación (fuera del Layout)
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  },
  // Rutas protegidas (dentro del Layout)
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )
      },
      {
        path: 'transactions',
        element: (
          <ProtectedRoute>
            <Transactions />
          </ProtectedRoute>
        )
      },
      {
        path: 'transactions/new',
        element: (
          <ProtectedRoute>
            <AddTransaction />
          </ProtectedRoute>
        )
      },
      {
        path: 'transactions/edit/:id',
        element: (
          <ProtectedRoute>
            <EditTransaction />
          </ProtectedRoute>
        )
      },
      {
        path: 'goals',
        element: (
          <ProtectedRoute>
            <Goals />
          </ProtectedRoute>
        )
      },
      {
        path: 'alerts',
        element: (
          <ProtectedRoute>
            <Alerts />
          </ProtectedRoute>
        )
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        )
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
]);

export default router;
