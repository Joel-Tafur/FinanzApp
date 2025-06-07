import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToast } from '../ui/use-toast';
import { createGoal, editGoal } from '../../redux/slices/goalsSlice';

// Esquema de validación
const goalFormSchema = z.object({
  goal_name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  target_amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  saved_amount: z.coerce.number().min(0, 'El monto ahorrado no puede ser negativo'),
  deadline: z.date().optional(),
  description: z.string().optional(),
});

export default function GoalForm({ goal, onClose, userId }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.goals);
  const { toast } = useToast();
  const isEditing = !!goal;
  
  // Ya no necesitamos categorías de metas
  
  // Configurar react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      goal_name: '',
      target_amount: '',
      saved_amount: '0',
      deadline: undefined,
      description: '',
    }
  });
  
  // Observar el valor de la fecha
  const selectedDate = watch('deadline');
  
  // Cargar datos de la meta si estamos editando
  useEffect(() => {
    if (isEditing && goal) {
      reset({
        goal_name: goal.goal_name,
        target_amount: goal.target_amount.toString(),
        saved_amount: goal.saved_amount.toString(),
        deadline: goal.deadline ? new Date(goal.deadline) : undefined,
        description: goal.description || '',
      });
    }
  }, [isEditing, goal, reset]);
  
  // Ya importamos los thunks desde el slice
  
  // Manejar envío del formulario
  const handleFormSubmit = (data) => {
    // Verificar que tenemos el userId
    if (!userId) {
      toast({
        title: 'Error',
        description: 'No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.',
        variant: 'destructive',
      });
      return;
    }
    
    // Convertir montos a números
    const formattedData = {
      ...data,
      target_amount: Number(data.target_amount),
      saved_amount: Number(data.saved_amount),
      user_id: userId, // Asegurar que se envía el user_id correcto
    };
    
    console.log('Datos de la meta a guardar:', formattedData);
    
    if (isEditing) {
      // Actualizar meta existente
      dispatch(editGoal({ id: goal.id, updates: formattedData }))
        .unwrap()
        .then(() => {
          toast({
            title: 'Meta actualizada',
            description: 'La meta ha sido actualizada correctamente',
          });
          onClose();
        })
        .catch((error) => {
          toast({
            title: 'Error',
            description: `No se pudo actualizar la meta: ${error}`,
            variant: 'destructive',
          });
        });
    } else {
      // Crear nueva meta
      dispatch(createGoal(formattedData))
        .unwrap()
        .then((result) => {
          console.log('Meta creada exitosamente:', result);
          toast({
            title: 'Meta creada',
            description: 'La meta ha sido creada correctamente',
          });
          onClose();
        })
        .catch((error) => {
          console.error('Error al crear meta:', error);
          toast({
            title: 'Error al crear la meta',
            description: error.includes('policy') 
              ? 'Error de permisos en la base de datos. Por favor, contacta al administrador.'
              : `No se pudo crear la meta: ${error}`,
            variant: 'destructive',
          });
        });
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar Meta' : 'Nueva Meta'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardContent className="space-y-4">
          {/* Nombre de la meta */}
          <div className="space-y-2">
            <label htmlFor="goal_name" className="text-sm font-medium">
              Nombre de la meta
            </label>
            <Input
              id="goal_name"
              placeholder="Ej: Viaje a Europa"
              {...register('goal_name')}
              error={errors.goal_name?.message}
            />
            {errors.goal_name && (
              <p className="text-sm text-red-500">{errors.goal_name.message}</p>
            )}
          </div>
          
          {/* Eliminamos la sección de categoría ya que no existe en la tabla de Supabase */}
          
          {/* Monto objetivo */}
          <div className="space-y-2">
            <label htmlFor="target_amount" className="text-sm font-medium">
              Monto objetivo
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
              <Input
                id="target_amount"
                type="number"
                min="0"
                step="0.01"
                className="pl-7"
                placeholder="0.00"
                {...register('target_amount')}
              />
            </div>
            {errors.target_amount && (
              <p className="text-sm text-red-500">{errors.target_amount.message}</p>
            )}
          </div>
          
          {/* Monto ahorrado */}
          <div className="space-y-2">
            <label htmlFor="saved_amount" className="text-sm font-medium">
              Monto ahorrado
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
              <Input
                id="saved_amount"
                type="number"
                min="0"
                step="0.01"
                className="pl-7"
                placeholder="0.00"
                {...register('saved_amount')}
              />
            </div>
            {errors.saved_amount && (
              <p className="text-sm text-red-500">{errors.saved_amount.message}</p>
            )}
          </div>
          
          {/* Fecha límite */}
          <div className="space-y-2">
            <label htmlFor="deadline" className="text-sm font-medium">
              Fecha límite (opcional)
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: es })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => setValue('deadline', date)}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Descripción */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Descripción (opcional)
            </label>
            <textarea
              id="description"
              className="w-full min-h-[100px] px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Describe tu meta..."
              {...register('description')}
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </span>
            ) : (
              'Guardar'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
