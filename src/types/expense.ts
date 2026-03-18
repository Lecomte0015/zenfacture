export interface Expense {
  id?: string;
  user_id: string;
  organisation_id?: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected' | 'reimbursed';
  receipt_url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NewExpense {
  description: string;
  amount: string;
  category: string;
  date: string;
  status: string;
}
