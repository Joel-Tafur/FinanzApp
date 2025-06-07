import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { format, isToday, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, Check } from 'lucide-react';

export function AlertCard({ alert, onMarkAsSent, onEdit, onDelete, className }) {
  const { 
    id,
    title, 
    message, 
    due_date, 
    amount,
    enviado
  } = alert;
  
  // Formatear la fecha
  const formattedDate = due_date 
    ? format(new Date(due_date), "d 'de' MMMM, yyyy", { locale: es })
    : 'Sin fecha';
  
  // Verificar si la alerta es para hoy o ya pasó
  const isAlertToday = due_date ? isToday(new Date(due_date)) : false;
  const isAlertPast = due_date ? isPast(new Date(due_date)) && !isAlertToday : false;
  
  // Determinar el estado de la alerta
  const getAlertStatus = () => {
    if (enviado) return { label: 'Enviada', color: 'bg-green-100 text-green-800' };
    if (isAlertToday) return { label: 'Hoy', color: 'bg-yellow-100 text-yellow-800' };
    if (isAlertPast) return { label: 'Vencida', color: 'bg-red-100 text-red-800' };
    return { label: 'Pendiente', color: 'bg-blue-100 text-blue-800' };
  };
  
  const alertStatus = getAlertStatus();
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex justify-between items-center">
          <span className="flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            {title}
          </span>
          <span className={cn("text-xs px-2 py-1 rounded-full", alertStatus.color)}>
            {alertStatus.label}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
        
        <div className="flex justify-between items-center text-sm">
          <div>
            <span className="text-muted-foreground">Fecha: </span>
            <span>{formattedDate}</span>
          </div>
          {amount > 0 && (
            <div>
              <span className="text-muted-foreground">Monto: </span>
              <span>${amount.toLocaleString()}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 flex justify-between">
        {!enviado && (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center"
            onClick={() => onMarkAsSent(id)}
          >
            <Check className="h-4 w-4 mr-1" />
            Marcar como enviada
          </Button>
        )}
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEdit(alert)}
          >
            Editar
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => onDelete(id)}
          >
            Eliminar
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
