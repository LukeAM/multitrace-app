import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';

const sections = [
  { key: 'qualification', label: 'Qualification', sample: 'Qualified by sales team, budget approved.' },
  { key: 'stakeholders', label: 'Stakeholders', sample: 'Sarah Chen (CTO), Jon (CFO), Alex Rodriguez.' },
  { key: 'tech_stack', label: 'Legacy Stack', sample: 'Uses AWS, Looker, Salesforce.' },
  { key: 'activities', label: 'Activities', sample: 'Discovery call, demo, follow-up email.' },
  { key: 'sentiment', label: 'Sentiment', sample: 'Enthusiastic, but concerned about latency.' },
  { key: 'blockers', label: 'Blockers', sample: 'Security review pending, legal review required.' },
  { key: 'usage', label: 'Platform Usage', sample: '3 users in test environment, 120 API calls.' },
  { key: 'poc', label: 'Proof of Concept', sample: '2-week PoC, 3 models, integration with Looker.' },
  { key: 'agents', label: 'Agents', sample: 'Background check in progress for all agents.' },
];

const summarySamples = [
  'Baselinke summary of deal progress and key milestones.',
  'Mini-summaries 1: Stakeholder engagement, blockers, and next steps.',
  'Financial/Forecast: $250,000 target, Q2 close expected.'
];

export default function DealSummaryDashboard({ onSelect }: { onSelect: (section: string, type?: string) => void }) {
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const { projects } = useAppStore();
  const accountName = projects && projects.length > 0 ? projects[0].name : 'Account';
  useEffect(() => {
    // Open all cards by default
    setExpanded(Object.fromEntries(sections.map(s => [s.key, true])));
  }, []);
  const toggleExpand = (key: string) => setExpanded(e => ({ ...e, [key]: !e[key] }));

  // Split sections
  const topSections = sections.slice(0, 3); // Qualification, Stakeholders, Tech Stack
  const restSections = sections.slice(3);

  return (
    <div className="p-2 pt-0 pb-0">
      {/* Foundations vertical label and first row */}
      <div className="flex flex-row w-full max-w-5xl mb-8 gap-0 mt-0 items-start">
        {/* Foundations vertical label */}
        <div className="flex flex-col items-center justify-center mr-2">
          <div className="flex flex-col items-center">
            <span className="text-gray-400 font-bold tracking-widest text-xs" style={{ writingMode: 'vertical-lr', textOrientation: 'mixed', letterSpacing: '0.2em' }}>FOUNDATIONS</span>
            <div className="w-0.5 h-12 bg-gray-200" />
          </div>
        </div>
        {/* Top three cards row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {topSections.map(section => {
            const isExpanded = expanded[section.key];
            return (
              <div key={section.key} className="relative flex flex-col items-start overflow-visible h-full min-h-[30px]">
                {/* Shadow card */}
                <div className="absolute top-0 left-0 rounded-xl bg-blue-50/60 text-sm w-full h-full min-h-[30px] z-0 -translate-y-2 translate-x-2 border-t-2 border-r-2 border-blue-100" style={{position: 'absolute'}}>
                  <a href="#" className="absolute top-0 right-2 text-xs text-blue-900 rounded px-0 py-0 underline-offset-2 hover:underline cursor-pointer">history</a>
                </div>
                {/* Main card */}
                <div className="relative rounded-xl border border-gray-200 bg-white shadow hover:shadow-lg transition pt-3 pr-3 pl-3 pb-1 text-lg font-medium text-gray-900 flex flex-col items-start gap-1 min-h-[30px] z-10 w-full h-full">
                  {/* Expand/Contract button */}
                  <button onClick={() => toggleExpand(section.key)} className="absolute top-2 right-2 text-xs font-bold bg-white rounded-full w-6 h-6 flex items-center justify-center border border-gray-200 shadow-sm z-20">
                    {isExpanded ? '-' : '+'}
                  </button>
                  {/* Title */}
                  <div className={isExpanded ? "text-xl font-semibold mb-1" : "text-base font-semibold mb-1"}>{section.label}</div>
                  {/* Contracted view: only show a little of the sample text */}
                  {!isExpanded && (
                    <div className="text-xs text-gray-700 mb-1 truncate w-full" style={{maxWidth: '90%'}}>{section.sample.slice(0, 40)}...</div>
                  )}
                  {/* Expanded view: show full content */}
                  {isExpanded && <>
                    {/* Links below title */}
                    <div className="flex items-center gap-2 mb-1">
                      <button className="text-xs text-gray-400 font-semibold hover:underline focus:outline-none" onClick={() => onSelect(section.key, 'recent')}>Recent</button>
                      <button className="text-xs text-blue-600 font-semibold hover:underline focus:outline-none" onClick={() => onSelect(section.key, 'detail')}>Detail</button>
                      <button className="text-xs text-blue-600 font-semibold hover:underline focus:outline-none" onClick={() => onSelect(section.key, 'timeline')}>Timeline</button>
                    </div>
                    {/* Sample text */}
                    <div className="text-sm text-gray-700 mb-1">{section.sample}</div>
                    {/* Divider */}
                    <div className="w-full border-t border-gray-200 my-2" />
                    {/* Bottom right buttons */}
                    <div className="flex w-full justify-end gap-1 mt-0">
                      <button className="bg-gray-200 hover:bg-gray-300 text-xs text-gray-900 font-semibold rounded px-1.5 py-0.5 transition h-6" style={{minWidth: 0}} onClick={() => alert('Expand Data for ' + section.label)}>+Data</button>
                      <button className="bg-yellow-500 hover:bg-yellow-400 text-xs text-white font-semibold rounded px-1.5 py-0.5 transition h-6" style={{minWidth: 0}} onClick={() => alert('AI Suggestions for ' + section.label)}>AI Suggest</button>
                    </div>
                  </>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Status label and summary + next card grid as one group with a continuous line */}
      <div className="flex flex-row w-full max-w-5xl mt-0 mb-0 gap-0">
        {/* Status vertical label and continuous line */}
        <div className="flex flex-col items-center justify-center mr-2" style={{height: '100%'}}>
          <div className="flex flex-col items-center h-full">
            <span className="text-gray-400 font-bold tracking-widest text-xs mb-2" style={{ writingMode: 'vertical-lr', textOrientation: 'mixed', letterSpacing: '0.2em' }}>STATUS</span>
            <div className="w-0.5 flex-1 bg-gray-200" style={{minHeight: '400px', height: '100%'}} />
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-0">
          {/* Summary below top three cards */}
          <div className="w-full">
            <div className="relative">
              {/* Shadow card for summary, matches card shadow */}
              <div className="rounded-xl bg-blue-50/60 border-t-2 border-r-2 border-blue-100 w-full h-full z-0 -translate-y-2 translate-x-2" style={{position: 'absolute', top: 0, left: 0}}>
                <a href="#" className="absolute top-0 right-2 text-xs text-blue-900 rounded px-2 py-0.5 underline-offset-2 hover:underline cursor-pointer">history</a>
              </div>
              <div className="border-2 border-gray-200 rounded-xl bg-white p-6 text-gray-900 shadow flex flex-col items-start gap-1 relative z-10">
                {/* Title */}
                <div className="text-3xl font-bold mb-1">{accountName}</div>
                {/* Links below title */}
                <div className="flex items-center gap-2 mb-1">
                  <button className="text-xs text-gray-400 font-semibold hover:underline focus:outline-none" onClick={() => onSelect('summary', 'recent')}>Recent</button>
                  <button className="text-xs text-blue-600 font-semibold hover:underline focus:outline-none" onClick={() => onSelect('summary', 'detail')}>Detail</button>
                  <button className="text-xs text-blue-600 font-semibold hover:underline focus:outline-none" onClick={() => onSelect('summary', 'timeline')}>Timeline</button>
                </div>
                {/* Sample texts */}
                {summarySamples.map((sample, i) => (
                  <div key={i} className="text-sm text-gray-700 mb-1">{sample}</div>
                ))}
              </div>
            </div>
          </div>
          {/* Next card grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 w-full mt-8">
            {restSections.slice(0, 5).map(section => {
              const isExpanded = expanded[section.key];
              return (
                <div key={section.key} className="relative flex flex-col items-start overflow-visible h-full min-h-[60px]">
                  {/* Shadow card */}
                  <div className="absolute top-0 left-0 rounded-xl bg-blue-50/60 text-sm w-full h-full min-h-[60px] z-0 -translate-y-2 translate-x-2 border-t-2 border-r-2 border-blue-100" style={{position: 'absolute'}}>
                    <a href="#" className="absolute top-0 right-2 text-xs text-blue-900 rounded px-2 py-0.5 underline-offset-2 hover:underline cursor-pointer">history</a>
                  </div>
                  {/* Main card */}
                  <div className="relative rounded-xl border border-gray-200 bg-white shadow hover:shadow-lg transition pt-3 pr-3 pl-3 pb-1 text-lg font-medium text-gray-900 flex flex-col items-start gap-1 min-h-[60px] z-10 w-full h-full">
                    {/* Expand/Contract button */}
                    <button onClick={() => toggleExpand(section.key)} className="absolute top-2 right-2 text-xs font-bold bg-white rounded-full w-6 h-6 flex items-center justify-center border border-gray-200 shadow-sm z-20">
                      {isExpanded ? '-' : '+'}
                    </button>
                    {/* Title */}
                    <div className={isExpanded ? "text-xl font-semibold mb-1" : "text-base font-semibold mb-1"}>{section.label}</div>
                    {/* Contracted view: only show a little of the sample text */}
                    {!isExpanded && (
                      <div className="text-xs text-gray-700 mb-1 truncate w-full" style={{maxWidth: '90%'}}>{section.sample.slice(0, 40)}...</div>
                    )}
                    {/* Expanded view: show full content */}
                    {isExpanded && <>
                      {/* Links below title */}
                      <div className="flex items-center gap-2 mb-1">
                        <button className="text-xs text-gray-400 font-semibold hover:underline focus:outline-none" onClick={() => onSelect(section.key, 'recent')}>Recent</button>
                        <button className="text-xs text-blue-600 font-semibold hover:underline focus:outline-none" onClick={() => onSelect(section.key, 'detail')}>Detail</button>
                        <button className="text-xs text-blue-600 font-semibold hover:underline focus:outline-none" onClick={() => onSelect(section.key, 'timeline')}>Timeline</button>
                      </div>
                      {/* Sample text */}
                      <div className="text-sm text-gray-700 mb-1">{section.sample}</div>
                      {/* Divider */}
                      <div className="w-full border-t border-gray-200 my-2" />
                      {/* Bottom right buttons */}
                      <div className="flex w-full justify-end gap-1 mt-0">
                        <button className="bg-gray-200 hover:bg-gray-300 text-xs text-gray-900 font-semibold rounded px-1.5 py-0.5 transition h-6" style={{minWidth: 0}} onClick={() => alert('Expand Data for ' + section.label)}>+Data</button>
                        <button className="bg-yellow-500 hover:bg-yellow-400 text-xs text-white font-semibold rounded px-1.5 py-0.5 transition h-6" style={{minWidth: 0}} onClick={() => alert('AI Suggestions for ' + section.label)}>AI Suggest</button>
                      </div>
                    </>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Other label and last row */}
      <div className="flex flex-row w-full max-w-5xl mt-8 gap-0">
        <div className="flex flex-col items-center justify-center mr-2">
          <div className="flex flex-col items-center">
            <span className="text-gray-400 font-bold tracking-widest text-xs" style={{ writingMode: 'vertical-lr', textOrientation: 'mixed', letterSpacing: '0.2em' }}>AUTOMATION</span>
            <div className="w-0.5 h-12 bg-gray-200 mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
          {restSections.slice(5).map(section => {
            const isExpanded = expanded[section.key];
            return (
              <div key={section.key} className="relative flex flex-col items-start overflow-visible h-full min-h-[60px]">
                {/* Shadow card */}
                <div className="absolute top-0 left-0 rounded-xl bg-blue-50/60 text-sm w-full h-full min-h-[60px] z-0 -translate-y-2 translate-x-2 border-t-2 border-r-2 border-blue-100" style={{position: 'absolute'}}>
                  <a href="#" className="absolute top-0 right-2 text-xs text-blue-900 rounded px-2 py-0.5 underline-offset-2 hover:underline cursor-pointer">history</a>
                </div>
                {/* Main card */}
                <div className="relative rounded-xl border border-gray-200 bg-white shadow hover:shadow-lg transition pt-3 pr-3 pl-3 pb-1 text-lg font-medium text-gray-900 flex flex-col items-start gap-1 min-h-[60px] z-10 w-full h-full">
                  {/* Expand/Contract button */}
                  <button onClick={() => toggleExpand(section.key)} className="absolute top-2 right-2 text-xs font-bold bg-white rounded-full w-6 h-6 flex items-center justify-center border border-gray-200 shadow-sm z-20">
                    {isExpanded ? '-' : '+'}
                  </button>
                  {/* Title */}
                  <div className={isExpanded ? "text-xl font-semibold mb-1" : "text-base font-semibold mb-1"}>{section.label}</div>
                  {/* Contracted view: only show a little of the sample text */}
                  {!isExpanded && (
                    <div className="text-xs text-gray-700 mb-1 truncate w-full" style={{maxWidth: '90%'}}>{section.sample.slice(0, 40)}...</div>
                  )}
                  {/* Expanded view: show full content */}
                  {isExpanded && <>
                    {/* Links below title */}
                    <div className="flex items-center gap-2 mb-1">
                      <button className="text-xs text-gray-400 font-semibold hover:underline focus:outline-none" onClick={() => onSelect(section.key, 'recent')}>Recent</button>
                      <button className="text-xs text-blue-600 font-semibold hover:underline focus:outline-none" onClick={() => onSelect(section.key, 'detail')}>Detail</button>
                      <button className="text-xs text-blue-600 font-semibold hover:underline focus:outline-none" onClick={() => onSelect(section.key, 'timeline')}>Timeline</button>
                    </div>
                    {/* Sample text */}
                    <div className="text-sm text-gray-700 mb-1">{section.sample}</div>
                    {/* Divider */}
                    <div className="w-full border-t border-gray-200 my-2" />
                    {/* Bottom right buttons */}
                    <div className="flex w-full justify-end gap-1 mt-0">
                      <button className="bg-gray-200 hover:bg-gray-300 text-xs text-gray-900 font-semibold rounded px-1.5 py-0.5 transition h-6" style={{minWidth: 0}} onClick={() => alert('Expand Data for ' + section.label)}>+Data</button>
                      <button className="bg-yellow-500 hover:bg-yellow-400 text-xs text-white font-semibold rounded px-1.5 py-0.5 transition h-6" style={{minWidth: 0}} onClick={() => alert('AI Suggestions for ' + section.label)}>AI Suggest</button>
                    </div>
                  </>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 