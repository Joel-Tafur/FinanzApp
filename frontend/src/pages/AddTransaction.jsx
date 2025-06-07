import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addTransaction } from '../redux/slices/transactionsSlice';
import { fetchGoals } from '../redux/slices/goalsSlice';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { Button } from '../components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function AddTransaction() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { goalsWithProgress } = useSelector((state) => state.goals);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Cargar metas financieras al iniciar
  useEffect(() => {
    if (user?.userId) {
      dispatch(fetchGoals({ userId: user.userId }));
    }
  }, [dispatch, user]);
  
  // Manejar envío del formulario
  const handleSubmit = async (data) => {
    if (!user?.userId) {
      setError('Debes iniciar sesión para agregar una transacción');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Agregar el ID del usuario a la transacción
      const transactionData = {
        ...data,
        user_id: user.userId, // Usar userId de public.users, no el auth.user.id
        created_at: new Date().toISOString(),
      };
      
      // Si es una transacción de ahorro o retiro y está vinculada a una meta
      if ((data.tipo === 'ahorro' || data.tipo === 'retiro') && data.goal_id) {
        // Asegurarse de que la categoría sea 'Ahorro'
        transactionData.category = 'Ahorro';
        
        // Buscar la meta seleccionada para usar su nombre como subcategoría
        const selectedGoal = goalsWithProgress.find(g => g.id === data.goal_id);
        if (selectedGoal) {
          transactionData.subcategory = selectedGoal.goal_name.toLowerCase();
        }
      }
      
      console.log('Agregando transacción:', transactionData);
      
      // Enviar la transacción al servidor
      await dispatch(addTransaction(transactionData)).unwrap();
      
      // Redirigir a la lista de transacciones
      navigate('/transactions');
    } catch (err) {
      console.error('Error al agregar la transacción:', err);
      setError(err.message || 'Error al agregar la transacción. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
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
        <h1 className="text-2xl font-bold tracking-tight">Agregar Transacción</h1>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <TransactionForm 
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        goals={goalsWithProgress}
      />
    </div>
  );
}
