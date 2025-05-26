import React from 'react';

const demoProject = {
  name: 'Demo Project',
  files: [
    {
      id: 'exec-summary',
      name: 'Executive Summary.md',
      type: 'markdown',
      content: 'Overview of deal, goals, and strategic narrative.',
    },
    {
      id: 'buying-committee',
      name: 'Buying Committee.json',
      type: 'json',
      content: `{
  "Champion": "Emily (Head of Data)",
  "Economic Buyer": "Jon (CFO)",
  "Security": "Ana (CISO)",
  "Procurement": "Sergio"
}`,
    },
    {
      id: 'objections',
      name: 'Common Objections.md',
      type: 'markdown',
      content: '- What if OpenAI changes pricing?\n- How do we keep data private?\n- Why not build it ourselves?',
    },
    {
      id: 'note-1',
      name: 'Note_250509_081501.md',
      type: 'markdown',
      content: 'Summarised demo feedback: Enthusiastic but concerned about latency under load.',
      section: 'Artifacts',
    },
    {
      id: 'note-2',
      name: 'Note_250509_102301.md',
      type: 'markdown',
      content: 'Copilot suggestion: Prioritise integration with Looker.',
      section: 'Artifacts',
    },
    {
      id: 'note-3',
      name: 'Note_250510_071800.md',
      type: 'markdown',
      content: "Drafted executive summary tailored to CFO's language.",
      section: 'Artifacts',
    },
    {
      id: 'legal-tos',
      name: 'Legal_Terms.md',
      type: 'markdown',
      content: 'Standard terms and conditions — 30-day payment, SLA, data protection terms included.',
      section: 'Legals',
    },
    {
      id: 'legal-msa',
      name: 'MSA.md',
      type: 'markdown',
      content: 'Draft MSA received from legal, highlights:\n- Liability cap: 2x\n- Data breach: 5 days notification',
      mandatory: true,
      section: 'Legals',
    },
    {
      id: 'legal-mnda',
      name: 'mNDA.md',
      type: 'markdown',
      content: 'Mutual NDA template. Use for all partners and vendors.',
      section: 'Legals',
    },
    {
      id: 'legal-dpa',
      name: 'DPA.md',
      type: 'markdown',
      content: 'Data Processing Agreement. Required for all data integrations.',
      section: 'Legals',
    },
    {
      id: 'legal-baa',
      name: 'BAA.md',
      type: 'markdown',
      content: 'Business Associate Agreement. Required for healthcare customers (HIPAA).',
      section: 'Legals',
    },
    {
      id: 'timeline-internal',
      name: 'Timeline_InternalPrep.md',
      type: 'markdown',
      content: 'Week 1: Define use case\nWeek 2: Demo + feedback\nWeek 3: Pilot config\nWeek 4: Legal review',
      section: 'Timeline',
    },
    {
      id: 'timeline-client-facing',
      name: 'Timeline_ExternalView.md',
      type: 'markdown',
      content: 'May 1: Pilot Start\nMay 15: Evaluation Call\nMay 22: Legal\nJune 1: Contract Target',
      section: 'Timeline',
    },
    {
      id: 'close-plan',
      name: 'Close Plan.md',
      type: 'markdown',
      content: '## Key Milestones\n- Kickoff\n- Security Review\n- Close',
    },
  ],
};

export default function LegacyDemoProject() {
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg mt-6">
      <h2 className="text-2xl font-bold mb-4">{demoProject.name}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {demoProject.files.map((file) => (
          <div key={file.id} className="border rounded p-4 bg-gray-50">
            <div className="font-semibold mb-2">{file.name}</div>
            <pre className="text-xs whitespace-pre-wrap text-gray-700 bg-gray-100 p-2 rounded">
              {file.content}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
} 