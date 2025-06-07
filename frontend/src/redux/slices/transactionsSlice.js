import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  getTransactions,
  addTransaction as addTransactionApi,
  updateTransaction as updateTransactionApi,
  deleteTransaction as deleteTransactionApi
} from '../../lib/supabase';
import { updateGoalsWithTransactions } from './goalsSlice';

// Thunks para operaciones asíncronas
export const fetchTransactions = createAsyncThunk(
  'transactions/fetchTransactions',
  async ({ userId, filters }, { rejectWithValue }) => {
    try {
      const data = await getTransactions(userId, filters);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addTransaction = createAsyncThunk(
  'transactions/addTransaction',
  async (transaction, { rejectWithValue, dispatch }) => {
    try {
      const data = await addTransactionApi(transaction);
      
      // Si es una transacción de ahorro o retiro vinculada a una meta, actualizar el progreso de la meta
      if ((transaction.tipo === 'ahorro' || transaction.tipo === 'retiro') && transaction.goal_id) {
        dispatch(updateGoalsWithTransactions([data]));
      }
      
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateTransaction = createAsyncThunk(
  'transactions/editTransaction',
  async ({ id, updates }, { rejectWithValue, dispatch }) => {
    try {
      await updateTransactionApi(id, updates);
      
      // Si es una transacción de ahorro o retiro vinculada a una meta, actualizar el progreso de la meta
      if ((updates.tipo === 'ahorro' || updates.tipo === 'retiro') && updates.goal_id) {
        const transaction = { ...updates, id };
        dispatch(updateGoalsWithTransactions([transaction]));
      }
      
      return { id, updates };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteTransaction = createAsyncThunk(
  'transactions/removeTransaction',
  async (id, { rejectWithValue }) => {
    try {
      await deleteTransactionApi(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Función para calcular los totales por categoría
const calculateTotals = (transactions) => {
  const totals = {
    ingresos: 0,
    gastos: 0,
    ahorro: 0,
    saldo: 0
  };

  transactions.forEach(transaction => {
    const { amount, tipo } = transaction;

    if (tipo === 'ingreso') {
      totals.ingresos += amount;
    } else if (tipo === 'gasto' || tipo === 'retiro') {
      // Los retiros ahora se consideran como gastos
      totals.gastos += amount;
    } else if (tipo === 'ahorro') {
      // Solo sumar al ahorro cuando el tipo es específicamente 'ahorro'
      totals.ahorro += amount;
    }
  });

  totals.saldo = totals.ingresos - totals.gastos;
  return totals;
};

const initialState = {
  transactions: [],
  filteredTransactions: [],
  totals: {
    ingresos: 0,
    gastos: 0,
    ahorro: 0,
    saldo: 0
  },
  currentFilters: {},
  loading: false,
  error: null,
};

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.currentFilters = action.payload;
      
      // Aplicar filtros a las transacciones
      if (Object.keys(action.payload).length === 0) {
        state.filteredTransactions = state.transactions;
      } else {
        const { startDate, endDate, category, subcategory } = action.payload;
        
        state.filteredTransactions = state.transactions.filter(transaction => {
          let match = true;
          
          if (startDate && endDate) {
            const transactionDate = new Date(transaction.date);
            match = match && transactionDate >= new Date(startDate) && 
                              transactionDate <= new Date(endDate);
          }
          
          if (category) {
            match = match && transaction.category.toLowerCase() === category.toLowerCase();
          }
          
          if (subcategory) {
            match = match && transaction.subcategory.toLowerCase() === subcategory.toLowerCase();
          }
          
          return match;
        });
      }
      
      // Recalcular totales con las transacciones filtradas
      state.totals = calculateTotals(state.filteredTransactions);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
        state.filteredTransactions = action.payload;
        state.totals = calculateTotals(action.payload);
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Transaction
      .addCase(addTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions.unshift(action.payload);
        state.filteredTransactions = state.transactions;
        state.totals = calculateTotals(state.transactions);
      })
      .addCase(addTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Edit Transaction
      .addCase(updateTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        state.loading = false;
        const { id, updates } = action.payload;
        state.transactions = state.transactions.map(transaction => 
          transaction.id === id ? { ...transaction, ...updates } : transaction
        );
        state.filteredTransactions = state.transactions;
        state.totals = calculateTotals(state.transactions);
      })
      .addCase(updateTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove Transaction
      .addCase(deleteTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = state.transactions.filter(
          transaction => transaction.id !== action.payload
        );
        state.filteredTransactions = state.transactions;
        state.totals = calculateTotals(state.transactions);
      })
      .addCase(deleteTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setFilters } = transactionsSlice.actions;

// Exportar función para obtener una transacción por ID
export const fetchTransactionById = createAsyncThunk(
  'transactions/fetchTransactionById',
  async (id, { rejectWithValue }) => {
    try {
      // Implementar función para obtener transacción por ID
      // Esta es una implementación temporal
      return { id };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
export default transactionsSlice.reducer;
