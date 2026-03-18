import React from 'react';
import { DEVISES, DeviseCode } from '../../services/deviseService';

interface DeviseSelectorProps {
  value: DeviseCode;
  onChange: (devise: DeviseCode) => void;
  disabled?: boolean;
  className?: string;
}

const DeviseSelector: React.FC<DeviseSelectorProps> = ({ value, onChange, disabled, className = '' }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as DeviseCode)}
      disabled={disabled}
      className={`rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${className}`}
    >
      {Object.values(DEVISES).map((devise) => (
        <option key={devise.code} value={devise.code}>
          {devise.code} ({devise.symbole})
        </option>
      ))}
    </select>
  );
};

export default DeviseSelector;
