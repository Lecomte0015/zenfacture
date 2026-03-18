/**
 * Extrait un message d'erreur lisible depuis n'importe quelle valeur lancée.
 * Remplace le pattern `catch (err: any) => err.message` par un typage sûr.
 *
 * Usage:
 *   } catch (err: unknown) {
 *     const message = getErrorMessage(err);
 *   }
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err === null) return 'null';
  if (err === undefined) return 'undefined';
  try {
    const json = JSON.stringify(err);
    return json ?? String(err);
  } catch {
    return String(err);
  }
}
