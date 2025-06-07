import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { formatCurrency, useUserCurrency } from '../lib/utils';
import { useToast } from '../components/ui/use-toast';
import { fetchGoals, removeGoal, updateGoalsProgress } from '../redux/slices/goalsSlice';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import GoalForm from '../components/goals/GoalForm';

export default function Goals() {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { code: currencyCode } = useUserCurrency();
  const { goalsWithProgress, loading, error } = useSelector((state) => state.goals);
  const { transactions } = useSelector((state) => state.transactions);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  useEffect(() => {
    if (user?.userId) {
      dispatch(fetchGoals({ userId: user.userId }));
    }
  }, [dispatch, user]);

  // Actualizar el progreso de las metas cuando cambian las transacciones
  useEffect(() => {
    if (transactions.length > 0) {
      dispatch(updateGoalsProgress(transactions));
    }
  }, [dispatch, transactions]);
  
  // Procesar el parámetro editGoalId recibido desde el Dashboard
  useEffect(() => {
    // Verificar si se recibió un ID de meta para editar desde el Dashboard
    if (location.state?.editGoalId && goalsWithProgress.length > 0) {
      // Buscar la meta con el ID recibido
      const goalToEdit = goalsWithProgress.find(goal => goal.id === location.state.editGoalId);
      
      if (goalToEdit) {
        console.log('Abriendo meta para editar desde Dashboard:', goalToEdit.title);
        // Abrir el diálogo de edición con la meta encontrada
        handleOpenDialog(goalToEdit);
        // Limpiar el state para evitar que se abra automáticamente en futuras visitas
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, goalsWithProgress]);

  const handleOpenDialog = (goal = null) => {
    setEditingGoal(goal);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingGoal(null);
  };

  const handleDeleteGoal = (id) => {
    if (!id) {
      toast({
        title: 'Error',
        description: 'ID de meta no válido',
        variant: 'destructive',
      });
      return;
    }

    if (window.confirm('¿Estás seguro de que deseas eliminar esta meta?')) {
      // Mostrar un toast de carga
      toast({
        title: 'Eliminando meta...',
        description: 'Por favor espera mientras se elimina la meta',
      });
      
      dispatch(removeGoal(id))
        .unwrap()
        .then(() => {
          toast({
            title: 'Meta eliminada',
            description: 'La meta ha sido eliminada correctamente',
          });
          
          // Recargar las metas para asegurar que la UI esté actualizada
          if (user?.userId) {
            dispatch(fetchGoals({ userId: user.userId }));
          }
        })
        .catch((error) => {
          console.error('Error al eliminar meta:', error);
          toast({
            title: 'Error',
            description: error.includes('policy') 
              ? 'Error de permisos en la base de datos. Por favor, contacta al administrador.'
              : `No se pudo eliminar la meta: ${error}`,
            variant: 'destructive',
          });
        });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Mis Metas</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={`loading-skeleton-${i}`} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-2 bg-muted rounded w-full mb-4"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
              </CardContent>
              <CardFooter>
                <div className="h-8 bg-muted rounded w-full"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Mis Metas</h1>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Meta
          </Button>
        </div>
        <Card className="text-center py-8 bg-red-50 dark:bg-red-900/20">
          <CardContent>
            <div className="bg-destructive/15 border border-destructive text-destructive px-4 py-3 rounded-md">
              <p className="font-medium">Error al cargar las metas: {error}</p>
              <p className="text-sm mt-2">Este error puede estar relacionado con permisos de seguridad en la base de datos.</p>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" onClick={() => dispatch(fetchGoals({ userId: user?.userId }))}>
                  Reintentar
                </Button>
                <Button variant="destructive" onClick={() => {
                  // Forzar recarga completa de la página
                  window.location.reload();
                }}>
                  Recargar página
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Asignar colores a las metas según su progreso
  const getGoalColor = (progress) => {
    if (progress < 25) return 'bg-red-500';
    if (progress < 50) return 'bg-orange-500';
    if (progress < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Mis Metas</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Meta
        </Button>
      </div>

      {goalsWithProgress?.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <p className="text-muted-foreground mb-4">No tienes metas financieras configuradas</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Crear tu primera meta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goalsWithProgress?.map((goal) => {
            const deadline = goal.deadline ? new Date(goal.deadline) : null;
            const formattedDeadline = deadline ? new Intl.DateTimeFormat('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }).format(deadline) : 'Sin fecha límite';
            
            const goalColor = getGoalColor(goal.progress);
            
            return (
              <Card key={`goal-${goal.id}`} className={goal.completed ? 'border-green-500' : (goal.expired ? 'border-red-500' : '')}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{goal.goal_name}</CardTitle>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleOpenDialog(goal)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {goal.description && (
                    <CardDescription key={`desc-${goal.id}`}>{goal.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progreso</span>
                      <span>{Math.round(goal.progress)}%</span>
                    </div>
                    <Progress value={goal.progress} className={`h-2 ${goalColor}`} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div key={`saved-${goal.id}`}>
                      <p className="text-muted-foreground">Ahorrado</p>
                      <p className="font-medium">{formatCurrency(goal.saved_amount, currencyCode)}</p>
                    </div>
                    <div key={`target-${goal.id}`}>
                      <p className="text-muted-foreground">Objetivo</p>
                      <p className="font-medium">{formatCurrency(goal.target_amount, currencyCode)}</p>
                    </div>
                  </div>
                  <div key={`deadline-${goal.id}`}>
                    <p className="text-sm text-muted-foreground">Fecha límite</p>
                    <p className="text-sm font-medium">{formattedDeadline}</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant={goal.completed ? "secondary" : "outline"} 
                    className="w-full"
                    onClick={() => handleOpenDialog(goal)}
                  >
                    {goal.completed ? 'Meta completada' : 'Actualizar meta'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Editar Meta' : 'Nueva Meta'}</DialogTitle>
            <DialogDescription>
              {editingGoal ? 'Actualiza los detalles de tu meta financiera' : 'Crea una nueva meta financiera'}
            </DialogDescription>
          </DialogHeader>
          <GoalForm 
            goal={editingGoal} 
            onClose={handleCloseDialog} 
            userId={user?.userId} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
