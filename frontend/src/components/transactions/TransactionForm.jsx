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

// Mapa de símbolos de moneda
const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  COP: '$',
  MXN: '$',
  ARS: '$',
  BRL: 'R$',
  CLP: '$',
  PEN: 'S/',
  UYU: '$U',
  VES: 'Bs.',
  // Agrega más monedas según sea necesario
};

// Esquema de validación
const transactionFormSchema = z.object({
  description: z.string().min(3, 'La descripción debe tener al menos 3 caracteres'),
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  tipo: z.string().min(1, 'Selecciona un tipo de transacción'),
  category: z.string().min(1, 'Selecciona una categoría'),
  subcategory: z.string().optional(),
  date: z.date(),
  goal_id: z.string().optional() // ID de la meta financiera asociada (opcional)
});

export function TransactionForm({ transaction, onSubmit, isLoading, goals = [] }) {
  const isEditing = !!transaction;
  
  // Categorías según el tipo de transacción
  const categories = {
    ingreso: [
      'Salario',
      'Inversiones',
      'Ventas',
      'Regalos',
      'Reembolsos',
      'Otros ingresos'
    ],
    gasto: [
      'Alimentación',
      'Vivienda',
      'Transporte',
      'Servicios',
      'Salud',
      'Educación',
      'Entretenimiento',
      'Ropa',
      'Deudas',
      'Otros gastos'
    ],
    ahorro: [
      'Ahorro',
      'Meta financiera'
    ],
    retiro: [
      'Retiro de ahorro',
      'Retiro de meta'
    ]
  };
  
  // Configurar react-hook-form
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      description: '',
      amount: '',
      tipo: 'gasto',
      category: '',
      subcategory: '',
      date: new Date(),
      goal_id: ''
    },
    values: transaction || undefined // Initialize with transaction data if editing
  });
  
  // Obtener la moneda del usuario desde el store de Redux
  const { user } = useSelector((state) => state.auth);
  const userCurrency = user?.profile?.currency || 'USD';
  const currencySymbol = CURRENCY_SYMBOLS[userCurrency] || '$';
  
  // Observar valores
  const selectedDate = watch('date');
  const selectedTipo = watch('tipo');
  
  // Cargar datos de la transacción si estamos editando
  useEffect(() => {
    if (isEditing && transaction) {
      console.log('Loading transaction data:', transaction);
      const formData = {
        description: transaction.description,
        amount: transaction.amount.toString(),
        tipo: transaction.tipo,
        category: transaction.category,
        subcategory: transaction.subcategory || '',
        date: new Date(transaction.date),
        goal_id: transaction.goal_id || ''
      };
      console.log('Form data to set:', formData);
      reset(formData);
      // Forzar la actualización de los valores después de un breve retraso
      const timer = setTimeout(() => {
        console.log('Forcing update of category field');
        setValue('category', transaction.category, { shouldValidate: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isEditing, transaction, reset, setValue]);
  
  // Actualizar categoría cuando cambia el tipo (solo para nuevas transacciones)
  useEffect(() => {
    if (!isEditing || !transaction) {
      setValue('category', '');
      setValue('subcategory', '');
    }
  }, [selectedTipo, setValue, isEditing, transaction]);

  // Asegurarse de que la categoría se establezca correctamente al cargar la transacción
  useEffect(() => {
    if (isEditing && transaction?.category) {
      setValue('category', transaction.category, { shouldValidate: true });
    }
  }, [isEditing, transaction, setValue]);
  
  // Manejar envío del formulario
  const handleFormSubmit = (data) => {
    // Convertir monto a número
    const formattedData = {
      ...data,
      amount: Number(data.amount),
    };
    
    // Si estamos editando, incluir el ID
    if (isEditing) {
      formattedData.id = transaction.id;
    }
    
    onSubmit(formattedData);
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar Transacción' : 'Nueva Transacción'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardContent className="space-y-4">
          {/* Tipo de transacción */}
          <div className="space-y-2">
            <label htmlFor="tipo" className="text-sm font-medium">
              Tipo de transacción
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Button
                type="button"
                variant={selectedTipo === 'ingreso' ? 'default' : 'outline'}
                className={selectedTipo === 'ingreso' ? 'bg-green-600 hover:bg-green-700' : ''}
                onClick={() => setValue('tipo', 'ingreso', { shouldValidate: true })}
              >
                Ingreso
              </Button>
              <Button
                type="button"
                variant={selectedTipo === 'gasto' ? 'default' : 'outline'}
                className={selectedTipo === 'gasto' ? 'bg-red-600 hover:bg-red-700' : ''}
                onClick={() => setValue('tipo', 'gasto', { shouldValidate: true })}
              >
                Gasto
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={selectedTipo === 'ahorro' ? 'default' : 'outline'}
                className={selectedTipo === 'ahorro' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                onClick={() => setValue('tipo', 'ahorro', { shouldValidate: true })}
              >
                Aporte a Meta
              </Button>
              <Button
                type="button"
                variant={selectedTipo === 'retiro' ? 'default' : 'outline'}
                className={selectedTipo === 'retiro' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                onClick={() => setValue('tipo', 'retiro', { shouldValidate: true })}
              >
                Retiro de Meta
              </Button>
            </div>
            {errors.tipo && (
              <p className="text-sm text-red-500">{errors.tipo.message}</p>
            )}
          </div>
          
          {/* Categoría */}
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Categoría
            </label>
            <Select
              value={watch('category')}
              onValueChange={(value) => {
                setValue('category', value, { shouldValidate: true });
              }}
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {selectedTipo && categories[selectedTipo].map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category.message}</p>
            )}
          </div>
          
          {/* Meta financiera (si es ahorro o retiro) */}
          {(selectedTipo === 'ahorro' || selectedTipo === 'retiro') && (
            <div className="space-y-2">
              <label htmlFor="goal_id" className="text-sm font-medium">
                Meta financiera
              </label>
              <Select
                value={watch('goal_id')}
                onValueChange={(value) => {
                  console.log('Selected goal ID:', value);
                  console.log('Available goals:', goals);
                  setValue('goal_id', value, { shouldValidate: true });
                  // Si se selecciona una meta, usar su nombre como subcategoría
                  const selectedGoal = goals?.find(g => g.id === value);
                  console.log('Selected goal:', selectedGoal);
                  if (selectedGoal) {
                    setValue('subcategory', selectedGoal.goal_name?.toLowerCase() || '', { shouldValidate: true });
                    setValue('category', 'Ahorro', { shouldValidate: true });
                  }
                }}
              >
                <SelectTrigger id="goal_id">
                  <SelectValue placeholder={goals?.length > 0 ? "Selecciona una meta" : "No hay metas disponibles"} />
                </SelectTrigger>
                <SelectContent>
                  {goals?.length > 0 ? (
                    goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.goal_name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No hay metas disponibles. Crea una meta primero.
                    </div>
                  )}
                </SelectContent>
              </Select>
              {!goals?.length && (
                <p className="text-sm text-yellow-600">
                  Debes crear una meta financiera antes de poder seleccionarla.
                </p>
              )}
            </div>
          )}
          
          {/* Subcategoría (opcional) */}
          {(selectedTipo === 'ingreso' || selectedTipo === 'gasto') && (
            <div className="space-y-2">
              <label htmlFor="subcategory" className="text-sm font-medium">
                Subcategoría (opcional)
              </label>
              <Input
                id="subcategory"
                placeholder="Ej. Supermercado"
                {...register('subcategory')}
              />
            </div>
          )}
          
          {/* Monto */}
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium">
              Monto ({userCurrency})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2">
                {currencySymbol}
              </span>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                className="pl-8"
                placeholder="0.00"
                {...register('amount')}
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>
          
          {/* Fecha */}
          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium">
              Fecha
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
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
                  onSelect={(date) => setValue('date', date, { shouldValidate: true })}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date.message}</p>
            )}
          </div>
          
          {/* Descripción */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Descripción
            </label>
            <Input
              id="description"
              placeholder="Ej. Compra de víveres"
              {...register('description')}
              error={errors.description?.message}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className={cn(
              selectedTipo === 'ingreso' ? 'bg-green-600 hover:bg-green-700' : '',
              selectedTipo === 'gasto' ? 'bg-red-600 hover:bg-red-700' : ''
            )}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </span>
            ) : (
              isEditing ? 'Actualizar' : 'Guardar'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
