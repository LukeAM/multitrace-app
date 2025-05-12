'use client';
import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';

const COMMANDS = [
  {
    cmd: '/status-internal',
    desc: 'Summarize all files for the opportunity for an internal update (focus on risks, blockers, next steps).',
  },
  {
    cmd: '/status-external',
    desc: 'Summarize all files for the opportunity for a customer-facing update (focus on progress, value, next steps).',
  },
  { cmd: '/missing', desc: 'Analyze all files and list what\'s missing to close the deal.' },
  { cmd: '/next-steps', desc: 'Suggest next steps based on the current project files.' },
  { cmd: '/risks', desc: 'Identify risks and blockers from all project files.' },
  { cmd: '/timeline', desc: 'Generate a timeline of key events and milestones from the files.' },
  { cmd: '/action-items', desc: 'Extract all action items and owners from the files.' },
  { cmd: '/objections', desc: 'List all customer objections and proposed responses.' },
  { cmd: '/summary', desc: 'Give a high-level summary of the opportunity.' },
  { cmd: '/draft-email', desc: 'Draft a customer update email based on the latest project files.' },
  { cmd: '/draft-internal', desc: 'Draft an internal update email for the team.' },
  { cmd: '/deal-value', desc: 'Estimate the deal value and probability to close.' },
  { cmd: '/stakeholders', desc: 'List all stakeholders and their roles.' },
  { cmd: '/meeting-notes', desc: 'Summarize the last meeting notes.' },
  { cmd: '/prepare-call', desc: 'Prepare a call agenda based on recent activity.' },
  { cmd: '/competitors', desc: 'List any competitor mentions and analysis.' },
  { cmd: '/contract-status', desc: 'Summarize the contract/legal file status.' },
  { cmd: '/custom-questions', desc: 'Answer a custom question about the opportunity.' },
  { cmd: '/win-plan', desc: 'Generate a win plan for the deal.' },
  { cmd: '/customer-pain', desc: 'Summarize the customer\'s pain points and how your solution addresses them.' },
  { cmd: '/help', desc: 'Show all available commands.' },
];

export default function CLI() {
  const [cmd, setCmd] = useState('');
  const [output, setOutput] = useState<{ type: 'cmd' | 'out', text: string }[]>([]);
  const { projects } = useAppStore();
  const outputRef = useRef<HTMLDivElement>(null);

  async function handleCommand(command: string) {
    setOutput((prev) => [...prev, { type: 'cmd', text: command }]);
    if (command === '/help') {
      setOutput((prev) => [
        ...prev,
        { type: 'out', text: 'Available commands:' },
        ...COMMANDS.map((c): { type: 'cmd' | 'out', text: string } => ({ type: 'out', text: `  ${c.cmd.padEnd(18)} - ${c.desc}` })),
      ]);
      return;
    }
    if (command === '/status-internal') {
      // Gather all files for the first project
      const files = projects[0]?.files || [];
      const context = files.map(f => `## ${f.name}\n${f.content}`).join('\n\n');
      setOutput((prev) => [
        ...prev,
        { type: 'out', text: 'Running Copilot: Internal Status Summary...' },
      ]);
      try {
        const res = await fetch('/api/copilot', {
          method: 'POST',
          body: JSON.stringify({
            prompt: 'Summarize all aspects of this project for an internal update. Focus on risks, blockers, and next steps.',
            context,
          }),
        });
        const data = await res.text();
        setOutput((prev) => [
          ...prev,
          { type: 'out', text: `Copilot: ${data}` },
        ]);
      } catch (err) {
        setOutput((prev) => [
          ...prev,
          { type: 'out', text: 'Error running Copilot.' },
        ]);
      }
      return;
    }
    // Dummy output for all other commands
    const found = COMMANDS.find(c => c.cmd === command);
    if (found) {
      setOutput((prev) => [
        ...prev,
        { type: 'out', text: `Command '${command}': This is where the action will be.\n${found.desc}` },
      ]);
      return;
    }
    setOutput((prev) => [
      ...prev,
      { type: 'out', text: `Unknown command: ${command}` },
    ]);
  }

  // Scroll to bottom on new output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className="flex-shrink-0 border-t flex flex-col h-[180px] theme-monokai:bg-[#1e1f1c] theme-monokai:text-[#F8F8F2] theme-monokai:border-[#3e3d32] theme-greenonblack:bg-[#001100] theme-greenonblack:text-[#33FF33] theme-greenonblack:border-[#003300] dark:bg-gray-900 dark:text-white border-gray-200 dark:border-gray-700">
      <div
        ref={outputRef}
        className="flex-1 text-xs font-mono whitespace-pre-line overflow-auto px-1 pt-1 theme-monokai:text-[#F8F8F2] theme-greenonblack:text-[#33FF33] dark:text-white"
      >
        {output.map((line, i) => {
          if (line.type === 'cmd') {
            return (
              <div key={i} className="text-blue-600 dark:text-blue-400 theme-monokai:text-[#66D9EF] theme-greenonblack:text-[#33FF33] font-semibold">{'>'} {line.text}</div>
            );
          } else if (line.text.trim().startsWith('/')) {
            // Split command and description
            const match = line.text.match(/^(\/\S+)(\s*-\s*)?(.*)$/);
            if (match) {
              const [, cmd, sep = '', desc = ''] = match;
              return (
                <div key={i}>
                  <span className="text-blue-600 dark:text-blue-400 theme-monokai:text-[#66D9EF] theme-greenonblack:text-[#33FF33] font-semibold">{cmd}</span>
                  <span className="text-gray-700 dark:text-gray-200 theme-monokai:text-[#F8F8F2] theme-greenonblack:text-[#00FF00]">{sep}{desc}</span>
                </div>
              );
            }
          }
          return (
            <div key={i} className="text-gray-700 dark:text-gray-200 theme-monokai:text-[#F8F8F2] theme-greenonblack:text-[#00FF00]">{line.text}</div>
          );
        })}
      </div>
      <form
        onSubmit={async e => {
          e.preventDefault();
          const command = cmd.trim();
          setCmd('');
          if (command) await handleCommand(command);
        }}
        className="flex-shrink-0 border-t flex p-0 theme-monokai:border-[#3e3d32] theme-greenonblack:border-[#003300] dark:border-gray-700"
      >
        <span className="px-2 py-2 text-xs select-none theme-monokai:text-[#F92672] theme-greenonblack:text-[#33FF33] dark:text-gray-400">&gt;</span>
        <input
          type="text"
          value={cmd}
          onChange={e => setCmd(e.target.value)}
          placeholder="Command Line Interface. Type /help to start..."
          className="w-full px-1 py-1 text-xs bg-transparent outline-none theme-monokai:text-[#F8F8F2] theme-greenonblack:text-[#00FF00] dark:text-white placeholder-gray-500 dark:placeholder-gray-400 theme-monokai:placeholder-[#75715E] theme-greenonblack:placeholder-[#006600]"
          onKeyDown={e => {
            if (e.key === 'Tab') {
              e.preventDefault();
              const matches = COMMANDS.filter(c => c.cmd.startsWith(cmd));
              if (matches.length === 1) {
                setCmd(matches[0].cmd);
              }
            }
          }}
        />
      </form>
    </div>
  );
}
