import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Recursos de traducción inline para evitar problemas de importación dinámica en el build
const resources = {
  es: {
    common: {
      "welcome": "Bienvenido",
      "loading": "Cargando...",
      "connecting": "Conectando...",
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
      "lightMode": "Modo claro",
      "orContinueWith": "O continúa con",
      "orRegisterWith": "O regístrate con"
    },
    auth: {
      "login": {
        "google": "Google",
        "title": "Iniciar sesión",
        "subtitle": "Accede a tu cuenta de Pestilo",
        "email": "Correo electrónico",
        "emailPlaceholder": "tu@email.com",
        "password": "Contraseña",
        "rememberMe": "Recordarme",
        "forgotPassword": "¿Olvidaste tu contraseña?",
        "submit": "Iniciar sesión",
        "noAccount": "¿No tienes una cuenta?",
        "signUp": "Regístrate",
        "errors": {
          "unexpected": "Error inesperado al iniciar sesión",
          "unexpectedGoogle": "Error inesperado al iniciar sesión con Google",
          "emailInvalid": "Email inválido",
          "passwordMin": "La contraseña debe tener al menos 6 caracteres"
        }
      },
      "register": {
        "complete": "Completar registro",
        "google": "Google",
        "title": "Crear cuenta",
        "subtitle": "Únete a Pestilo hoy",
        "step1Subtitle": "Paso 1 de 2: Información básica",
        "step2Title": "Completar Registro",
        "step2Subtitle": "Paso 2 de 2: Selecciona tu rol y teléfono",
        "fullName": "Nombre Completo",
        "fullNamePlaceholder": "Tu nombre completo",
        "firstName": "Nombre",
        "lastName": "Apellido",
        "email": "Correo electrónico",
        "userInfo": "Información del Usuario",
        "phone": "Número de Teléfono",
        "phoneHelp": "Usaremos este número para contactarte si es necesario",
        "role": "Rol",
        "freePlanTitle": "Plan Gratuito Activado",
        "freePlanDesc": "Todos los usuarios nuevos comienzan con el plan gratuito. Puedes actualizar tu plan más tarde desde tu perfil.",
        "client": "Cliente",
        "professional": "Profesional",
        "admin": "Administrador",
        "password": "Contraseña",
        "confirmPassword": "Confirmar contraseña",
        "passwordHint": "Mínimo 6 caracteres",
        "termsAndConditions": "Acepto los términos y condiciones",
        "submit": "Crear cuenta",
        "hasAccount": "¿Ya tienes una cuenta?",
        "signIn": "Inicia sesión",
        "errors": {
          "nameRequired": "El nombre es requerido",
          "emailRequired": "El email es requerido",
          "emailInvalid": "Email inválido",
          "emailExists": "Este email ya está registrado. Por favor, inicia sesión o usa otro email.",
          "passwordMismatch": "Las contraseñas no coinciden",
          "passwordMin": "La contraseña debe tener al menos 6 caracteres",
          "phoneMin": "El teléfono debe tener al menos 7 caracteres",
          "unexpected": "Error inesperado al registrar usuario",
          "unexpectedGoogle": "Error inesperado al registrar con Google"
        }
      }
    },
    navigation: {
      "home": "Inicio",
      "dashboard": "Panel",
      "calendar": "Calendario",
      "notifications": "Notificaciones",
      "chat": "Chat",
      "users": "Usuarios",
      "professionals": "Profesionales",
      "clients": "Clientes",
      "timeSlots": "Turnos",
      "profile": "Perfil",
      "settings": "Configuración",
      "help": "Ayuda",
      "about": "Acerca de",
      "themes": "Temas",
      "demoComponents": "Demo Componentes",
      "services": "Servicios",
      "contact": "Contacto",
      "menu": "Menú",
      "myAccount": "Mi Cuenta",
      "login": "Iniciar sesión",
      "register": "Registrarse"
    }
  },
  en: {
    common: {
      "welcome": "Welcome",
      "loading": "Loading...",
      "connecting": "Connecting...",
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
      "lightMode": "Light mode",
      "orContinueWith": "Or continue with",
      "orRegisterWith": "Or sign up with"
    },
    auth: {
      "login": {
        "google": "Google",
        "title": "Sign in",
        "subtitle": "Access your Pestilo account",
        "email": "Email",
        "emailPlaceholder": "your@email.com",
        "password": "Password",
        "rememberMe": "Remember me",
        "forgotPassword": "Forgot your password?",
        "submit": "Sign in",
        "noAccount": "Don't have an account?",
        "signUp": "Sign up",
        "errors": {
          "unexpected": "Unexpected error while signing in",
          "unexpectedGoogle": "Unexpected error while signing in with Google",
          "emailInvalid": "Invalid email",
          "passwordMin": "Password must be at least 6 characters"
        }
      },
      "register": {
        "complete": "Complete registration",
        "google": "Google",
        "title": "Create account",
        "subtitle": "Join Pestilo today",
        "step1Subtitle": "Step 1 of 2: Basic information",
        "step2Title": "Complete Registration",
        "step2Subtitle": "Step 2 of 2: Select your role and phone",
        "fullName": "Full name",
        "fullNamePlaceholder": "Your full name",
        "firstName": "First name",
        "lastName": "Last name",
        "email": "Email",
        "userInfo": "User Information",
        "phone": "Phone Number",
        "phoneHelp": "We'll use this number to contact you if necessary",
        "role": "Role",
        "freePlanTitle": "Free Plan Activated",
        "freePlanDesc": "All new users start with the free plan. You can upgrade later from your profile.",
        "client": "Client",
        "professional": "Professional",
        "admin": "Administrator",
        "password": "Password",
        "confirmPassword": "Confirm password",
        "passwordHint": "Minimum 6 characters",
        "termsAndConditions": "I accept the terms and conditions",
        "submit": "Create account",
        "hasAccount": "Already have an account?",
        "signIn": "Sign in",
        "errors": {
          "nameRequired": "Name is required",
          "emailRequired": "Email is required",
          "emailInvalid": "Invalid email",
          "emailExists": "This email is already registered. Please sign in or use another email.",
          "passwordMismatch": "Passwords do not match",
          "passwordMin": "Password must be at least 6 characters",
          "phoneMin": "Phone must be at least 7 characters",
          "unexpected": "Unexpected error while signing up",
          "unexpectedGoogle": "Unexpected error while signing up with Google"
        }
      }
    },
    navigation: {
      "home": "Home",
      "dashboard": "Dashboard",
      "calendar": "Calendar",
      "notifications": "Notifications",
      "chat": "Chat",
      "users": "Users",
      "professionals": "Professionals",
      "clients": "Clients",
      "timeSlots": "Time slots",
      "profile": "Profile",
      "settings": "Settings",
      "help": "Help",
      "about": "About",
      "themes": "Themes",
      "demoComponents": "Demo Components",
      "services": "Services",
      "contact": "Contact",
      "menu": "Menu",
      "myAccount": "My account",
      "login": "Sign in",
      "register": "Sign up"
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
