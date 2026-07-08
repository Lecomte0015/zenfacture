import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Link } from 'react-router-dom';
import { Bell, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { useRappels } from '@/hooks/useRappels';
import { useTrial } from '@/hooks/useTrial';
import { formatCurrency } from '@/utils/format';

interface FactureEnRetard {
  id: string;
  numero_facture?: string;
  client_nom?: string;
  montant_total?: number;
  date_echeance?: string;
}

const joursDeRetard = (dateEcheance?: string): number => {
  if (!dateEcheance) return 0;
  const diff = Date.now() - new Date(dateEcheance).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

export const NotificationsDropdown = () => {
  const { facturesEnRetard, loading } = useRappels();
  const { isOnTrial, daysRemaining } = useTrial();

  const trialAlert = isOnTrial && daysRemaining <= 5;
  const factures = (facturesEnRetard || []).slice(0, 5) as FactureEnRetard[];
  const totalCount = (facturesEnRetard?.length || 0) + (trialAlert ? 1 : 0);

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-300"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {totalCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-600" />
          </span>
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl bg-white shadow-card-hover border border-gray-100 focus:outline-none overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            {totalCount > 0 && (
              <span className="text-xs font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                {totalCount}
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-sm text-gray-400 text-center">Chargement…</div>
            ) : totalCount === 0 ? (
              <div className="px-4 py-8 flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">Tout est à jour, rien ne réclame votre attention pour le moment.</p>
              </div>
            ) : (
              <div className="py-1">
                {trialAlert && (
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/dashboard/billing"
                        className={`flex items-start gap-3 px-4 py-3 text-sm ${active ? 'bg-gray-50' : ''}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Clock className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-gray-900 font-medium">
                            {daysRemaining <= 0
                              ? "Votre période d'essai se termine aujourd'hui"
                              : `Votre période d'essai se termine dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`}
                          </p>
                          <p className="text-gray-500 text-xs mt-0.5">Choisissez un plan pour continuer sans interruption.</p>
                        </div>
                      </Link>
                    )}
                  </Menu.Item>
                )}

                {factures.map((facture) => {
                  const retard = joursDeRetard(facture.date_echeance);
                  return (
                    <Menu.Item key={facture.id}>
                      {({ active }) => (
                        <Link
                          to="/dashboard/invoices"
                          className={`flex items-start gap-3 px-4 py-3 text-sm ${active ? 'bg-gray-50' : ''}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-gray-900 font-medium truncate">
                              {facture.numero_facture || 'Facture'} {facture.client_nom ? `— ${facture.client_nom}` : ''}
                            </p>
                            <p className="text-gray-500 text-xs mt-0.5">
                              En retard de {retard} jour{retard > 1 ? 's' : ''}
                              {facture.montant_total ? ` · ${formatCurrency(facture.montant_total)}` : ''}
                            </p>
                          </div>
                        </Link>
                      )}
                    </Menu.Item>
                  );
                })}
              </div>
            )}
          </div>

          {(facturesEnRetard?.length || 0) > 0 && (
            <div className="border-t border-gray-100 px-4 py-2">
              <Link to="/dashboard/invoices" className="text-xs font-medium text-primary-700 hover:text-primary-800">
                Voir toutes les factures en retard
              </Link>
            </div>
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default NotificationsDropdown;
