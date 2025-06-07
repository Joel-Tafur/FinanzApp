import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { updateTransaction, fetchTransactionById } from '../redux/slices/transactionsSlice';
import { fetchGoals } from '../redux/slices/goalsSlice';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { Button } from '../components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function EditTransaction() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  
  // Obtener el estado del usuario, transacciones y metas
  const { user } = useSelector((state) => state.auth);
  const { transactions, loading } = useSelector((state) => state.transactions);
  const { goalsWithProgress } = useSelector((state) => state.goals);
  
  // Estado local
  const [transaction, setTransaction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Cargar la transacción desde el estado de la ubicación o buscarla en el store
  useEffect(() => {
    // Si la transacción viene en el estado de navegación, usarla
    if (location.state?.transaction) {
      setTransaction(location.state.transaction);
    } else {
      // Buscar la transacción en el store
      const foundTransaction = transactions.find(t => t.id === id);
      
      if (foundTransaction) {
        setTransaction(foundTransaction);
      } else {
        // Si no se encuentra en el store, cargarla desde el servidor
        if (id && user?.id) {
          dispatch(fetchTransactionById(id))
            .unwrap()
            .then(data => {
              setTransaction(data);
            })
            .catch(err => {
              console.error('Error al cargar la transacción:', err);
              setError('No se pudo cargar la transacción. Verifica el ID e inténtalo de nuevo.');
            });
        }
      }
    }
    
    // Cargar metas financieras
    if (user?.userId) {
      dispatch(fetchGoals({ userId: user.userId }));
    }
  }, [id, location.state, transactions, dispatch, user]);
  
  // Manejar envío del formulario
  const handleSubmit = async (data) => {
    if (!user?.id) {
      setError('Debes iniciar sesión para editar una transacción');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Preparar datos para actualizar
      const transactionData = {
        ...data,
        id: id,
        user_id: user.userId, // Usar userId de public.users, no el auth.user.id
        updated_at: new Date().toISOString(),
      };
      
      // Si es una transacción de ahorro o retiro
      if (data.tipo === 'ahorro' || data.tipo === 'retiro') {
        // Asegurarse de que la categoría sea 'Ahorro'
        transactionData.category = 'Ahorro';
        
        // Si está vinculada a una meta, buscar la meta seleccionada para usar su nombre como subcategoría
        if (data.goal_id) {
          const selectedGoal = goalsWithProgress?.find(g => g.id === data.goal_id);
          if (selectedGoal) {
            transactionData.subcategory = selectedGoal.goal_name?.toLowerCase() || '';
          }
        } else {
          // Si no hay goal_id, asegurarse de que subcategory tenga un valor por defecto
          transactionData.subcategory = transactionData.subcategory || '';
        }
      }
      
      // Enviar la actualización al servidor
      // Extraer el ID y el resto de los datos
      const { id: transactionId, ...updates } = transactionData;
      await dispatch(updateTransaction({ id: transactionId, updates })).unwrap();
      
      // Redirigir a la lista de transacciones
      navigate('/transactions');
    } catch (err) {
      console.error('Error al actualizar la transacción:', err);
      setError(err.message || 'Error al actualizar la transacción. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Mostrar mensaje de carga mientras se obtiene la transacción
  if (loading && !transaction) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Mostrar mensaje de error si no se encuentra la transacción
  if (!loading && !transaction && !error) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold mb-4">Transacción no encontrada</h2>
        <p className="text-muted-foreground mb-6">
          No se pudo encontrar la transacción con ID: {id}
        </p>
        <Button onClick={() => navigate('/transactions')}>
          Volver a transacciones
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2"
          onClick={() => navigate('/transactions')}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Editar Transacción</h1>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {transaction && (
        <TransactionForm 
          transaction={transaction}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          goals={goalsWithProgress}
        />
      )}
    </div>
  );
}
