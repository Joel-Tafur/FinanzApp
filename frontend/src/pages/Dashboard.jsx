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
  Plus 
} from 'lucide-react';
import { fetchTransactions } from '../redux/slices/transactionsSlice';
import { fetchGoals, updateGoalsProgress, removeGoal } from '../redux/slices/goalsSlice';
import { fetchAlerts, editAlert, removeAlert } from '../redux/slices/alertsSlice';
import { formatCurrency, useUserCurrency } from '../lib/utils';
import { StatCard } from '../components/dashboard/StatCard';
import { ChartCard } from '../components/dashboard/ChartCard';
import { GoalCard } from '../components/dashboard/GoalCard';
import { AlertCard } from '../components/dashboard/AlertCard';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';

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
      
      {/* Metas y Alertas */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Metas Financieras
            </h2>
            <Link to="/goals">
              <Button variant="outline" size="sm">
                Ver Todas
              </Button>
            </Link>
          </div>
          
          <div className="space-y-4">
            {goalsWithProgress.length > 0 ? (
              goalsWithProgress
                .slice(0, 3)
                .map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={() => navigate(`/goals`, { state: { editGoalId: goal.id } })}
                    onDelete={(goalId) => handleDeleteGoal(goalId)}
                  />
                ))
            ) : (
              <p className="text-muted-foreground">No hay metas financieras configuradas.</p>
            )}
            
            {goalsWithProgress.length > 0 && (
              <Link to="/goals" className="block text-center">
                <Button variant="link">
                  {goalsWithProgress.length > 3 ? 'Ver más metas' : 'Administrar metas'}
                </Button>
              </Link>
            )}
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              Alertas Recientes
            </h2>
            <Link to="/alerts">
              <Button variant="outline" size="sm">
                Ver Todas
              </Button>
            </Link>
          </div>
          
          <div className="space-y-4">
            {todayAlerts?.alerts?.length > 0 ? (
              <>
                {todayAlerts.alerts.slice(0, 3).map(alert => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      onMarkAsSent={handleMarkAlertAsSent}
                      onEdit={handleEditAlert}
                      onDelete={handleDeleteAlert}
                    />
                ))}
                <div className="text-center">
                  <Link to="/alerts">
                    <Button variant="link">
                      {todayAlerts.alerts.length > 3 ? 'Ver más alertas' : 'Administrar alertas'}
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No hay alertas para hoy.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
