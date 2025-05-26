import React from 'react';

interface Opportunity {
  id: string;
  name: string;
  stage?: string;
}
interface Account {
  id: string;
  name: string;
}

interface OpportunitiesListProps {
  account: Account;
  opportunities: Opportunity[];
  onSelect: (opportunity: Opportunity) => void;
  onBack: () => void;
}

export default function OpportunitiesList({ account, opportunities, onSelect, onBack }: OpportunitiesListProps) {
  return (
    <div className="p-4">
      <button onClick={onBack} className="mb-4 text-blue-600 hover:underline">&larr; Back to Accounts</button>
      <h2 className="text-lg font-bold mb-4">Opportunities for {account.name}</h2>
      <ul className="space-y-2">
        {opportunities.map((op) => (
          <li
            key={op.id}
            className="p-3 bg-white dark:bg-gray-800 rounded shadow hover:bg-blue-50 dark:hover:bg-blue-900 cursor-pointer border border-gray-200 dark:border-gray-700"
            onClick={() => onSelect(op)}
          >
            <div className="font-semibold text-gray-900 dark:text-gray-100">{op.name}</div>
            {op.stage && <div className="text-xs text-gray-500 dark:text-gray-400">Stage: {op.stage}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
} 