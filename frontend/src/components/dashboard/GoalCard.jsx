import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { cn, useUserCurrency } from '../../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function GoalCard({ goal, onEdit, onDelete, className }) {
  const { symbol: currencySymbol } = useUserCurrency();
  const { 
    goal_name, 
    target_amount, 
    saved_amount, 
    deadline, 
    progress, 
    completed, 
    expired 
  } = goal;
  
  // Formatear la fecha límite
  const formattedDeadline = deadline 
    ? format(new Date(deadline), "d 'de' MMMM, yyyy", { locale: es })
    : 'Sin fecha límite';
  
  // Calcular días restantes
  const calculateDaysLeft = () => {
    if (!deadline) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  const daysLeft = calculateDaysLeft();
  
  // Determinar el color de la barra de progreso
  const getProgressBarColor = () => {
    if (completed) return 'bg-green-500';
    if (expired) return 'bg-red-500';
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex justify-between items-center">
          <span>{goal_name}</span>
          {completed && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Completada
            </span>
          )}
          {expired && !completed && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
              Vencida
            </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span>Meta: {currencySymbol}{target_amount.toLocaleString()}</span>
          <span>Ahorrado: {currencySymbol}{saved_amount.toLocaleString()}</span>
        </div>
        
        <div className="w-full bg-muted rounded-full h-2.5">
          <div 
            className={cn("h-2.5 rounded-full", getProgressBarColor())}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{progress.toFixed(0)}% completado</span>
          {daysLeft !== null && (
            <span>
              {daysLeft > 0 
                ? `${daysLeft} días restantes` 
                : daysLeft === 0 
                  ? 'Vence hoy' 
                  : `Venció hace ${Math.abs(daysLeft)} días`}
            </span>
          )}
        </div>
        
        <div className="text-sm">
          <span className="text-muted-foreground">Fecha límite: </span>
          <span>{formattedDeadline}</span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 flex justify-end space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onEdit(goal)}
        >
          Editar
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => onDelete(goal.id)}
        >
          Eliminar
        </Button>
      </CardFooter>
    </Card>
  );
}
