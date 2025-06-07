import { createClient } from '@supabase/supabase-js';

// Estas variables deberían estar en un archivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Crear el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Funciones de autenticación
export const signUp = async (email, password, username) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;

  // Crear el perfil de usuario en la tabla users
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          auth_user_id: authData.user.id,
          username,
          email,
        },
      ]);

    if (profileError) throw profileError;
  }

  return authData;
};

export const signIn = async (email, password) => {
  try {
    console.log('Iniciando signIn con Supabase...');
    
    // Iniciar sesión con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error en signIn de Supabase:', error);
      throw error;
    }
    
    console.log('Sesión iniciada correctamente en Supabase');
    
    // Verificar que el usuario exista en la tabla users
    const userInfo = await ensureUserInDatabase();
    if (!userInfo) {
      console.error('No se pudo obtener o crear el usuario en la tabla users');
      throw new Error('No se pudo obtener o crear el usuario en la base de datos');
    }
    
    console.log('Usuario verificado en la tabla users:', userInfo.email);
    
    // Devolver los datos de la sesión y el usuario
    return {
      ...data,
      user: {
        ...data.user,
        userId: userInfo.id,
        username: userInfo.username
      }
    };
  } catch (error) {
    console.error('Error completo en signIn:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    console.log('Cerrando sesión...');
    
    // Limpiar localStorage antes de cerrar sesión para evitar problemas de persistencia
    localStorage.removeItem('finanzas_user');
    
    // Cerrar sesión en Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
    
    console.log('Sesión cerrada correctamente');
  } catch (error) {
    console.error('Error completo en signOut:', error);
    throw error;
  }
};

// Función para verificar y crear el usuario en public.users si no existe
export const ensureUserInDatabase = async () => {
  try {
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    // Intentar obtener el usuario directamente por auth_user_id
    let { data: existingUser, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .maybeSingle(); // Usar maybeSingle en lugar de single para evitar errores
    
    // Si hay un error que no sea de "no se encontraron resultados"
    if (queryError) {
      console.error('Error al verificar usuario:', queryError);
      throw queryError;
    }
    
    // Si el usuario ya existe, devolverlo
    if (existingUser) {
      console.log('Usuario encontrado en public.users:', existingUser);
      return existingUser;
    }
    
    // Intentar obtener el usuario por email como respaldo
    ({ data: existingUser, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .maybeSingle());
    
    if (existingUser) {
      console.log('Usuario encontrado por email en public.users:', existingUser);
      return existingUser;
    }
    
    // Si el usuario no existe en public.users, crearlo
    try {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            auth_user_id: user.id,
            username: user.email.split('@')[0], // Usar parte del email como username
            email: user.email,
          },
        ])
        .select()
        .single();
      
      if (insertError) {
        // Si hay un error de clave duplicada, intentar obtener el usuario existente
        if (insertError.code === '23505') {
          console.log('Usuario ya existe, intentando obtenerlo de nuevo...');
          const { data: existingUser, error: getError } = await supabase
            .from('users')
            .select('*')
            .eq('auth_user_id', user.id)
            .single();
          
          if (!getError && existingUser) {
            return existingUser;
          }
        }
        
        console.error('Error al crear usuario en public.users:', insertError);
        throw insertError;
      }
      
      console.log('Usuario creado en public.users:', newUser);
      return newUser;
    } catch (insertError) {
      // Último intento: si hay un error de duplicado, intentar obtener el usuario una vez más
      if (insertError.code === '23505') {
        console.log('Intento final de recuperación de usuario...');
        // Esperar un momento para que la base de datos se actualice
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: finalUser, error: finalError } = await supabase
          .from('users')
          .select('*')
          .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
          .maybeSingle();
        
        if (!finalError && finalUser) {
          return finalUser;
        }
      }
      throw insertError;
    }
  } catch (error) {
    console.error('Error en ensureUserInDatabase:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    // Obtener la sesión actual
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error al obtener la sesión:', error);
      throw error;
    }
    
    if (!session) {
      console.log('No hay sesión activa');
      return null;
    }

    console.log('Sesión encontrada:', session.user.email);
    
    // Obtener información adicional del usuario desde la tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .single();

    if (userError) {
      console.error('Error al obtener datos de usuario:', userError);
      
      // Si no se encuentra el usuario, intentar crearlo
      if (userError.code === 'PGRST116') {
        console.log('Usuario no encontrado en la tabla users, intentando crearlo...');
        return await ensureUserInDatabase();
      }
      
      throw userError;
    }

    const userInfo = {
      ...session.user,
      username: userData.username,
      userId: userData.id, // Este es el ID de la tabla users, no el auth_user_id
      profile: {
        ...session.user.user_metadata,
        currency: userData.currency || 'USD', // Asegurar que siempre haya un valor por defecto
        photo_url: userData.photo_url || session.user.user_metadata?.avatar_url || null, // Incluir la URL de la foto de perfil
        updated_at: userData.updated_at || new Date().toISOString()
      }
    };
    
    console.log('Datos del perfil cargados:', {
      photo_url: userInfo.profile.photo_url,
      currency: userInfo.profile.currency
    });
    
    console.log('Usuario completo cargado:', userInfo.email);
    return userInfo;
  } catch (error) {
    console.error('Error en getCurrentUser:', error);
    throw error;
  }
};

// Funciones para transacciones
export const getTransactions = async (userId, filters = {}) => {
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  // Aplicar filtros si existen
  if (filters.startDate && filters.endDate) {
    query = query
      .gte('date', filters.startDate)
      .lte('date', filters.endDate);
  }

  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  if (filters.subcategory) {
    query = query.eq('subcategory', filters.subcategory);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const addTransaction = async (transaction) => {
  // Asegurarse de que goal_id sea null si no está definido
  const transactionData = {
    ...transaction,
    goal_id: transaction.goal_id || null
  };

  const { data, error } = await supabase
    .from('transactions')
    .insert([transactionData])
    .select();

  if (error) throw error;
  return data[0];
};

export const updateTransaction = async (id, updates) => {
  // Asegurarse de que updates sea un objeto
  if (!updates || typeof updates !== 'object') {
    throw new Error('Invalid updates object');
  }
  
  // Crear un objeto de actualización seguro
  const updateData = { ...updates };
  
  // Solo incluir goal_id si existe en updates
  if ('goal_id' in updates) {
    updateData.goal_id = updates.goal_id || null;
  }

  const { data, error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0];
};

export const deleteTransaction = async (id) => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Funciones para metas financieras
export const getFinancialGoals = async (userId) => {
  const { data, error } = await supabase
    .from('financial_goals')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
};

export const addFinancialGoal = async (goal) => {
  // Verificar que el usuario esté autenticado
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No hay sesión activa');

  // Asegurarse de que el goal tenga el user_id correcto
  const { data, error } = await supabase
    .from('financial_goals')
    .insert([goal])
    .select();

  if (error) {
    console.error('Error al crear meta financiera:', error);
    throw error;
  }
  return data[0];
};

export const updateFinancialGoal = async (id, updates) => {
  // Verificar que el usuario esté autenticado
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No hay sesión activa');

  const { data, error } = await supabase
    .from('financial_goals')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error al actualizar meta financiera:', error);
    throw error;
  }
  return data[0];
};

export const deleteFinancialGoal = async (id) => {
  // Verificar que el usuario esté autenticado
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No hay sesión activa');

  const { error } = await supabase
    .from('financial_goals')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error al eliminar meta financiera:', error);
    throw error;
  }
};

// Función para actualizar el perfil del usuario
export const updateUserProfile = async (profileData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');

    console.log('Datos del perfil recibidos:', profileData);
    
    // Preparar los datos para actualizar
    const updateData = {
      updated_at: new Date().toISOString()
    };

    // Incluir solo los campos que se proporcionan
    if (profileData.username !== undefined) {
      updateData.username = profileData.username;
    }
    if (profileData.currency !== undefined) {
      updateData.currency = profileData.currency;
    }

    console.log('Datos a actualizar:', updateData);

    // Actualizar el perfil en la tabla users
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('auth_user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error details:', error);
      throw error;
    }
    
    console.log('Perfil actualizado en Supabase:', data);
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Upload profile photo
export const uploadProfilePhoto = async (file) => {
  try {
    console.log('Iniciando carga de foto de perfil...');
    
    // 1. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Error de autenticación:', authError || 'Usuario no autenticado');
      throw new Error('No hay usuario autenticado');
    }
    console.log('Usuario autenticado:', user.id);

    // 2. Generar nombre de archivo único
    const fileExt = file.name.split('.').pop();
    const fileName = `profile_${user.id}_${Date.now()}.${fileExt}`;
    const filePath = `profile-photos/${fileName}`;
    console.log('Ruta del archivo generada:', filePath);
    
    // 3. Subir archivo al bucket
    console.log('Iniciando subida a Supabase Storage...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });

    if (uploadError) {
      console.error('Error al subir el archivo a Supabase Storage:', uploadError);
      throw new Error('No se pudo subir la imagen. Verifica que el bucket exista y tengas los permisos necesarios.');
    }
    console.log('Archivo subido exitosamente:', uploadData);

    // 4. Obtener URL pública
    console.log('Obteniendo URL pública...');
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);
    console.log('URL pública generada:', publicUrl);
    
    // 5. Actualizar perfil del usuario
    console.log('Actualizando perfil del usuario en la base de datos...');
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .update({ 
        photo_url: publicUrl,
        updated_at: new Date().toISOString() 
      })
      .eq('auth_user_id', user.id)
      .select()
      .single();

    if (profileError) {
      console.error('Error al actualizar el perfil en la base de datos:', profileError);
      throw new Error('No se pudo actualizar la foto de perfil. Por favor, intenta de nuevo.');
    }

    console.log('Perfil actualizado con éxito:', profileData);
    return profileData;
  } catch (error) {
    console.error('Error en uploadProfilePhoto:', error);
    throw error;
  }
};

// Delete profile photo
export const deleteProfilePhoto = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');

    // Get current user data to check if there's a photo to delete
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('photo_url')
      .eq('auth_user_id', user.id)
      .single();

    if (fetchError) throw fetchError;
    if (!currentUser.photo_url) return null;

    // Extract the file path from the URL
    const url = new URL(currentUser.photo_url);
    const filePath = url.pathname.split('/storage/v1/object/public/profile-photos/')[1];

    if (!filePath) {
      console.warn('Could not extract file path from URL:', currentUser.photo_url);
    } else {
      // Delete the file from storage
      const { error: deleteError } = await supabase.storage
        .from('profile-photos')
        .remove([filePath]);

      if (deleteError) {
        console.warn('Error deleting file from storage:', deleteError);
        // Continue even if file deletion fails
      }
    }

    // Update the user's profile to remove the photo URL
    const { data: profileData, error: updateError } = await supabase
      .from('users')
      .update({ 
        photo_url: null,
        updated_at: new Date().toISOString() 
      })
      .eq('auth_user_id', user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return profileData;
  } catch (error) {
    console.error('Error deleting profile photo:', error);
    throw error;
  }
};

// Funciones para alertas
export const getAlerts = async (userId) => {
  console.log('Obteniendo alertas para el usuario:', userId);
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true });

  if (error) {
    console.error('Error al obtener alertas:', error);
    throw error;
  }
  
  console.log('Alertas obtenidas:', data);
  return data;
};

export const addAlert = async (alert) => {
  const { data, error } = await supabase
    .from('alerts')
    .insert([alert]);

  if (error) throw error;
  return data;
};

export const updateAlert = async (id, updates) => {
  const { data, error } = await supabase
    .from('alerts')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
  return data;
};

export const deleteAlert = async (id) => {
  console.log('Eliminando alerta con ID:', id);
  
  if (!id) {
    throw new Error('No se proporcionó un ID de alerta válido');
  }
  
  const { data, error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', id)
    .select('id')
    .single();

  if (error) {
    console.error('Error al eliminar la alerta en Supabase:', error);
    throw new Error(error.message || 'Error al eliminar la alerta');
  }
  
  console.log('Alerta eliminada correctamente:', data);
  return data;
};
