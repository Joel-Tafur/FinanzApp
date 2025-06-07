import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Bell, Plus, Edit, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { formatCurrency, useUserCurrency } from '../lib/utils';
import { useToast } from '../components/ui/use-toast';
import { fetchAlerts, createAlert, editAlert, removeAlert } from '../redux/slices/alertsSlice';
import { AlertForm } from '../components/alerts/AlertForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

export default function Alerts() {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { user } = useSelector((state) => state.auth);
  const { code: currencyCode } = useUserCurrency();
  const { alerts, loading, error } = useSelector((state) => state.alerts);
  
  // Estados para el diálogo de alerta
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);

  const location = useLocation();

  // Cargar alertas al iniciar y verificar si hay una alerta para editar
  useEffect(() => {
    if (user?.userId) {
      dispatch(fetchAlerts({ userId: user.userId }));
      
      // Verificar si hay un editAlertId en el estado de la ruta
      if (location.state?.editAlertId) {
        console.log('Edit alert ID from route state:', location.state.editAlertId);
        // Buscar la alerta con el ID proporcionado
        const alertToEdit = alerts.find(alert => alert.id === location.state.editAlertId);
        if (alertToEdit) {
          console.log('Found alert to edit:', alertToEdit);
          setEditingAlert(alertToEdit);
          setIsDialogOpen(true);
        } else {
          console.log('Alert not found, will try after loading');
          // Si no encontramos la alerta, podríamos querer intentar nuevamente después de cargar
        }
      }
    }
  }, [dispatch, user, location.state?.editAlertId]);
  
  // Efecto para manejar la edición después de cargar las alertas
  useEffect(() => {
    // Solo intentar esto si tenemos un editAlertId y las alertas están cargadas
    if (location.state?.editAlertId && alerts.length > 0) {
      const alertToEdit = alerts.find(alert => alert.id === location.state.editAlertId);
      if (alertToEdit && !editingAlert) {
        console.log('Found alert to edit after loading:', alertToEdit);
        setEditingAlert(alertToEdit);
        setIsDialogOpen(true);
      }
    }
  }, [alerts, location.state?.editAlertId]);
  
  // Mostrar errores si los hay
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleToggleAlert = async (alert) => {
    try {
      const updates = { active: !alert.active };
      await dispatch(editAlert({ id: alert.id, updates })).unwrap();
      
      toast({
        title: `Alerta ${updates.active ? 'activada' : 'desactivada'}`,
        description: `La alerta "${alert.title}" ha sido ${updates.active ? 'activada' : 'desactivada'}.`,
      });
    } catch (error) {
      console.error('Error al actualizar el estado de la alerta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado de la alerta',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAlert = async (alertId) => {
    console.log('Intentando eliminar alerta con ID:', alertId);
    if (!alertId) {
      console.error('No se proporcionó un ID de alerta válido');
      toast({
        title: 'Error',
        description: 'No se pudo identificar la alerta a eliminar',
        variant: 'destructive',
      });
      return;
    }

    if (window.confirm('¿Estás seguro de que deseas eliminar esta alerta?')) {
      try {
        console.log('Despachando acción para eliminar alerta con ID:', alertId);
        const result = await dispatch(removeAlert(alertId)).unwrap();
        console.log('Resultado de la eliminación:', result);
        
        toast({
          title: 'Alerta eliminada',
          description: 'La alerta ha sido eliminada correctamente',
        });
      } catch (error) {
        console.error('Error al eliminar la alerta:', error);
        toast({
          title: 'Error',
          description: `No se pudo eliminar la alerta: ${error.message || 'Error desconocido'}`,
          variant: 'destructive',
        });
      }
    }
  };
  
  const handleOpenDialog = (alert = null) => {
    console.log('Opening dialog with alert:', alert);
    // Primero establece el estado de edición
    setEditingAlert(alert);
    // Luego abre el diálogo
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    console.log('Closing dialog');
    // Primero cierra el diálogo
    setIsDialogOpen(false);
    // Luego limpia el estado de edición después de la animación
    setTimeout(() => {
      setEditingAlert(null);
      // Limpiar el estado de la ruta para evitar que se abra nuevamente al actualizar
      window.history.replaceState({}, document.title);
    }, 300);
  };
  
  // Manejador para cerrar al hacer clic fuera del diálogo
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseDialog();
    }
  };
  
  const handleSubmitAlert = async (alertData) => {
    try {
      console.log('Submitting alert:', alertData);
      
      if (!user?.userId) {
        throw new Error('No se pudo identificar al usuario');
      }
      
      const alertWithUser = {
        ...alertData,
        user_id: user.userId,
        // Asegurarse de que los campos requeridos estén presentes
        alert_type: alertData.alert_type || 'expense',
        message: alertData.message || '',
        due_date: alertData.due_date || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      if (editingAlert) {
        console.log('Updating alert:', editingAlert.id, alertData);
        await dispatch(editAlert({ 
          id: editingAlert.id, 
          updates: {
            ...alertData,
            updated_at: new Date().toISOString()
          } 
        })).unwrap();
        
        toast({
          title: '✅ Alerta actualizada',
          description: 'La alerta se ha actualizado correctamente',
        });
      } else {
        console.log('Creating new alert:', alertWithUser);
        const result = await dispatch(createAlert(alertWithUser)).unwrap();
        console.log('Alert created:', result);
        
        toast({
          title: '✅ Alerta creada',
          description: 'La alerta se ha creado correctamente',
        });
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error al guardar la alerta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la alerta',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Mis Alertas</h1>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-2 bg-muted rounded w-full mb-4"></div>
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Diálogo para crear/editar alerta - Siempre en el DOM */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingAlert ? 'Editar Alerta' : 'Nueva Alerta'}</DialogTitle>
          </DialogHeader>
          <AlertForm
            initialData={editingAlert}
            onSubmit={handleSubmitAlert}
            onCancel={handleCloseDialog}
            loading={loading}
          />
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Mis Alertas</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Alerta
        </Button>
      </div>

      {alerts.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <p className="text-muted-foreground mb-4">No tienes alertas configuradas</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Crear tu primera alerta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const lastTriggered = alert.lastTriggered 
              ? new Date(alert.lastTriggered)
              : null;
            
            const formattedLastTriggered = lastTriggered
              ? new Intl.DateTimeFormat('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(lastTriggered)
              : 'Nunca';
            
            return (
              <Card key={alert.id} className={!alert.triggered ? 'border-amber-500' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      {!alert.triggered && (
                        <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                      )}
                      <CardTitle>{alert.title}</CardTitle>
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleOpenDialog(alert)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteAlert(alert.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{alert.message} {formatCurrency(alert.threshold, currencyCode)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Estado</p>
                      <div className="flex items-center">
                        {alert.triggered ? (
                          <span className="text-green-500 flex items-center">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Activo
                          </span>
                        ) : (
                          <span className="text-amber-500 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Vencido
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Vence</p>
                      <p className="text-sm font-medium">
                        {alert.due_date ? (() => {
                          // Crear la fecha ajustando por la zona horaria para evitar el desfase
                          const date = new Date(alert.due_date);
                          // Ajustar la fecha sumando el offset de la zona horaria local
                          const adjustedDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
                          return adjustedDate.toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            timeZone: 'UTC' // Usar UTC para evitar ajustes adicionales
                          });
                        })() : 'Sin fecha'}
                      </p>
                    </div>
                    
                    <div className="flex items-center">
                      <Switch
                        id={`alert-${alert.id}`}
                        checked={alert.active}
                        onCheckedChange={() => handleToggleAlert(alert)}
                        disabled={loading}
                      />
                      <label htmlFor={`alert-${alert.id}`} className="ml-2 text-sm font-medium">
                        {alert.active ? 'Mostrar en dashboard' : 'Ocultar del dashboard'}
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
