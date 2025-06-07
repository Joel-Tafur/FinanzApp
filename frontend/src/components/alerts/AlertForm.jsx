import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, AlertTriangle, Bell, PiggyBank, Edit as EditIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';

// Esquema de validación
const alertFormSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  message: z.string().min(3, 'El mensaje es requerido'),
  alert_type: z.string().min(1, 'Selecciona un tipo de alerta'),
  due_date: z.string().or(z.date()).transform(val => {
    if (val instanceof Date) return val.toISOString().split('T')[0];
    return val;
  }),
  threshold: z.number().min(0, 'El monto no puede ser negativo').optional(),
  enviado: z.boolean().default(false),
  active: z.boolean().default(true),
});

export function AlertForm({ initialData, onSubmit, onCancel, loading }) {
  const isEditing = !!initialData;
  
  // Tipos de alertas
  const alertTypes = [
    { value: 'expense', label: 'Límite de gastos' },
    { value: 'saving', label: 'Objetivo de ahorro' },
    { value: 'reminder', label: 'Recordatorio' },
  ];
  
  // Configurar react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(alertFormSchema),
    defaultValues: {
      title: '',
      message: '',
      alert_type: 'expense',
      due_date: new Date().toISOString().split('T')[0],
      threshold: 0,
      active: true,
      enviado: false
    }
  });
  
  // Cargar datos de la alerta si estamos editando
  useEffect(() => {
    if (isEditing && initialData) {
      console.log('Loading initial data:', initialData);
      reset({
        title: initialData.title || '',
        message: initialData.message || '',
        alert_type: initialData.alert_type || 'expense',
        due_date: initialData.due_date ? 
          new Date(initialData.due_date).toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0],
        threshold: initialData.threshold || 0,
        active: initialData.active !== false,
        enviado: initialData.enviado || false
      });
    }
  }, [isEditing, initialData, reset]);
  
  // Manejar envío del formulario
  const handleFormSubmit = (data) => {
    console.log('Form data submitted:', data);
    
    const formattedData = {
      ...data,
      // Asegurar que la fecha esté en el formato correcto
      due_date: data.due_date ? new Date(data.due_date).toISOString() : new Date().toISOString(),
      // Si estamos editando, incluir el ID
      ...(isEditing && initialData?.id && { id: initialData.id })
    };
    
    console.log('Formatted data for submission:', formattedData);
    onSubmit(formattedData);
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEditing ? (
            <>
              <EditIcon className="h-5 w-5" />
              Editar Alerta
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              Nueva Alerta
            </>
          )}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <CardContent className="space-y-4">
          {/* Título de la alerta */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Título de la alerta
            </label>
            <Input
              id="title"
              placeholder="Ej: Límite de gastos mensuales"
              {...register('title')}
              error={errors.title?.message}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>
          
          {/* Mensaje de la alerta */}
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              Mensaje de la alerta
            </label>
            <Input
              id="message"
              placeholder="Ej: Has alcanzado el límite de gastos mensuales"
              {...register('message')}
              error={errors.message?.message}
            />
            {errors.message && (
              <p className="text-sm text-red-500">{errors.message.message}</p>
            )}
          </div>
          
          {/* Tipo de alerta */}
          <div className="space-y-2">
            <label htmlFor="alert_type" className="text-sm font-medium">
              Tipo de alerta
            </label>
            <Select
              value={watch('alert_type')}
              onValueChange={(value) => setValue('alert_type', value)}
            >
              <SelectTrigger id="alert_type" className="w-full">
                <SelectValue placeholder="Selecciona un tipo de alerta" />
              </SelectTrigger>
              <SelectContent>
                {alertTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      {type.value === 'expense' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                      {type.value === 'saving' && <PiggyBank className="h-4 w-4 text-green-500" />}
                      {type.value === 'reminder' && <Bell className="h-4 w-4 text-blue-500" />}
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.alert_type && (
              <p className="text-sm text-red-500">{errors.alert_type.message}</p>
            )}
          </div>
          
          {/* Fecha de vencimiento */}
          <div className="space-y-2">
            <label htmlFor="due_date" className="text-sm font-medium">
              Fecha de vencimiento
            </label>
            <Input
              id="due_date"
              type="date"
              {...register('due_date')}
              error={errors.due_date?.message}
            />
            {errors.due_date && (
              <p className="text-sm text-red-500">{errors.due_date.message}</p>
            )}
          </div>
          
          {/* Límite/Threshold */}
          <div className="space-y-2">
            <label htmlFor="threshold" className="text-sm font-medium">
              Límite / Monto
            </label>
            <Input
              id="threshold"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ej: 1000.00"
              {...register('threshold', { valueAsNumber: true })}
              error={errors.threshold?.message}
            />
            {errors.threshold && (
              <p className="text-sm text-red-500">{errors.threshold.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Monto límite para la alerta (opcional)
            </p>
          </div>
          
          {/* Estado activo/inactivo */}
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="active"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              {...register('active')}
            />
            <label htmlFor="active" className="text-sm font-medium">
              Alerta activa
            </label>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-2 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditing ? 'Actualizando...' : 'Creando...'}
              </>
            ) : isEditing ? (
              <>
                <EditIcon className="mr-2 h-4 w-4" />
                Actualizar Alerta
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Crear Alerta
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
