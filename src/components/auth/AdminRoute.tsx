import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Garde de rôle pour le back-office (/dashboard/admin/*).
 *
 * Avant cette garde, les routes admin n'étaient protégées que par
 * `ProtectedRoute` (authentification + 2FA), sans aucune vérification de
 * rôle côté frontend — n'importe quel utilisateur connecté pouvait naviguer
 * directement vers /dashboard/admin et voir l'interface s'afficher. Les
 * données restaient bloquées par les policies RLS (public.is_admin()), donc
 * ce n'était pas une fuite de données, mais ce n'est pas une protection
 * correcte : la défense doit exister aux deux niveaux (frontend ET base de
 * données), pas seulement côté base.
 *
 * Cette garde vérifie `profils.role` et redirige immédiatement vers
 * /dashboard tout utilisateur qui n'est ni `admin` ni `super_admin`.
 */
const AdminRoute = ({ children }: AdminRouteProps) => {
  const [status, setStatus] = useState<'checking' | 'allowed' | 'denied'>('checking');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) setStatus('denied');
          return;
        }

        const { data: profile, error } = await supabase
          .from('profils')
          .select('role')
          .eq('id', user.id)
          .single();

        const role = (profile as { role?: string } | null)?.role;
        const isAdmin = !error && (role === 'admin' || role === 'super_admin');

        if (!cancelled) setStatus(isAdmin ? 'allowed' : 'denied');
      } catch {
        if (!cancelled) setStatus('denied');
      }
    })();

    return () => { cancelled = true; };
  }, []);

  if (status === 'checking') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
      </div>
    );
  }

  if (status === 'denied') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
