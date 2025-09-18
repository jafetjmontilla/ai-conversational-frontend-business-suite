import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  User,
  AuthError
} from 'firebase/auth';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Verificar que las variables de entorno estén disponibles
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  throw new Error('Faltan las variables de entorno de Firebase');
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Obtener instancia de autenticación
export const auth = getAuth(app);

// Proveedor de Google
export const googleProvider = new GoogleAuthProvider();

// Tipos para la autenticación
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phone?: string | null;
  emailVerified: boolean;
  providerId: string;
  customClaims?: {
    _id: string;
    role?: string;
    phone?: string;
    assignedAt?: string;
  };
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
  error?: string;
}

// Función para registrar usuario con email y contraseña
export const registerWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    return {
      success: true,
      message: 'Usuario registrado exitosamente',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        providerId: user.providerData[0]?.providerId || 'password'
      }
    };
  } catch (error: any) {
    let message = 'Error al registrar usuario';

    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'El email ya está registrado';
        break;
      case 'auth/invalid-email':
        message = 'Email inválido';
        break;
      case 'auth/weak-password':
        message = 'La contraseña es muy débil';
        break;
      default:
        message = error.message;
    }

    return {
      success: false,
      message,
      error: error.code
    };
  }
};

// Función para iniciar sesión con email y contraseña
export const signInWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    return {
      success: true,
      message: 'Sesión iniciada exitosamente',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        providerId: user.providerData[0]?.providerId || 'password'
      }
    };
  } catch (error: any) {
    let message = 'Error al iniciar sesión';

    switch (error.code) {
      case 'auth/user-not-found':
        message = 'Usuario no encontrado';
        break;
      case 'auth/wrong-password':
        message = 'Contraseña incorrecta';
        break;
      case 'auth/invalid-email':
        message = 'Email inválido';
        break;
      case 'auth/user-disabled':
        message = 'Usuario deshabilitado';
        break;
      default:
        message = error.message;
    }

    return {
      success: false,
      message,
      error: error.code
    };
  }
};

// Función para iniciar sesión con Google
export const signInWithGoogle = async (): Promise<AuthResponse> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    return {
      success: true,
      message: 'Sesión iniciada con Google exitosamente',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        providerId: user.providerData[0]?.providerId || 'google.com'
      }
    };
  } catch (error: any) {
    let message = 'Error al iniciar sesión con Google';

    switch (error.code) {
      case 'auth/popup-closed-by-user':
        message = 'Ventana de Google cerrada por el usuario';
        break;
      case 'auth/popup-blocked':
        message = 'Ventana de Google bloqueada por el navegador';
        break;
      case 'auth/cancelled-popup-request':
        message = 'Solicitud de Google cancelada';
        break;
      default:
        message = error.message;
    }

    return {
      success: false,
      message,
      error: error.code
    };
  }
};

// Función para cerrar sesión
export const signOutUser = async (): Promise<AuthResponse> => {
  try {
    await signOut(auth);
    return {
      success: true,
      message: 'Sesión cerrada exitosamente'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Error al cerrar sesión',
      error: error.message
    };
  }
};

// Función para obtener el usuario actual
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Función para obtener el token de ID
export const getIdToken = async (): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  } catch (error) {
    console.error('Error al obtener token:', error);
    return null;
  }
};

// Función para enviar email de recuperación de contraseña
export const sendPasswordResetEmail = async (email: string): Promise<AuthResponse> => {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: 'Email de recuperación enviado exitosamente'
    };
  } catch (error: any) {
    let message = 'Error al enviar email de recuperación';

    switch (error.code) {
      case 'auth/user-not-found':
        message = 'No existe una cuenta con este email';
        break;
      case 'auth/invalid-email':
        message = 'Email inválido';
        break;
      case 'auth/too-many-requests':
        message = 'Demasiados intentos. Intenta más tarde';
        break;
      default:
        message = error.message;
    }

    return {
      success: false,
      message,
      error: error.code
    };
  }
};

// Hook para escuchar cambios en el estado de autenticación
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export default app; 