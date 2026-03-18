import React from 'react';
import { OcrScanner } from '@/components/ocr/OcrScanner';
import { useNavigate } from 'react-router-dom';

const OcrScanPage: React.FC = () => {
  const navigate = useNavigate();

  const handleExpenseCreated = () => {
    // Navigate to expenses page or dashboard after creating expense
    navigate('/dashboard/expenses');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <OcrScanner onExpenseCreated={handleExpenseCreated} />
    </div>
  );
};

export default OcrScanPage;
