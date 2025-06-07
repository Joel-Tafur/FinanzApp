import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { ensureUserInDatabase } from '../../lib/supabase';
import { fetchCurrentUser } from '../../redux/slices/authSlice';
import { toast } from '../../components/ui/use-toast';

export default function ProtectedRoute({ children }) {
  const dispatch = useDispatch();
  const { user, loading, isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();
  const [verifyingUser, setVerifyingUser] = useState(false);
  const [userVerified, setUserVerified] = useState(false);
  
  // Verificar si hay una sesión activa cuando se monta el componente
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, isAuthenticated, loading]);

  useEffect(() => {
    // Verificar y crear el usuario en public.users si es necesario
    if (user && !userVerified && !verifyingUser) {
      const verifyUser = async () => {
        setVerifyingUser(true);
        try {
          const dbUser = await ensureUserInDatabase();
          console.log('Usuario verificado en la base de datos:', dbUser);
          setUserVerified(true);
        } catch (error) {
          console.error('Error al verificar/crear usuario en la base de datos:', error);
          toast({
            variant: 'destructive',
            title: 'Error de verificación',
            description: 'No se pudo verificar tu usuario en la base de datos. Algunas funciones pueden no estar disponibles.',
          });
        } finally {
          setVerifyingUser(false);
        }
      };

      verifyUser();
    }
  }, [user, userVerified, verifyingUser]);

  // Si estamos cargando o verificando el usuario, mostrar un indicador de carga
  if (loading || (user && verifyingUser && !userVerified)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si no hay usuario autenticado, redirigir al login
  if (!user) {
    // Guardar la ubicación actual para redirigir después del login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si hay usuario autenticado, mostrar el contenido protegido
  return children;
}
