export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber?: string;
  client: string;
  clientAddress?: string;
  clientCity?: string;
  clientPostalCode?: string;
  clientCountry?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientVAT?: string;
  clientReference?: string;
  companyName: string;
  companyAddress?: string;
  companyCity?: string;
  companyPostalCode?: string;
  companyCountry?: string;
  companyVAT?: string;
  companyEmail?: string;
  companyPhone?: string;
  items: InvoiceItem[];
  subtotal?: number;
  taxAmount?: number;
  taxRate?: number;
  total: number;
  discount?: number;
  currency?: string;
  date: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'pending';
  notes?: string;
  terms?: string;
  paymentMethod?: string;
  paymentReference?: string;
  paymentTerms?: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}
