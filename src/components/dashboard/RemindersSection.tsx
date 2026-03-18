import { useState, useEffect } from 'react';
import { 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiClock, 
  FiAlertCircle, 
  FiFileText, 
  FiDollarSign, 
  FiChevronRight,
  FiShield,
  FiPercent
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { Reminder, getReminders } from '@/services/reminderService';
import { Invoice } from '../../types/invoice';

const typeIcons = {
  warning: <FiAlertTriangle className="h-5 w-5 text-yellow-500" />,
  success: <FiCheckCircle className="h-5 w-5 text-green-500" />,
  info: <FiClock className="h-5 w-5 text-blue-500" />,
  error: <FiAlertCircle className="h-5 w-5 text-red-500" />,
  declaration: <FiFileText className="h-5 w-5 text-purple-500" />,
  contribution: <FiDollarSign className="h-5 w-5 text-indigo-500" />,
  tax: <FiPercent className="h-5 w-5 text-amber-500" />,
  insurance: <FiShield className="h-5 w-5 text-cyan-500" />
};

const typeColors = {
  warning: 'bg-yellow-50 text-yellow-700',
  success: 'bg-green-50 text-green-700',
  info: 'bg-blue-50 text-blue-700',
  error: 'bg-red-50 text-red-700',
  declaration: 'bg-purple-50 text-purple-700',
  contribution: 'bg-indigo-50 text-indigo-700',
  tax: 'bg-amber-50 text-amber-700',
  insurance: 'bg-cyan-50 text-cyan-700',
};

interface RemindersSectionProps {
  invoices?: Invoice[];
  maxItems?: number;
  showViewAll?: boolean;
}

const ReminderItem = ({ reminder, onClick }: { reminder: Reminder; onClick?: () => void }) => {
  const itemClass = `flex items-start p-4 rounded-lg hover:bg-gray-50 transition-colors ${onClick ? 'cursor-pointer' : ''}`;
  
  // Formater le montant si disponible
  const amountDisplay = reminder.amount ? ` • ${reminder.amount.toFixed(2)} CHF` : '';
  
  return (
    <div 
      className={itemClass} 
      onClick={onClick}
      title={onClick ? "Cliquez pour plus de détails" : ""}
    >
      <div className={`flex-shrink-0 p-2 rounded-md ${typeColors[reminder.type]}`}>
        {typeIcons[reminder.type]}
      </div>
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {reminder.title}
          </h3>
          <div className="flex items-center">
            {reminder.amount && (
              <span className="text-xs font-semibold text-gray-700 mr-2">
                {reminder.amount.toFixed(2)} CHF
              </span>
            )}
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {reminder.date}
            </span>
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          {reminder.description}
          {amountDisplay && (
            <span className="ml-1 text-xs font-medium text-gray-700">
              {amountDisplay}
            </span>
          )}
        </p>
      </div>
      {(onClick || reminder.url) && (
        <div className="ml-2 flex-shrink-0 flex items-center">
          <FiChevronRight className="h-5 w-5 text-gray-400" />
        </div>
      )}
    </div>
  );
};

const RemindersSection = ({ 
  invoices = [], 
  maxItems = 5,
  showViewAll = true 
}: RemindersSectionProps) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const allReminders = getReminders(invoices);
      setReminders(allReminders);
    } catch (error) {
      console.error('Erreur lors du chargement des rappels:', error);
    }
  }, [invoices]);

  const displayedReminders = maxItems ? reminders.slice(0, maxItems) : reminders;

  const handleViewAll = () => {
    // Rediriger vers le tableau de bord
    navigate('/dashboard');
    // Afficher un message dans la console pour indiquer que la fonctionnalité est en cours de développement
    console.log('Affichage de tous les rappels dans le tableau de bord');
  };

  const handleReminderClick = (reminder: Reminder) => {
    // Si une action est définie, on l'exécute (pour les liens externes)
    if (reminder.action) {
      reminder.action();
      return;
    }
    
    // Si une URL externe est définie, on l'ouvre dans un nouvel onglet
    if (reminder.url && (reminder.url.startsWith('http://') || reminder.url.startsWith('https://'))) {
      window.open(reminder.url, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // Pour les factures, on ouvre la modale d'édition si l'ID est disponible
    if (reminder.category === 'invoice' && reminder.id) {
      // Extraire l'ID de la facture à partir de l'ID du rappel
      const invoiceId = reminder.id.replace(/^(overdue-|due-soon-)/, '');
      // On pourrait ajouter une logique pour ouvrir la modale d'édition ici
      console.log('Ouvrir la facture:', invoiceId);
      // Pour l'instant, on se contente de changer d'onglet
      navigate('/dashboard');
      return;
    }
    
    // Pour les autres types de rappels, on change simplement d'onglet
    let targetTab = 'overview';
    
    switch (reminder.category) {
      case 'invoice':
        targetTab = 'invoices';
        break;
      case 'declaration':
      case 'tax':
        targetTab = 'reports';
        break;
      case 'contribution':
      case 'insurance':
        targetTab = 'expenses';
        break;
      default:
        targetTab = 'overview';
    }
    
    // On navigue vers le tableau de bord avec l'onglet approprié
    navigate('/dashboard');
    console.log(`Changement vers l'onglet: ${targetTab}`);
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Rappels et alertes</h3>
        {reminders.length > maxItems && showViewAll && (
          <button
            onClick={handleViewAll}
            className="text-sm font-medium text-primary-600 hover:text-primary-800"
          >
            Voir tout
          </button>
        )}
      </div>
      
      <div className="divide-y divide-gray-200">
        {displayedReminders.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {displayedReminders.map((reminder) => (
              <li key={reminder.id} className="hover:bg-gray-50">
                <ReminderItem 
                  reminder={reminder} 
                  onClick={() => handleReminderClick(reminder)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-500">Aucun rappel pour le moment</p>
          </div>
        )}
      </div>
      
      {showViewAll && displayedReminders.length > 0 && (
        <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
          <button
            type="button"
            onClick={handleViewAll}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-600 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Voir tous les rappels
          </button>
        </div>
      )}
    </div>
  );
};

export default RemindersSection;
