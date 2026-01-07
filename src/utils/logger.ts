/**
 * Sistema de Logging Condicional
 * Logs aparecem apenas em desenvolvimento
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Log de desenvolvimento - só aparece em DEV
   */
  dev: (...args: any[]) => {
    if (isDev) {
      console.log('[DEV]', ...args);
    }
  },

  /**
   * Log de informação - aparece sempre
   */
  info: (...args: any[]) => {
    console.log('[INFO]', ...args);
  },

  /**
   * Log de aviso - aparece sempre
   */
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Log de erro - aparece sempre
   */
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },

  /**
   * Log de sucesso - só em DEV
   */
  success: (...args: any[]) => {
    if (isDev) {
      console.log('[SUCCESS] ✅', ...args);
    }
  },
};
