import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  getFinancialGoals, 
  addFinancialGoal, 
  updateFinancialGoal, 
  deleteFinancialGoal 
} from '../../lib/supabase';

// Thunks para operaciones asíncronas
export const fetchGoals = createAsyncThunk(
  'goals/fetchGoals',
  async ({ userId }, { rejectWithValue }) => {
    try {
      const data = await getFinancialGoals(userId);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createGoal = createAsyncThunk(
  'goals/createGoal',
  async (goal, { rejectWithValue, dispatch }) => {
    try {
      // Llamar a la función de Supabase y obtener la meta creada con su ID
      const createdGoal = await addFinancialGoal(goal);
      
      // Recargar todas las metas para asegurar consistencia
      dispatch(fetchGoals({ userId: goal.user_id }));
      
      return createdGoal;
    } catch (error) {
      console.error('Error al crear meta:', error);
      return rejectWithValue(error.message || 'Error al crear la meta financiera');
    }
  }
);

export const editGoal = createAsyncThunk(
  'goals/editGoal',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      await updateFinancialGoal(id, updates);
      return { id, updates };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeGoal = createAsyncThunk(
  'goals/removeGoal',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      // Verificar que tenemos un ID válido
      if (!id) {
        throw new Error('ID de meta no válido');
      }
      
      console.log('Eliminando meta con ID:', id);
      await deleteFinancialGoal(id);
      
      return id;
    } catch (error) {
      console.error('Error al eliminar meta:', error);
      return rejectWithValue(error.message || 'Error al eliminar la meta financiera');
    }
  }
);

// Actualizar el progreso de las metas con las transacciones
export const updateGoalsWithTransactions = createAsyncThunk(
  'goals/updateGoalsWithTransactions',
  async (transactions, { getState, dispatch }) => {
    const { goals } = getState().goals;
    const userId = getState().auth.user?.userId;
    
    if (!goals || goals.length === 0 || !transactions || transactions.length === 0) {
      return { goals, transactions };
    }
    
    try {
      // Filtrar transacciones de ahorro y retiro
      const savingsTransactions = transactions.filter(t => 
        (t.tipo === 'ahorro' || t.tipo === 'retiro') && t.goal_id
      );
      
      if (savingsTransactions.length === 0) {
        return { goals, transactions };
      }
      
      // Actualizar el monto ahorrado para cada meta
      const updatedGoals = [];
      
      for (const goal of goals) {
        // Buscar transacciones relacionadas con esta meta
        const goalTransactions = savingsTransactions.filter(t => t.goal_id === goal.id);
        
        if (goalTransactions.length > 0) {
          // Calcular el monto ahorrado
          let savedAmount = goal.saved_amount || 0;
          
          goalTransactions.forEach(t => {
            if (t.tipo === 'ahorro') {
              savedAmount += Number(t.amount);
            } else if (t.tipo === 'retiro') {
              savedAmount -= Number(t.amount);
            }
          });
          
          // Actualizar la meta en Supabase
          await updateFinancialGoal(goal.id, { saved_amount: savedAmount });
          updatedGoals.push({ ...goal, saved_amount: savedAmount });
        }
      }
      
      // Si se actualizaron metas, volver a cargarlas
      if (updatedGoals.length > 0 && userId) {
        await dispatch(fetchGoals({ userId }));
      }
    } catch (error) {
      console.error('Error al actualizar el progreso de las metas:', error);
    }
    
    return { goals, transactions };
  }
);

// Función para calcular el progreso de las metas
const calculateGoalProgress = (goals, transactions) => {
  const today = new Date();
  
  return goals.map(goal => {
    // Usar el valor saved_amount que ya existe en la meta
    // Este es el valor que el usuario ingresó manualmente
    const savedAmount = goal.saved_amount || 0;
    const completed = savedAmount >= goal.target_amount;
    const expired = !completed && goal.deadline && new Date(goal.deadline) < today;
    
    return {
      ...goal,
      progress: Math.min((savedAmount / goal.target_amount) * 100, 100),
      completed,
      expired
    };
  });
};

const initialState = {
  goals: [],
  goalsWithProgress: [],
  loading: false,
  error: null,
};

const goalsSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateGoalsProgress: (state, action) => {
      const transactions = action.payload;
      state.goalsWithProgress = calculateGoalProgress(state.goals, transactions);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Goals
      .addCase(fetchGoals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.loading = false;
        state.goals = action.payload;
        // El progreso se calculará cuando tengamos las transacciones
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Goal
      .addCase(createGoal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGoal.fulfilled, (state, action) => {
        state.loading = false;
        state.goals.push(action.payload);
        // El progreso se actualizará con updateGoalsProgress
      })
      .addCase(createGoal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Edit Goal
      .addCase(editGoal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editGoal.fulfilled, (state, action) => {
        state.loading = false;
        const { id, updates } = action.payload;
        state.goals = state.goals.map(goal => 
          goal.id === id ? { ...goal, ...updates } : goal
        );
        // El progreso se actualizará con updateGoalsProgress
      })
      .addCase(editGoal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove Goal
      .addCase(removeGoal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeGoal.fulfilled, (state, action) => {
        state.loading = false;
        state.goals = state.goals.filter(goal => goal.id !== action.payload);
        state.goalsWithProgress = state.goalsWithProgress.filter(
          goal => goal.id !== action.payload
        );
      })
      .addCase(removeGoal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, updateGoalsProgress } = goalsSlice.actions;
export default goalsSlice.reducer;
