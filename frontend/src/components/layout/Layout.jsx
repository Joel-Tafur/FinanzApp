import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { fetchCurrentUser } from '../../redux/slices/authSlice';

function Layout() {
  const { user, loading, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si hay un usuario autenticado al cargar la aplicación
    // Solo hacemos esto una vez al inicio y si no estamos ya en la página de login o registro
    const currentPath = window.location.pathname;
    if (!isAuthenticated && !loading && 
        currentPath !== '/login' && 
        currentPath !== '/register') {
      console.log('Verificando usuario actual');
      dispatch(fetchCurrentUser())
        .unwrap()
        .catch((error) => {
          console.log('Error al obtener usuario:', error);
          navigate('/login');
        });
    }
  }, [dispatch, isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {isAuthenticated && <Navbar />}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
      <footer className="bg-background border-t border-border py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} FinanzApp - Dashboard de Finanzas Personales
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
