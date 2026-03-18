import { Invoice } from '../types/invoice';

type ReminderType = 'warning' | 'success' | 'info' | 'error' | 'declaration' | 'contribution' | 'tax' | 'insurance';

export interface Reminder {
  id: string;
  title: string;
  date: string;
  type: ReminderType;
  description: string;
  dueDate?: Date;
  amount?: number;
  category: 'invoice' | 'declaration' | 'contribution' | 'tax' | 'insurance' | 'other';
  action?: () => void;
  url?: string;
}

// Fonction pour calculer la date d'échéance de la TVA (fin de mois + 60 jours)
const getTvaDueDate = (invoiceDate: Date): Date => {
  const dueDate = new Date(invoiceDate);
  dueDate.setMonth(dueDate.getMonth() + 2); // 2 mois plus tard
  dueDate.setDate(0); // Dernier jour du mois précédent
  dueDate.setDate(dueDate.getDate() + 10); // + 10 jours pour la date limite
  return dueDate;
};

export const getReminders = (invoices: Invoice[] = []): Reminder[] => {
  const now = new Date();
  const reminders: Reminder[] = [];
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const nextMonth = new Date(currentYear, currentMonth + 1, 1);

  // Rappels de factures
  invoices.forEach(invoice => {
    if (!invoice.dueDate) return;
    
    const dueDate = new Date(invoice.dueDate);
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Rappel pour facture
    if (daysUntilDue < 0) {
      // Facture en retard
      reminders.push({
        id: `overdue-${invoice.id}`,
        title: 'Facture en retard',
        date: 'En retard',
        type: 'error',
        description: `La facture #${invoice.invoiceNumber || invoice.id} est en retard de ${Math.abs(daysUntilDue)} jour(s)`,
        dueDate,
        amount: invoice.total,
        category: 'invoice',
        url: `/invoices/${invoice.id}`
      });
    } else if (daysUntilDue <= 7) {
      // Facture à échéance proche
      reminders.push({
        id: `due-soon-${invoice.id}`,
        title: 'Échéance proche',
        date: `Échéance dans ${daysUntilDue} jour(s)`,
        type: 'warning',
        description: `La facture #${invoice.invoiceNumber || invoice.id} arrive à échéance le ${dueDate.toLocaleDateString('fr-FR')}`,
        dueDate,
        amount: invoice.total,
        category: 'invoice',
        url: `/invoices/${invoice.id}`
      });
    }

    // Rappel pour TVA si la facture est payée
    if (invoice.status === 'paid' && invoice.taxAmount && invoice.taxAmount > 0) {
      const tvaDueDate = getTvaDueDate(new Date(invoice.date));
      const daysUntilTvaDue = Math.ceil((tvaDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilTvaDue <= 30) {
        reminders.push({
          id: `tva-${invoice.id}`,
          title: 'TVA à déclarer',
          date: `Échéance: ${tvaDueDate.toLocaleDateString('fr-FR')}`,
          type: 'declaration',
          description: `TVA de ${invoice.taxAmount.toFixed(2)} CHF pour la facture #${invoice.invoiceNumber || invoice.id}`,
          dueDate: tvaDueDate,
          amount: invoice.taxAmount,
          category: 'tax',
          url: 'https://www.estv.admin.ch/estv/fr/home/mehrwertsteuer.html',
          action: () => window.open('https://www.estv.admin.ch/estv/fr/home/mehrwertsteuer.html', '_blank')
        });
      }
    }
  });

  // Rappels administratifs récurrents
  const adminReminders: Reminder[] = [
    // TVA trimestrielle (si pas déjà couvert par les factures)
    {
      id: 'declaration-tva-trimestrielle',
      title: 'Déclaration de TVA trimestrielle',
      date: `Échéance: ${new Date(currentYear, nextMonth.getMonth(), 10).toLocaleDateString('fr-FR')}`,
      type: 'declaration',
      description: 'Déclaration de TVA à soumettre avant la date limite',
      dueDate: new Date(currentYear, nextMonth.getMonth(), 10),
      category: 'tax',
      url: 'https://www.estv.admin.ch/estv/fr/home/mehrwertsteuer.html',
      action: () => window.open('https://www.estv.admin.ch/estv/fr/home/mehrwertsteuer.html', '_blank')
    },
    // Cotisations sociales (mensuelles)
    {
      id: `cotisation-avs-${currentYear}-${currentMonth + 1}`,
      title: 'Cotisation AVS/AI/APG',
      date: `Échéance: ${new Date(currentYear, currentMonth, 25).toLocaleDateString('fr-FR')}`,
      type: 'contribution',
      description: 'Paiement des cotisations sociales du mois en cours',
      dueDate: new Date(currentYear, currentMonth, 25),
      category: 'contribution',
      url: 'https://www.ahv-iv.ch/fr',
      action: () => window.open('https://www.ahv-iv.ch/fr', '_blank')
    },
    // Assurance maladie (trimestrielle)
    {
      id: `assurance-maladie-${currentYear}-Q${Math.floor(currentMonth / 3) + 1}`,
      title: 'Prime assurance maladie',
      date: `Échéance: ${new Date(currentYear, currentMonth + 2, 1).toLocaleDateString('fr-FR')}`,
      type: 'insurance',
      description: 'Paiement de la prime trimestrielle',
      dueDate: new Date(currentYear, currentMonth + 2, 1),
      category: 'insurance',
      url: 'https://www.bag.admin.ch/bag/fr/home/versicherungen/krankenversicherung.html',
      action: () => window.open('https://www.bag.admin.ch/bag/fr/home/versicherungen/krankenversicherung.html', '_blank')
    },
    // Taxe professionnelle annuelle (mars)
    {
      id: `taxe-pro-${currentYear}`,
      title: 'Taxe professionnelle',
      date: `Échéance: ${new Date(currentYear, 2, 31).toLocaleDateString('fr-FR')}`,
      type: 'tax',
      description: 'Paiement de la taxe professionnelle annuelle',
      dueDate: new Date(currentYear, 2, 31), // 31 mars
      category: 'tax',
      url: 'https://www.estv.admin.ch/estv/fr/home/direkte-bundessteuer.html',
      action: () => window.open('https://www.estv.admin.ch/estv/fr/home/direkte-bundessteuer.html', '_blank')
    }
  ];

  // Filtrer les rappels passés
  const currentAdminReminders = adminReminders.filter(
    reminder => !reminder.dueDate || (reminder.dueDate >= now && reminder.dueDate < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000))
  );

  // Trier par date d'échéance (les plus urgents en premier)
  return [...reminders, ...currentAdminReminders].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });
};

export const getRemindersByCategory = (reminders: Reminder[], category: string) => {
  return reminders.filter(reminder => reminder.category === category);
};
