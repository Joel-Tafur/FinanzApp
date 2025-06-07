import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser } from '../redux/slices/authSlice';
import { fetchTransactions } from '../redux/slices/transactionsSlice';
import { fetchGoals } from '../redux/slices/goalsSlice';
import { fetchAlerts } from '../redux/slices/alertsSlice';
import { useToast } from '../components/ui/use-toast';

/**
 * Componente que inicializa la aplicación cargando los datos necesarios
 * cuando el usuario está autenticado
 */
export default function AppInitializer() {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Verificar si hay una sesión activa al cargar la aplicación
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Verificando sesión...');
        await dispatch(fetchCurrentUser()).unwrap();
        console.log('Sesión verificada');
      } catch (error) {
        console.error('Error al verificar sesión:', error);
      } finally {
        setSessionChecked(true);
      }
    };

    checkSession();
  }, [dispatch]);

  // Cargar datos cuando el usuario está autenticado
  useEffect(() => {
    const loadUserData = async () => {
      if (!isAuthenticated || !user?.userId || dataLoaded) {
        return;
      }

      console.log('Cargando datos del usuario:', user.userId);
      try {
        // Usar Promise.all para cargar datos en paralelo
        await Promise.all([
          dispatch(fetchTransactions({ userId: user.userId })).unwrap(),
          dispatch(fetchGoals({ userId: user.userId })).unwrap(),
          dispatch(fetchAlerts({ userId: user.userId })).unwrap()
        ]);
        
        console.log('Datos cargados correctamente');
        setDataLoaded(true);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast({
          title: 'Error al cargar datos',
          description: 'Por favor, recarga la página o intenta más tarde',
          variant: 'destructive',
        });
      }
    };

    if (sessionChecked && isAuthenticated && user?.userId) {
      loadUserData();
    }
  }, [dispatch, isAuthenticated, user, sessionChecked, dataLoaded, toast]);

  // Reiniciar el estado de carga de datos cuando el usuario cambia
  useEffect(() => {
    if (!isAuthenticated) {
      setDataLoaded(false);
    }
  }, [isAuthenticated]);

  // Este componente no renderiza nada
  return null;
}
