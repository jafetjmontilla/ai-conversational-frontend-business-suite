import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Recursos de traducción inline para evitar problemas de importación dinámica en el build
const resources = {
  es: {
    common: {
      "welcome": "Bienvenido",
      "loading": "Cargando...",
      "error": "Error",
      "success": "Éxito",
      "cancel": "Cancelar",
      "confirm": "Confirmar",
      "save": "Guardar",
      "delete": "Eliminar",
      "edit": "Editar",
      "close": "Cerrar",
      "back": "Volver",
      "next": "Siguiente",
      "previous": "Anterior",
      "search": "Buscar",
      "filter": "Filtrar",
      "sort": "Ordenar",
      "actions": "Acciones",
      "settings": "Configuración",
      "profile": "Perfil",
      "logout": "Cerrar sesión",
      "language": "Idioma",
      "theme": "Tema",
      "darkMode": "Modo oscuro",
      "lightMode": "Modo claro"
    },
    auth: {
      "login": {
        "title": "Iniciar sesión",
        "subtitle": "Accede a tu cuenta de Pestilo",
        "email": "Correo electrónico",
        "password": "Contraseña",
        "rememberMe": "Recordarme",
        "forgotPassword": "¿Olvidaste tu contraseña?",
        "submit": "Iniciar sesión",
        "noAccount": "¿No tienes una cuenta?",
        "signUp": "Regístrate"
      },
      "register": {
        "title": "Crear cuenta",
        "subtitle": "Únete a Pestilo hoy",
        "firstName": "Nombre",
        "lastName": "Apellido",
        "email": "Correo electrónico",
        "password": "Contraseña",
        "confirmPassword": "Confirmar contraseña",
        "termsAndConditions": "Acepto los términos y condiciones",
        "submit": "Crear cuenta",
        "hasAccount": "¿Ya tienes una cuenta?",
        "signIn": "Inicia sesión"
      }
    },
    navigation: {
      "home": "Inicio",
      "dashboard": "Panel",
      "profile": "Perfil",
      "settings": "Configuración",
      "help": "Ayuda",
      "about": "Acerca de"
    }
  },
  en: {
    common: {
      "welcome": "Welcome",
      "loading": "Loading...",
      "error": "Error",
      "success": "Success",
      "cancel": "Cancel",
      "confirm": "Confirm",
      "save": "Save",
      "delete": "Delete",
      "edit": "Edit",
      "close": "Close",
      "back": "Back",
      "next": "Next",
      "previous": "Previous",
      "search": "Search",
      "filter": "Filter",
      "sort": "Sort",
      "actions": "Actions",
      "settings": "Settings",
      "profile": "Profile",
      "logout": "Logout",
      "language": "Language",
      "theme": "Theme",
      "darkMode": "Dark mode",
      "lightMode": "Light mode"
    },
    auth: {
      "login": {
        "title": "Sign in",
        "subtitle": "Access your Pestilo account",
        "email": "Email",
        "password": "Password",
        "rememberMe": "Remember me",
        "forgotPassword": "Forgot your password?",
        "submit": "Sign in",
        "noAccount": "Don't have an account?",
        "signUp": "Sign up"
      },
      "register": {
        "title": "Create account",
        "subtitle": "Join Pestilo today",
        "firstName": "First name",
        "lastName": "Last name",
        "email": "Email",
        "password": "Password",
        "confirmPassword": "Confirm password",
        "termsAndConditions": "I accept the terms and conditions",
        "submit": "Create account",
        "hasAccount": "Already have an account?",
        "signIn": "Sign in"
      }
    },
    navigation: {
      "home": "Home",
      "dashboard": "Dashboard",
      "profile": "Profile",
      "settings": "Settings",
      "help": "Help",
      "about": "About"
    }
  }
};

// Configuración que funciona tanto en cliente como en servidor
i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    lng: 'es', // Idioma por defecto
    defaultNS: 'common',
    
    interpolation: {
      escapeValue: false, // React ya escapa por defecto
    },
    
    // Solo habilitar debug en desarrollo y en el cliente
    debug: false,
    
    react: {
      useSuspense: false, // Evita problemas con SSR
    },
  });

export default i18n;

// Tipos para TypeScript
export type SupportedLanguages = 'es' | 'en';
export type Namespaces = 'common' | 'auth' | 'navigation';
