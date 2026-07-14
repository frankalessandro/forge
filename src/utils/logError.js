/**
 * Loguea un error a consola con contexto antes de mostrarlo en la UI.
 * Sin esto, catch/if(error) solo guardaba err.message en el estado y se
 * perdía el detalle real (stack, código de Postgres) para debuguear.
 */
export function logError(context, error) {
  console.error(`[${context}]`, error)
}
