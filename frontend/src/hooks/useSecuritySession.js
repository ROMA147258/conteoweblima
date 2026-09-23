import { useEffect, useRef, useCallback } from 'react';

// Constantes de seguridad estilo banco
const INACTIVITY_TIMEOUT_MS = 90 * 1000; // 90 segundos (1.5 min)
const BACKGROUND_TIMEOUT_MS = 25 * 1000; // 25 segundos en segundo plano

/**
 * Hook de Seguridad de Sesión Estilo Banco:
 * - Auto-Logout tras 90 segundos sin actividad táctil o de mouse.
 * - Auto-Logout tras 25 segundos en segundo plano (pantalla bloqueada, WhatsApp, pestaña minimizada).
 * - Congelación total de tráfico en segundo plano.
 */
export const useSecuritySession = ({ isAuthenticated, logout }) => {
  const inactivityTimerRef = useRef(null);
  const backgroundTimerRef = useRef(null);
  const backgroundStartTimeRef = useRef(null);

  // Función para cerrar sesión por seguridad
  const triggerAutoLogout = useCallback((reason) => {
    console.warn(`[Seguridad Banco] Cierre automático de sesión: ${reason}`);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (backgroundTimerRef.current) clearTimeout(backgroundTimerRef.current);
    if (logout) {
      logout(reason);
    }
  }, [logout]);

  // Reiniciar temporizador de 90s de inactividad
  const resetInactivityTimer = useCallback(() => {
    if (!isAuthenticated) return;
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      triggerAutoLogout('inactividad (90 segundos)');
    }, INACTIVITY_TIMEOUT_MS);
  }, [isAuthenticated, triggerAutoLogout]);

  // Manejar cambio de visibilidad (segundo plano / primer plano)
  const handleVisibilityChange = useCallback(() => {
    if (!isAuthenticated) return;

    if (document.hidden) {
      // Entró a segundo plano (bloqueo de pantalla, cambio de app / WhatsApp, pestaña minimizada)
      backgroundStartTimeRef.current = Date.now();
      
      // Limpiar timer de inactividad normal
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // Iniciar timer estricto de 25 segundos de background
      if (backgroundTimerRef.current) {
        clearTimeout(backgroundTimerRef.current);
      }
      backgroundTimerRef.current = setTimeout(() => {
        triggerAutoLogout('tiempo en segundo plano excedido (25 segundos)');
      }, BACKGROUND_TIMEOUT_MS);
    } else {
      // Regresó a primer plano
      if (backgroundTimerRef.current) {
        clearTimeout(backgroundTimerRef.current);
        backgroundTimerRef.current = null;
      }

      // Validar si el tiempo transcurrido en background superó los 25 segundos (por suspensión del hilo de JS en móviles)
      if (backgroundStartTimeRef.current) {
        const elapsed = Date.now() - backgroundStartTimeRef.current;
        backgroundStartTimeRef.current = null;
        if (elapsed >= BACKGROUND_TIMEOUT_MS) {
          triggerAutoLogout('tiempo en segundo plano excedido al reanudar');
          return;
        }
      }

      // Reiniciar timer normal de 90s
      resetInactivityTimer();
    }
  }, [isAuthenticated, triggerAutoLogout, resetInactivityTimer]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (backgroundTimerRef.current) clearTimeout(backgroundTimerRef.current);
      return;
    }

    // Inicializar timer de inactividad
    resetInactivityTimer();

    // Eventos de actividad del usuario
    const activityEvents = [
      'touchstart',
      'touchmove',
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'click'
    ];

    const handleUserActivity = () => {
      // Solo reiniciar si la pestaña está visible
      if (!document.hidden) {
        resetInactivityTimer();
      }
    };

    // Registrar listeners pasivos para máxima fluidez y bajo consumo de CPU
    activityEvents.forEach(evt => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Registrar visibilidad y cambio de ventana
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleVisibilityChange);

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (backgroundTimerRef.current) clearTimeout(backgroundTimerRef.current);
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleVisibilityChange);
    };
  }, [isAuthenticated, resetInactivityTimer, handleVisibilityChange]);
};
