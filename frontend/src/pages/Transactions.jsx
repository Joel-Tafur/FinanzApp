import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { 
  fetchTransactions, 
  deleteTransaction 
} from '../redux/slices/transactionsSlice';
import { TransactionList } from '../components/transactions/TransactionList';
import { Button } from '../components/ui/button';
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from '../components/ui/dialog';

export default function Transactions() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { transactions, loading, error } = useSelector((state) => state.transactions);
  
  // Estado para el diálogo de confirmación de eliminación
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Cargar transacciones al iniciar
  useEffect(() => {
    if (user?.userId) {
      dispatch(fetchTransactions({ userId: user.userId }));
    }
  }, [dispatch, user]);
  
  // Manejar edición de transacción
  const handleEdit = (transaction) => {
    navigate(`/transactions/edit/${transaction.id}`, { state: { transaction } });
  };
  
  // Manejar eliminación de transacción
  const handleDelete = (transactionId) => {
    // Buscar la transacción a eliminar
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      setTransactionToDelete(transaction);
      setIsDeleteDialogOpen(true);
    }
  };
  
  // Confirmar eliminación de transacción
  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    
    setIsDeleting(true);
    try {
      await dispatch(deleteTransaction(transactionToDelete.id)).unwrap();
      setIsDeleteDialogOpen(false);
      setTransactionToDelete(null);
    } catch (error) {
      console.error('Error al eliminar la transacción:', error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Transacciones</h1>
        <Link to="/transactions/new">
          <Button className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Transacción
          </Button>
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <TransactionList
        transactions={transactions}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={loading}
      />
      
      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la transacción{' '}
              <span className="font-medium">
                "{transactionToDelete?.description}"
              </span>
              {' '}por un monto de{' '}
              <span className="font-medium">
                ${transactionToDelete?.amount.toLocaleString()}
              </span>?
              <br />
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isDeleting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Eliminando...
                </span>
              ) : (
                'Eliminar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
