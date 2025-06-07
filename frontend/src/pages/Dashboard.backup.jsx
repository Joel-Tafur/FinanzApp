import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Target, 
  Bell, 
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Clock,
  Calendar as CalendarIcon,
  Filter,
  Search,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { fetchTransactions } from '../redux/slices/transactionsSlice';
import { fetchGoals, updateGoalsProgress, removeGoal } from '../redux/slices/goalsSlice';
import { fetchAlerts, editAlert, removeAlert } from '../redux/slices/alertsSlice';
import { formatCurrency, useUserCurrency } from '../lib/utils';
import { ChartCard } from '../components/dashboard/ChartCard';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';

// Soft color palette
const COLORS = {
  primary: 'hsl(210, 90%, 60%)',
  success: 'hsl(142, 72%, 45%)',
  warning: 'hsl(38, 92%, 50%)',
  danger: 'hsl(0, 84%, 60%)',
  background: 'hsl(0, 0%, 98%)',
  card: 'hsl(0, 0%, 100%)',
  text: 'hsl(224, 30%, 27%)',
  textLight: 'hsl(224, 15%, 45%)',
  border: 'hsl(220, 13%, 91%)',
  accent1: 'hsl(210, 90%, 95%)',
  accent2: 'hsl(142, 90%, 96%)',
  accent3: 'hsl(38, 90%, 96%)',
  accent4: 'hsl(0, 90%, 97%)',
};

// Custom GoalCard component
const GoalCard = ({ goal, currencySymbol, onEdit, onDelete, colors }) => {
  const progress = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100);
  const daysLeft = Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24));
  
  return (
    <div className="space-y-3 p-4 rounded-lg border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium" style={{ color: colors.text }}>{goal.goal_name}</h4>
          <p className="text-sm mt-1" style={{ color: colors.textLight }}>
            {formatCurrency(goal.current_amount, '', currencySymbol)} de {formatCurrency(goal.target_amount, '', currencySymbol)}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <MoreHorizontal className="h-4 w-4" style={{ color: colors.textLight }} />
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs" style={{ color: colors.textLight }}>
          <span>{progress}% completado</span>
          <span>{daysLeft > 0 ? `${daysLeft} días restantes` : 'Vencido'}</span>
        </div>
        <Progress value={progress} className="h-2" style={{ backgroundColor: `${colors.border}80` }}>
          <Progress
            className="h-2 transition-all duration-500 ease-in-out"
            style={{ 
              backgroundColor: progress >= 100 ? colors.success : colors.primary,
              width: `${progress}%`
            }}
          />
        </Progress>
      </div>
    </div>
  );
};

// Custom AlertCard component
const AlertCard = ({ alert, onEdit, onDelete, onComplete }) => {
  return (
    <div className="p-3 rounded-lg border flex items-start" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
      <div className="bg-blue-100 p-2 rounded-full mr-3 mt-0.5">
        <Bell className="h-4 w-4" style={{ color: COLORS.primary }} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between">
          <h4 className="font-medium text-sm" style={{ color: COLORS.text }}>{alert.title}</h4>
          <span className="text-xs" style={{ color: COLORS.textLight }}>
            {new Date(alert.due_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-xs mt-1" style={{ color: COLORS.textLight }}>{alert.description}</p>
        <div className="mt-2 flex gap-2">
          <Button 
            variant="outline" 
            size="xs" 
            className="text-xs h-6 px-2"
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
          >
            Completar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useSelector((state) => state.auth);
  const { code: currencyCode, symbol: currencySymbol } = useUserCurrency();
  const { 
    transactions, 
    totals, 
    loading: transactionsLoading 
  } = useSelector((state) => state.transactions);
  const { 
    goalsWithProgress, 
    loading: goalsLoading 
  } = useSelector((state) => state.goals);
  const { 
    todayAlerts, 
    loading: alertsLoading 
  } = useSelector((state) => state.alerts);
  
  const [chartData, setChartData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const isLoading = transactionsLoading || goalsLoading || alertsLoading;

  // Stats data
  const stats = [
    {
      id: 'balance',
      title: 'Saldo Total',
      value: totals.saldo,
      change: 5.2,
      isPositive: true,
      icon: <Wallet className="h-5 w-5" />,
      color: COLORS.primary,
      bgColor: COLORS.accent1
    },
    {
      id: 'income',
      title: 'Ingresos',
      value: totals.ingresos,
      change: 12.5,
      isPositive: true,
      icon: <TrendingUp className="h-5 w-5" />,
      color: COLORS.success,
      bgColor: COLORS.accent2
    },
    {
      id: 'expenses',
      title: 'Gastos',
      value: totals.gastos,
      change: 3.8,
      isPositive: false,
      icon: <TrendingDown className="h-5 w-5" />,
      color: COLORS.danger,
      bgColor: COLORS.accent4
    },
    {
      id: 'savings',
      title: 'Ahorros',
      value: totals.ahorro,
      change: 8.1,
      isPositive: true,
      icon: <PiggyBank className="h-5 w-5" />,
      color: COLORS.warning,
      bgColor: COLORS.accent3
    }
  ];

  // Cargar datos al iniciar
  useEffect(() => {
    if (user?.userId) {
      dispatch(fetchTransactions({ userId: user.userId }));
      dispatch(fetchGoals({ userId: user.userId }));
      dispatch(fetchAlerts({ userId: user.userId }));
    }
  }, [dispatch, user]);
  
  // Función para marcar una alerta como enviada
  const handleMarkAlertAsSent = async (alertId) => {
    try {
      await dispatch(editAlert({ 
        id: alertId, 
        updates: { enviado: true } 
      })).unwrap();
      
      // Actualizar la lista de alertas
      dispatch(fetchAlerts({ userId: user.userId }));
      
      toast({
        title: 'Alerta actualizada',
        description: 'La alerta ha sido marcada como enviada',
      });
    } catch (error) {
      // Error al marcar la alerta como enviada
      toast({
        title: 'Error',
        description: 'No se pudo marcar la alerta como enviada',
        variant: 'destructive',
      });
    }
  };

  // Función para manejar la edición de una alerta
  const handleEditAlert = (alert) => {
    // Navegar a la página de alertas con el ID de la alerta a editar
    navigate('/alerts', { state: { editAlertId: alert.id } });
  };

  // Función para manejar la eliminación de una alerta
  const handleDeleteAlert = (alertId) => {
    if (!alertId) {
      toast({
        title: 'Error',
        description: 'ID de alerta no válido',
        variant: 'destructive',
      });
      return;
    }

    if (window.confirm('¿Estás seguro de que deseas eliminar esta alerta?')) {
      // Mostrar un toast de carga
      toast({
        title: 'Eliminando alerta...',
        description: 'Por favor espera mientras se elimina la alerta',
      });
      
      dispatch(removeAlert(alertId))
        .unwrap()
        .then(() => {
          toast({
            title: 'Alerta eliminada',
            description: 'La alerta ha sido eliminada correctamente',
          });
          
          // Recargar las alertas para asegurar que la UI esté actualizada
          if (user?.userId) {
            dispatch(fetchAlerts({ userId: user.userId }));
          }
        })
        .catch((error) => {
          // Error al eliminar alerta
          toast({
            title: 'Error',
            description: error.includes('policy') 
              ? 'Error de permisos en la base de datos. Por favor, contacta al administrador.'
              : `No se pudo eliminar la alerta: ${error}`,
            variant: 'destructive',
          });
        });
    }
  };
  
  // Actualizar progreso de metas cuando se cargan las transacciones
  useEffect(() => {
    if (transactions.length > 0) {
      dispatch(updateGoalsProgress(transactions));
    }
  }, [dispatch, transactions]);
  
  // Función para eliminar una meta financiera
  const handleDeleteGoal = (goalId) => {
    if (!goalId) {
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
      
      dispatch(removeGoal(goalId))
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
          // Error al eliminar meta
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
  
  // Preparar datos para los gráficos cuando se cargan las transacciones
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      prepareChartData();
    }
  }, [transactions]);
  
  // Función para preparar los datos de los gráficos
  const prepareChartData = () => {
    // Agrupar transacciones por diferentes períodos
    const weeklyData = groupTransactionsByWeek();
    const monthlyData = groupTransactionsByMonth();
    const yearlyData = groupTransactionsByYear();
    
    // Datos para gráfico de ingresos vs gastos
    const incomeVsExpensesData = {
      // Datos semanales
      week: {
        labels: Object.keys(weeklyData),
        datasets: [
          {
            label: 'Ingresos',
            data: Object.values(weeklyData).map(week => week.income),
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 2,
            fill: true,
          },
          {
            label: 'Gastos',
            data: Object.values(weeklyData).map(week => week.expenses),
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 2,
            fill: true,
          }
        ]
      },
      // Datos mensuales
      month: {
        labels: Object.keys(monthlyData),
        datasets: [
          {
            label: 'Ingresos',
            data: Object.values(monthlyData).map(month => month.income),
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 2,
            fill: true,
          },
          {
            label: 'Gastos',
            data: Object.values(monthlyData).map(month => month.expenses),
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 2,
            fill: true,
          }
        ]
      },
      // Datos anuales
      year: {
        labels: Object.keys(yearlyData),
        datasets: [
          {
            label: 'Ingresos',
            data: Object.values(yearlyData).map(year => year.income),
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 2,
            fill: true,
          },
          {
            label: 'Gastos',
            data: Object.values(yearlyData).map(year => year.expenses),
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 2,
            fill: true,
          }
        ]
      }
    };
    
    // Datos para gráfico de distribución de gastos para cada período
    const expenseDistributionData = {
      // Datos semanales
      week: {
        labels: Object.keys(getExpensesByCategory('week')),
        datasets: [
          {
            label: 'Gastos por Categoría (Semana)',
            data: Object.values(getExpensesByCategory('week')),
            backgroundColor: [
              'rgba(34, 197, 94, 0.7)',
              'rgba(59, 130, 246, 0.7)',
              'rgba(239, 68, 68, 0.7)',
              'rgba(249, 115, 22, 0.7)',
              'rgba(168, 85, 247, 0.7)',
              'rgba(236, 72, 153, 0.7)',
            ],
            borderWidth: 1,
          }
        ]
      },
      // Datos mensuales
      month: {
        labels: Object.keys(getExpensesByCategory('month')),
        datasets: [
          {
            label: 'Gastos por Categoría (Mes)',
            data: Object.values(getExpensesByCategory('month')),
            backgroundColor: [
              'rgba(34, 197, 94, 0.7)',
              'rgba(59, 130, 246, 0.7)',
              'rgba(239, 68, 68, 0.7)',
              'rgba(249, 115, 22, 0.7)',
              'rgba(168, 85, 247, 0.7)',
              'rgba(236, 72, 153, 0.7)',
            ],
            borderWidth: 1,
          }
        ]
      },
      // Datos anuales
      year: {
        labels: Object.keys(getExpensesByCategory('year')),
        datasets: [
          {
            label: 'Gastos por Categoría (Año)',
            data: Object.values(getExpensesByCategory('year')),
            backgroundColor: [
              'rgba(34, 197, 94, 0.7)',
              'rgba(59, 130, 246, 0.7)',
              'rgba(239, 68, 68, 0.7)',
              'rgba(249, 115, 22, 0.7)',
              'rgba(168, 85, 247, 0.7)',
              'rgba(236, 72, 153, 0.7)',
            ],
            borderWidth: 1,
          }
        ]
      }
    };
    
    setChartData({
      incomeVsExpenses: incomeVsExpensesData,
      expenseDistribution: expenseDistributionData
    });
  };
  
  // Agrupar transacciones por semana
  const groupTransactionsByWeek = () => {
    const weeklyData = {};
    
    // Obtener las últimas 6 semanas
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      // Calcular la fecha de inicio de la semana (domingo)
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (today.getDay() + 7 * i));
      
      // Calcular la fecha de fin de la semana (sábado)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // Formato: "DD/MM - DD/MM"
      const weekKey = `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;
      weeklyData[weekKey] = { income: 0, expenses: 0 };
    }
    
    // Agrupar transacciones
    transactions.forEach(transaction => {
      if (!transaction || !transaction.date) return; // Evitar errores con transacciones inválidas
      
      try {
        const date = new Date(transaction.date);
        if (isNaN(date.getTime())) return; // Verificar que la fecha sea válida
        
        // Encontrar a qué semana pertenece
        for (const [weekKey, data] of Object.entries(weeklyData)) {
          const [startStr, endStr] = weekKey.split(' - ');
          const [startDay, startMonth] = startStr.split('/').map(Number);
          const [endDay, endMonth] = endStr.split('/').map(Number);
          
          const startDate = new Date(date.getFullYear(), startMonth - 1, startDay);
          const endDate = new Date(date.getFullYear(), endMonth - 1, endDay);
          
          // Ajustar para comparación (ignorar horas)
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          date.setHours(12, 0, 0, 0);
          
          if (date >= startDate && date <= endDate) {
            if (transaction.tipo === 'ingreso') {
              data.income += Number(transaction.amount) || 0;
            } else if (transaction.tipo === 'gasto') {
              data.expenses += Number(transaction.amount) || 0;
            }
            break;
          }
        }
      } catch (error) {
        console.error('Error al procesar transacción para semana:', error, transaction);
      }
    });
    
    return weeklyData;
  };
  
  // Agrupar transacciones por mes
  const groupTransactionsByMonth = () => {
    const monthlyData = {};
    
    // Obtener los últimos 6 meses
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = month.toLocaleString('es', { month: 'short', year: '2-digit' });
      monthlyData[monthKey] = { income: 0, expenses: 0 };
    }
    
    // Agrupar transacciones
    transactions.forEach(transaction => {
      if (!transaction || !transaction.date) return; // Evitar errores con transacciones inválidas
      
      try {
        const date = new Date(transaction.date);
        if (isNaN(date.getTime())) return; // Verificar que la fecha sea válida
        
        const monthKey = date.toLocaleString('es', { month: 'short', year: '2-digit' });
        
        if (monthlyData[monthKey]) {
          if (transaction.tipo === 'ingreso') {
            monthlyData[monthKey].income += Number(transaction.amount) || 0;
          } else if (transaction.tipo === 'gasto') {
            monthlyData[monthKey].expenses += Number(transaction.amount) || 0;
          }
        }
      } catch (error) {
        console.error('Error al procesar transacción:', error, transaction);
      }
    });
    
    return monthlyData;
  };
  
  // Agrupar transacciones por año
  const groupTransactionsByYear = () => {
    const yearlyData = {};
    
    // Obtener los últimos 3 años
    const today = new Date();
    const currentYear = today.getFullYear();
    for (let i = 2; i >= 0; i--) {
      const year = currentYear - i;
      yearlyData[year.toString()] = { income: 0, expenses: 0 };
    }
    
    // Agrupar transacciones
    transactions.forEach(transaction => {
      if (!transaction || !transaction.date) return; // Evitar errores con transacciones inválidas
      
      try {
        const date = new Date(transaction.date);
        if (isNaN(date.getTime())) return; // Verificar que la fecha sea válida
        
        const yearKey = date.getFullYear().toString();
        
        if (yearlyData[yearKey]) {
          if (transaction.tipo === 'ingreso') {
            yearlyData[yearKey].income += Number(transaction.amount) || 0;
          } else if (transaction.tipo === 'gasto') {
            yearlyData[yearKey].expenses += Number(transaction.amount) || 0;
          }
        }
      } catch (error) {
        console.error('Error al procesar transacción para año:', error, transaction);
      }
    });
    
    return yearlyData;
  };
  
  // Obtener gastos por categoría con filtro de período
  const getExpensesByCategory = (period = 'month') => {
    const categories = {};
    
    if (!transactions || !Array.isArray(transactions)) {
      return categories;
    }
    
    // Determinar el rango de fechas según el período
    const today = new Date();
    let startDate = new Date();
    
    if (period === 'week') {
      // Última semana (7 días)
      startDate.setDate(today.getDate() - 7);
    } else if (period === 'month') {
      // Último mes (30 días)
      startDate.setDate(today.getDate() - 30);
    } else if (period === 'year') {
      // Último año (365 días)
      startDate.setDate(today.getDate() - 365);
    }
    
    // Filtrar transacciones por tipo 'gasto' y dentro del período seleccionado
    transactions
      .filter(t => {
        if (!t || t.tipo !== 'gasto' || !t.date) return false;
        
        try {
          const transactionDate = new Date(t.date);
          return transactionDate >= startDate && transactionDate <= today;
        } catch (error) {
          console.error('Error al filtrar por fecha:', error, t);
          return false;
        }
      })
      .forEach(transaction => {
        try {
          const category = transaction.category || 'Sin categoría';
          if (!categories[category]) {
            categories[category] = 0;
          }
          categories[category] += Number(transaction.amount) || 0;
        } catch (error) {
          console.error('Error al procesar categoría:', error, transaction);
        }
      });
    
    return categories;
  };
  
  
  // Calcular tendencia de ingresos y gastos
  const calculateTrend = (type) => {
    try {
      const monthlyData = groupTransactionsByMonth();
      if (!monthlyData) return { trend: 'neutral', value: '0%' };
      
      const months = Object.keys(monthlyData);
      
      if (months.length < 2) return { trend: 'neutral', value: '0%' };
      
      const currentMonth = monthlyData[months[months.length - 1]] || { income: 0, expenses: 0 };
      const previousMonth = monthlyData[months[months.length - 2]] || { income: 0, expenses: 0 };
      
      const current = type === 'income' ? (currentMonth.income || 0) : (currentMonth.expenses || 0);
      const previous = type === 'income' ? (previousMonth.income || 0) : (previousMonth.expenses || 0);
      
      if (previous === 0) return { trend: 'up', value: '100%' };
      
      const percentChange = ((current - previous) / previous) * 100;
      const trend = percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'neutral';
      const value = `${Math.abs(percentChange).toFixed(1)}%`;
      
      return { trend, value };
    } catch (error) {
      console.error('Error al calcular tendencia:', error);
      return { trend: 'neutral', value: '0%' };
    }
  };
  
  const incomeTrend = calculateTrend('income');
  const expensesTrend = calculateTrend('expenses');
  
  // Mostrar pantalla de carga
  if (transactionsLoading || goalsLoading || alertsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Link to="/transactions/new">
          <Button className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Transacción
          </Button>
        </Link>
      </div>
      
      {/* Tarjetas de estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Balance Total"
          value={`${currencySymbol}${(totals?.saldo || 0).toLocaleString()}`}
          icon={<Wallet className="h-6 w-6" />}
        />
        <StatCard
          title="Ingresos Mensuales"
          value={`${currencySymbol}${(totals?.ingresos || 0).toLocaleString()}`}
          icon={<TrendingUp className="h-6 w-6" />}
          trend={incomeTrend.trend}
          trendValue={incomeTrend.value}
        />
        <StatCard
          title="Gastos Mensuales"
          value={`${currencySymbol}${(totals?.gastos || 0).toLocaleString()}`}
          icon={<TrendingDown className="h-6 w-6" />}
          trend={expensesTrend.trend === 'up' ? 'down' : expensesTrend.trend === 'down' ? 'up' : 'neutral'}
          trendValue={expensesTrend.value}
        />
        <StatCard
          title="Ahorro Mensual"
          value={`${currencySymbol}${(totals?.ahorro || 0).toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
        />
      </div>
      
      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        {chartData && (
          <>
            <ChartCard
              title="Ingresos vs Gastos"
              data={chartData.incomeVsExpenses}
              type="line"
            />
            <ChartCard
              title="Distribución de Gastos"
              data={chartData.expenseDistribution}
              type="doughnut"
              allowPeriodChange={true}
            />
          </>
        )}
      </div>
    balance: {
      value: totals.saldo,
      change: 5.2,
      isPositive: true,
      icon: <Wallet className="h-5 w-5" />,
      color: COLORS.primary,
      bgColor: COLORS.accent1
    },
    income: {
      value: totals.ingresos,
      change: 12.5,
      isPositive: true,
      icon: <TrendingUp className="h-5 w-5" />,
      color: COLORS.success,
      bgColor: COLORS.accent2
    },
    expenses: {
      value: totals.gastos,
      change: 3.8,
      isPositive: false,
      icon: <TrendingDown className="h-5 w-5" />,
      color: COLORS.danger,
      bgColor: COLORS.accent4
    },
    savings: {
      value: totals.ahorro,
      change: 8.1,
      isPositive: true,
      icon: <PiggyBank className="h-5 w-5" />,
      color: COLORS.warning,
      bgColor: COLORS.accent3
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: COLORS.text }}>
              Hola, {user?.username || 'Usuario'}
            </h1>
            <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>
              Resumen de tus finanzas personales
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button 
              variant="outline" 
              className="flex-1 md:flex-none"
              onClick={() => navigate('/transactions')}
              style={{ borderColor: COLORS.border, color: COLORS.text }}
            >
              Ver Todas
            </Button>
            <Button 
              className="flex-1 md:flex-none"
              onClick={() => navigate('/transactions/new')}
              style={{ backgroundColor: COLORS.primary, color: 'white' }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.id} className="border-0 shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: COLORS.card }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: COLORS.textLight }}>
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold mb-2" style={{ color: COLORS.text }}>
                      {isLoading ? (
                        <Skeleton className="h-8 w-24" />
                      ) : (
                        formatCurrency(stat.value, currencyCode, currencySymbol)
                      )}
                    </p>
                    <div className="flex items-center">
                      {stat.isPositive ? (
                        <ArrowUpRight className="h-4 w-4 mr-1 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 mr-1 text-red-500" />
                      )}
                      <span className={`text-sm ${stat.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.isPositive ? '+' : ''}{stat.change}% vs mes pasado
                      </span>
                    </div>
                  </div>
                  <div 
                    className="p-3 rounded-full" 
                    style={{ backgroundColor: stat.bgColor }}
                  >
                    {React.cloneElement(stat.icon, { 
                      className: 'h-5 w-5',
                      style: { color: stat.color }
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Monthly Income/Expenses Chart */}
            <Card className="border-0 shadow-sm" style={{ backgroundColor: COLORS.card }}>
              <CardHeader>
                <CardTitle style={{ color: COLORS.text }}>Ingresos vs Gastos</CardTitle>
                <CardDescription style={{ color: COLORS.textLight }}>
                  Resumen mensual de tus finanzas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <Skeleton className="h-64 w-full" />
                    </div>
                  ) : (
                    <ChartCard data={chartData} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="border-0 shadow-sm" style={{ backgroundColor: COLORS.card }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle style={{ color: COLORS.text }}>Transacciones Recientes</CardTitle>
                  <Link to="/transactions">
                    <Button variant="ghost" size="sm" style={{ color: COLORS.primary }}>
                      Ver todas <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div 
                        key={transaction.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        style={{ border: `1px solid ${COLORS.border}` }}
                      >
                        <div className="flex items-center">
                          <div 
                            className="p-2 rounded-full mr-3"
                            style={{ backgroundColor: transaction.tipo === 'ingreso' ? COLORS.accent2 : COLORS.accent4 }}
                          >
                            {transaction.tipo === 'ingreso' ? (
                              <TrendingUp className="h-5 w-5" style={{ color: COLORS.success }} />
                            ) : (
                              <TrendingDown className="h-5 w-5" style={{ color: COLORS.danger }} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium" style={{ color: COLORS.text }}>
                              {transaction.description || 'Sin descripción'}
                            </p>
                            <p className="text-sm" style={{ color: COLORS.textLight }}>
                              {new Date(transaction.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p 
                            className={`font-medium ${transaction.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {transaction.tipo === 'ingreso' ? '+' : '-'} 
                            {formatCurrency(transaction.amount, currencyCode, currencySymbol)}
                          </p>
                          <p className="text-xs" style={{ color: COLORS.textLight }}>
                            {transaction.category || 'Sin categoría'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p style={{ color: COLORS.textLight }}>No hay transacciones recientes</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => navigate('/transactions/new')}
                      style={{ borderColor: COLORS.primary, color: COLORS.primary }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Transacción
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Goals & Alerts */}
          <div className="space-y-6">
            {/* Goals */}
            <Card className="border-0 shadow-sm" style={{ backgroundColor: COLORS.card }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle style={{ color: COLORS.text }}>Metas Financieras</CardTitle>
                  <Link to="/goals">
                    <Button variant="ghost" size="sm" style={{ color: COLORS.primary }}>
                      Ver todas <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : goalsWithProgress.length > 0 ? (
                  <div className="space-y-4">
                    {goalsWithProgress.slice(0, 2).map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        currencySymbol={currencySymbol}
                        onEdit={() => navigate(`/goals`, { state: { editGoalId: goal.id } })}
                        onDelete={handleDeleteGoal}
                        colors={COLORS}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Target className="mx-auto h-10 w-10 mb-2" style={{ color: COLORS.textLight, opacity: 0.5 }} />
                    <p className="mb-4" style={{ color: COLORS.textLight }}>No tienes metas configuradas</p>
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/goals/new')}
                      style={{ borderColor: COLORS.primary, color: COLORS.primary }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Meta
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card className="border-0 shadow-sm" style={{ backgroundColor: COLORS.card }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle style={{ color: COLORS.text }}>Recordatorios</CardTitle>
                  <Link to="/alerts">
                    <Button variant="ghost" size="sm" style={{ color: COLORS.primary }}>
                      Ver todos <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : todayAlerts?.alerts?.length > 0 ? (
                  <div className="space-y-4">
                    {todayAlerts.alerts.slice(0, 3).map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onEdit={handleEditAlert}
                        onDelete={handleDeleteAlert}
                        onComplete={handleMarkAlertAsSent}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Bell className="mx-auto h-10 w-10 mb-2" style={{ color: COLORS.textLight, opacity: 0.5 }} />
                    <p style={{ color: COLORS.textLight }}>No hay recordatorios para hoy</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
