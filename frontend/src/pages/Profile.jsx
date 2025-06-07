import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateProfile, logout, uploadUserPhoto, removeUserPhoto } from '../redux/slices/authSlice';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../components/ui/use-toast';
import { User, LogOut, Save, Camera, X, Loader2, Edit } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Esquema de validación con Zod
const profileSchema = z.object({
  username: z.string().min(2, 'El nombre de usuario debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  currency: z.string().min(1, 'Selecciona una moneda'),
});

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function Profile() {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { user, loading } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  
  // Set initial preview image
  useEffect(() => {
    if (user?.profile?.photo_url) {
      setPreviewImage(user.profile.photo_url);
    }
  }, [user?.profile?.photo_url]);

  // Configurar react-hook-form con validación de Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || user?.profile?.name || '',
      email: user?.email || '',
      currency: user?.profile?.currency || 'USD',
    },
  });

  // Manejar el envío del formulario
  const onSubmit = async (data) => {
    try {
      console.log('Enviando datos del formulario:', data);
      
      // Solo enviar los campos que necesitamos actualizar
      const updateData = {
        username: data.username,
        currency: data.currency
      };
      
      console.log('Datos a enviar a updateProfile:', updateData);
      
      const resultAction = await dispatch(updateProfile(updateData));
      
      if (updateProfile.fulfilled.match(resultAction)) {
        console.log('Perfil actualizado exitosamente:', resultAction.payload);
        setIsEditing(false);
        
        toast({
          title: 'Perfil actualizado',
          description: 'Tu perfil ha sido actualizado correctamente.',
          variant: 'default',
        });
      } else if (updateProfile.rejected.match(resultAction)) {
        console.error('Error al actualizar el perfil:', resultAction.error);
        toast({
          title: 'Error al actualizar',
          description: resultAction.payload || 'No se pudo actualizar el perfil',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error al actualizar el perfil:', err);
      toast({
        title: 'Error inesperado',
        description: 'Ocurrió un error al actualizar el perfil. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  // Manejar la carga de la foto de perfil
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validar tipo de archivo
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({
        title: 'Formato no soportado',
        description: 'Por favor, sube una imagen en formato JPG, PNG o WebP.',
        variant: 'destructive',
      });
      return;
    }
    
    // Validar tamaño del archivo
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'Archivo demasiado grande',
        description: 'La imagen no debe superar los 5MB.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsUploading(true);
      setPreviewImage(URL.createObjectURL(file));
      
      // Mostrar notificación de carga
      toast({
        title: 'Subiendo imagen...',
        description: 'Por favor, espera mientras se sube tu foto de perfil.',
        variant: 'default',
      });
      
      await dispatch(uploadUserPhoto(file));
      
      toast({
        title: '✅ Foto de perfil actualizada',
        description: 'Tu foto de perfil se ha actualizado correctamente.',
      });
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      setPreviewImage(user?.profile?.photo_url || null);
      toast({
        title: '❌ Error',
        description: error.message || 'No se pudo actualizar la foto de perfil',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Limpiar el input de archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Manejar la eliminación de la foto de perfil
  const handleRemovePhoto = async () => {
    if (!user?.profile?.photo_url) return;
    
    try {
      setIsUploading(true);
      await dispatch(removeUserPhoto());
      
      setPreviewImage(null);
      toast({
        title: '✅ Foto eliminada',
        description: 'Tu foto de perfil ha sido eliminada.',
      });
    } catch (error) {
      console.error('Error al eliminar la imagen:', error);
      toast({
        title: '❌ Error',
        description: error.message || 'No se pudo eliminar la foto de perfil',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout());
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión correctamente.',
        variant: 'default',
      });
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  const handleCancel = () => {
    reset({
      username: user?.username || user?.profile?.name || '',
      email: user?.email || '',
      currency: user?.profile?.currency || 'USD',
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Card className="text-center py-8">
          <CardContent>
            <p className="text-muted-foreground">No hay información de usuario disponible</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <Button variant="outline" onClick={handleLogout} disabled={isUploading}>
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative group">
              <Avatar className="h-24 w-24">
                <AvatarImage src={previewImage} alt={user.profile?.name || 'Usuario'} />
                <AvatarFallback className="bg-primary/10 text-2xl">
                  {user.profile?.name ? user.profile.name.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              
              {isEditing && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <label className="cursor-pointer p-2 text-white hover:text-primary">
                    <Camera className="h-5 w-5" />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/jpeg, image/png, image/webp"
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                  {previewImage && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={isUploading}
                      className="p-2 text-white hover:text-destructive"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}
              
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>
            
            <div className="text-center sm:text-left">
              <CardTitle className="text-2xl">{user.username || user.profile?.name || 'Usuario'}</CardTitle>
              <CardDescription className="text-base">{user.email}</CardDescription>
              {isEditing && (
                <p className="text-xs text-muted-foreground mt-1">
                  Haz clic en la imagen para cambiar la foto de perfil
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Nombre de usuario
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Tu nombre de usuario"
                {...register('username')}
                className={errors.username ? 'border-destructive' : ''}
                disabled={!isEditing}
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Correo Electrónico
              </label>
              <Input
                id="email"
                type="email"
                placeholder="tu@ejemplo.com"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
                disabled={true} // El email no se puede editar
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="currency" className="text-sm font-medium">
                Moneda Predeterminada
              </label>
              <select
                id="currency"
                {...register('currency')}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.currency ? 'border-destructive' : 'border-input'
                } bg-background text-foreground`}
                disabled={!isEditing}
              >
                <option value="USD">Dólar Estadounidense (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="MXN">Peso Mexicano (MXN)</option>
                <option value="COP">Peso Colombiano (COP)</option>
                <option value="ARS">Peso Argentino (ARS)</option>
                <option value="CLP">Peso Chileno (CLP)</option>
                <option value="PEN">Sol Peruano (PEN)</option>
              </select>
              {errors.currency && (
                <p className="text-sm text-destructive">{errors.currency.message}</p>
              )}
            </div>
            
            <div className="pt-4 space-y-2">
              <h3 className="text-lg font-medium">Información de la Cuenta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de registro</p>
                  <p className="text-sm">
                    {user.created_at
                      ? new Intl.DateTimeFormat('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }).format(new Date(user.created_at))
                      : 'No disponible'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Último inicio de sesión</p>
                  <p className="text-sm">
                    {user.last_sign_in_at
                      ? new Intl.DateTimeFormat('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(new Date(user.last_sign_in_at))
                      : 'No disponible'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">ID de Usuario</p>
                  <p className="text-sm font-mono text-muted-foreground break-all">
                    {user.id || 'No disponible'}
                  </p>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          {isEditing ? (
            <div className="flex w-full justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                onClick={handleSubmit(onSubmit)} 
                disabled={loading || isUploading}
                className="ml-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="w-full flex justify-end">
              <Button 
                onClick={() => setIsEditing(true)}
                className="ml-auto"
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar Perfil
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
