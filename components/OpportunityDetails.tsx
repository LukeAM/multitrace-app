import React from 'react';

interface Opportunity {
  id: string;
  name: string;
  stage?: string;
  status?: string;
}

interface OpportunityDetailsProps {
  opportunity: Opportunity;
  onBack: () => void;
}

export default function OpportunityDetails({ opportunity, onBack }: OpportunityDetailsProps) {
  return (
    <div className="p-4">
      <button onClick={onBack} className="mb-4 text-blue-600 hover:underline">&larr; Back to Opportunities</button>
      <h2 className="text-lg font-bold mb-4">{opportunity.name}</h2>
      {opportunity.stage && <div className="mb-2">Stage: {opportunity.stage}</div>}
      {opportunity.status && <div className="mb-2">Status: {opportunity.status}</div>}
      {/* Add more details here as needed */}
    </div>
  );
} 