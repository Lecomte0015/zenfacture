export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
}

export interface InvoiceData {
  id: string;
  user_id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  client_company?: string;
  client_address?: string;
  client_zip?: string;
  client_city?: string;
  client_country?: string;
  date: string;
  due_date: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  notes?: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  created_at: string;
  updated_at: string;
}
