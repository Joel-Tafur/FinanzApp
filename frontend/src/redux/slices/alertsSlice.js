import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  getAlerts, 
  addAlert, 
  updateAlert, 
  deleteAlert 
} from '../../lib/supabase';

// Thunks para operaciones asíncronas
export const fetchAlerts = createAsyncThunk(
  'alerts/fetchAlerts',
  async ({ userId }, { rejectWithValue }) => {
    try {
      const data = await getAlerts(userId);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createAlert = createAsyncThunk(
  'alerts/createAlert',
  async (alert, { rejectWithValue }) => {
    try {
      await addAlert(alert);
      return alert;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const editAlert = createAsyncThunk(
  'alerts/editAlert',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      await updateAlert(id, updates);
      return { id, updates };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeAlert = createAsyncThunk(
  'alerts/removeAlert',
  async (id, { rejectWithValue }) => {
    try {
      await deleteAlert(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Función para verificar si una alerta está activa (no vencida)
const isAlertActive = (alert) => {
  if (!alert.due_date) return false;
  
  // Crear fechas en formato YYYY-MM-DD para comparación sin considerar la hora
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDate = new Date(alert.due_date);
  // Asegurarse de que la fecha de vencimiento se interprete correctamente
  // convirtiendo a string y de vuelta a Date para evitar problemas de zona horaria
  const dueDateStr = dueDate.toISOString().split('T')[0];
  const [year, month, day] = dueDateStr.split('-').map(Number);
  const normalizedDueDate = new Date(year, month - 1, day);
  
  // La alerta está activa solo si la fecha de vencimiento es en el futuro (mañana o después)
  // Si es hoy o una fecha pasada, se considera vencida
  return normalizedDueDate > today;
};

// Función para verificar alertas para hoy
const checkTodayAlerts = (alerts) => {
  console.log('Verificando alertas para hoy...');
  console.log('Total de alertas recibidas:', alerts.length);
  
  // Obtener la fecha actual en la zona horaria local
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Formatear la fecha de hoy como YYYY-MM-DD para comparación
  const todayStr = today.toISOString().split('T')[0];
  
  console.log('Fecha de hoy (local):', todayStr);
  
  // Filtrar alertas que deben mostrarse en el dashboard hoy
  const todayAlerts = alerts.filter(alert => {
    if (!alert.due_date) {
      console.log('Alerta sin fecha de vencimiento:', alert.id);
      return false;
    }
    
    // Obtener la fecha de la alerta en formato YYYY-MM-DD
    const alertDate = new Date(alert.due_date);
    // Normalizar la fecha para evitar problemas de zona horaria
    const alertDateStr = alertDate.toISOString().split('T')[0];
    
    // Verificar si es para hoy comparando las cadenas YYYY-MM-DD
    const isToday = alertDateStr === todayStr;
    
    console.log(`Alerta ${alert.id} - ` +
      `Fecha en BD: ${alert.due_date}, ` +
      `Fecha normalizada: ${alertDateStr}, ` +
      `Es hoy: ${isToday}, ` +
      `Activa: ${alert.active}, ` +
      `Triggered: ${alert.triggered}`);
    
    // Mostrar en dashboard si:
    // 1. Es para hoy
    // 2. Está marcada como activa (active = true)
    // No importa si está vencida o no (triggered = false)
    return isToday && alert.active === true;
  });
  
  console.log('Alertas para mostrar en dashboard hoy:', todayAlerts.length);
  
  // Ordenar las alertas: primero las no enviadas, luego las enviadas
  const sortedAlerts = [...todayAlerts].sort((a, b) => 
    (a.enviado === b.enviado) ? 0 : a.enviado ? 1 : -1
  );
  
  console.log('Alertas ordenadas (no enviadas primero):', 
    sortedAlerts.map(a => ({ 
      id: a.id, 
      title: a.title, 
      enviado: a.enviado,
      active: a.active,
      triggered: a.triggered
    }))
  );
  
  return {
    hasAlerts: sortedAlerts.length > 0,
    count: sortedAlerts.length,
    alerts: sortedAlerts
  };
};

const initialState = {
  alerts: [],
  todayAlerts: {
    hasAlerts: false,
    count: 0,
    alerts: []
  },
  loading: false,
  error: null,
};

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    markAlertAsSent: (state, action) => {
      const alertId = action.payload;
      console.log('Reductor markAlertAsSent - ID de alerta:', alertId);
      
      state.alerts = state.alerts.map(alert => {
        if (alert.id === alertId) {
          console.log('Actualizando alerta a enviada:', alertId);
          return { ...alert, enviado: true };
        }
        return alert;
      });
      
      console.log('Recalculando alertas de hoy después de marcar como enviada');
      state.todayAlerts = checkTodayAlerts(state.alerts);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Alerts
      .addCase(fetchAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        console.log('fetchAlerts.fulfilled - Payload recibido:', action.payload);
        state.loading = false;
        
        // Actualizar el estado de triggered para cada alerta basado en su fecha de vencimiento
        const alertsWithTriggered = (action.payload || []).map(alert => ({
          ...alert,
          // Actualizar el estado triggered basado en la fecha de vencimiento
          triggered: isAlertActive(alert)
        }));
        
        state.alerts = alertsWithTriggered;
        
        // Verificar las fechas de las alertas cargadas
        if (alertsWithTriggered.length > 0) {
          console.log('Fechas de alertas cargadas:');
          alertsWithTriggered.forEach(alert => {
            console.log(`- Alerta ${alert.id}: ${alert.due_date} (${new Date(alert.due_date).toLocaleDateString()}), ` +
              `Triggered: ${alert.triggered}, Active: ${alert.active}`);
          });
        } else {
          console.log('No se cargaron alertas o el arreglo está vacío');
        }
        
        // Calcular las alertas de hoy
        state.todayAlerts = checkTodayAlerts(alertsWithTriggered);
        console.log('Alertas de hoy calculadas:', state.todayAlerts);
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Alert
      .addCase(createAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAlert.fulfilled, (state, action) => {
        state.loading = false;
        const newAlert = {
          ...action.payload,
          // Asegurarse de que la nueva alerta tenga el estado triggered correcto
          triggered: isAlertActive(action.payload)
        };
        state.alerts.push(newAlert);
        state.todayAlerts = checkTodayAlerts(state.alerts);
      })
      .addCase(createAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Edit Alert
      .addCase(editAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editAlert.fulfilled, (state, action) => {
        state.loading = false;
        const { id, updates } = action.payload;
        
        // Actualizar la alerta y recalcular el estado triggered si es necesario
        state.alerts = state.alerts.map(alert => {
          if (alert.id === id) {
            const updatedAlert = { ...alert, ...updates };
            // Si se actualizó la fecha de vencimiento, recalcular el estado triggered
            if (updates.due_date) {
              updatedAlert.triggered = isAlertActive(updatedAlert);
            }
            return updatedAlert;
          }
          return alert;
        });
        
        state.todayAlerts = checkTodayAlerts(state.alerts);
      })
      .addCase(editAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove Alert
      .addCase(removeAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeAlert.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts = state.alerts.filter(alert => alert.id !== action.payload);
        state.todayAlerts = checkTodayAlerts(state.alerts);
      })
      .addCase(removeAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, markAlertAsSent } = alertsSlice.actions;
export default alertsSlice.reducer;
