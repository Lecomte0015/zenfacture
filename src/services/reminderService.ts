import { Invoice } from '../types/invoice';

type ReminderType = 'warning' | 'success' | 'info' | 'error' | 'declaration' | 'contribution' | 'tax';

export interface Reminder {
  id: string;
  title: string;
  date: string;
  type: ReminderType;
  description: string;
  dueDate?: Date;
  category: 'invoice' | 'declaration' | 'contribution' | 'tax' | 'other';
  action?: () => void;
}

export const getReminders = (invoices: Invoice[] = []): Reminder[] => {
  const now = new Date();
  const reminders: Reminder[] = [];

  // Rappels de factures
  invoices.forEach(invoice => {
    if (!invoice.dueDate) return;
    
    const dueDate = new Date(invoice.dueDate);
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) {
      // Facture en retard
      reminders.push({
        id: `overdue-${invoice.id}`,
        title: 'Facture en retard',
        date: 'En retard',
        type: 'error',
        description: `La facture #${invoice.invoiceNumber || invoice.id} est en retard de ${Math.abs(daysUntilDue)} jour(s)`,
        dueDate,
        category: 'invoice',
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
        category: 'invoice',
      });
    }
  });

  // Rappels administratifs
  const adminReminders: Reminder[] = [
    {
      id: 'declaration-tva-1',
      title: 'Déclaration de TVA',
      date: 'Échéance: 10/09/2023',
      type: 'declaration',
      description: 'Déclaration de TVA trimestrielle à soumettre avant le 10/09/2023',
      dueDate: new Date('2023-09-10'),
      category: 'declaration',
    },
    {
      id: 'cotisation-rsa',
      title: 'Cotisation sociale',
      date: 'Échéance: 25/08/2023',
      type: 'contribution',
      description: 'Paiement de la cotisation sociale pour le 3ème trimestre 2023',
      dueDate: new Date('2023-08-25'),
      category: 'contribution',
    },
    {
      id: 'taxe-professionnelle',
      title: 'Taxe professionnelle',
      date: 'Échéance: 15/10/2023',
      type: 'tax',
      description: 'Paiement de la taxe professionnelle annuelle',
      dueDate: new Date('2023-10-15'),
      category: 'tax',
    },
  ];

  // Filtrer les rappels passés (optionnel, à adapter selon les besoins)
  const currentAdminReminders = adminReminders.filter(
    reminder => !reminder.dueDate || reminder.dueDate >= now
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
