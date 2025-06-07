import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { signIn, signUp, signOut, getCurrentUser, updateUserProfile, uploadProfilePhoto, deleteProfilePhoto } from '../../lib/supabase';

// Exportar getCurrentUser para su uso en otros componentes
export { getCurrentUser };

// Thunks para operaciones asíncronas
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    try {
      console.log('Iniciando login...');
      const data = await signIn(email, password);
      
      // Obtener el usuario completo después de iniciar sesión
      const user = await getCurrentUser();
      
      if (!user) {
        console.error('No se pudo obtener el usuario después de iniciar sesión');
        return rejectWithValue('No se pudo obtener el usuario después de iniciar sesión');
      }
      
      console.log('Login exitoso para:', user.email);
      return { ...data, user };
    } catch (error) {
      console.error('Error en login:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async ({ email, password, username }, { rejectWithValue }) => {
    try {
      const data = await signUp(email, password, username);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await signOut();
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Iniciando fetchCurrentUser...');
      const user = await getCurrentUser();
      console.log('Usuario obtenido en fetchCurrentUser:', user?.email);
      return user;
    } catch (error) {
      console.error('Error en fetchCurrentUser:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const updatedProfile = await updateUserProfile(profileData);
      return updatedProfile;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const uploadUserPhoto = createAsyncThunk(
  'auth/uploadPhoto',
  async (file, { rejectWithValue }) => {
    try {
      const updatedProfile = await uploadProfilePhoto(file);
      return updatedProfile;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeUserPhoto = createAsyncThunk(
  'auth/removePhoto',
  async (_, { rejectWithValue }) => {
    try {
      const updatedProfile = await deleteProfilePhoto();
      return updatedProfile;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Intentar recuperar el usuario del localStorage al iniciar
const savedUser = localStorage.getItem('finanzas_user') ? 
  JSON.parse(localStorage.getItem('finanzas_user')) : null;

const initialState = {
  user: savedUser,
  isAuthenticated: !!savedUser,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        // Guardar en localStorage
        localStorage.setItem('finanzas_user', JSON.stringify(action.payload.user));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        // Eliminar del localStorage
        localStorage.removeItem('finanzas_user');
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Current User
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = !!action.payload;
        
        if (action.payload) {
          // Si ya existe un usuario, fusionar los perfiles para no perder datos
          if (state.user) {
            state.user = {
              ...action.payload,
              profile: {
                ...state.user.profile, // Mantener datos existentes del perfil
                ...action.payload.profile, // Sobrescribir con los nuevos datos
                currency: action.payload.profile?.currency || state.user.profile?.currency || 'USD', // Asegurar que siempre haya una moneda
                // Mantener la foto de perfil existente si no hay una nueva
                photo_url: action.payload.profile?.photo_url || state.user.profile?.photo_url || null
              }
            };
          } else {
            state.user = action.payload;
          }
          
          // Asegurarse de que el perfil tenga valores por defecto
          if (state.user) {
            state.user.profile = {
              ...state.user.profile,
              currency: state.user.profile?.currency || 'USD',
              photo_url: state.user.profile?.photo_url || null,
              updated_at: state.user.profile?.updated_at || new Date().toISOString()
            };
          }
          
          // Actualizar localStorage
          localStorage.setItem('finanzas_user', JSON.stringify(state.user));
        } else {
          state.user = null;
          localStorage.removeItem('finanzas_user');
        }
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user) {
          // Actualizar tanto el username como el perfil
          state.user = {
            ...state.user,
            username: action.payload.username || state.user.username,
            profile: {
              ...state.user.profile,
              ...action.payload,
              updated_at: new Date().toISOString()
            }
          };
          // Actualizar localStorage
          localStorage.setItem('finanzas_user', JSON.stringify(state.user));
        }
      })
      // Upload User Photo
      .addCase(uploadUserPhoto.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadUserPhoto.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user) {
          // Actualizar la URL de la foto de perfil en el estado del usuario
          state.user = {
            ...state.user,
            profile: {
              ...state.user.profile,
              photo_url: action.payload.photo_url,
              updated_at: action.payload.updated_at
            }
          };
          // Actualizar localStorage
          localStorage.setItem('finanzas_user', JSON.stringify(state.user));
        }
      })
      .addCase(uploadUserPhoto.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove Photo
      .addCase(removeUserPhoto.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeUserPhoto.fulfilled, (state) => {
        state.loading = false;
        if (state.user && state.user.profile) {
          state.user.profile.photo_url = null;
        }
      })
      .addCase(removeUserPhoto.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
