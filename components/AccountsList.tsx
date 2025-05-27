import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@clerk/nextjs';
import LegacyDemoProject from './LegacyDemoProject';

interface Account {
  id: string;
  name: string;
  created_at?: string;
}

interface AccountsListProps {
  accounts: Account[];
  onSelect: (account: Account) => void;
  onAccountCreated?: () => void;
  sidebarStyle?: boolean;
  showDefault: boolean;
  setShowDefault: (show: boolean) => void;
}

function formatDate(dateString?: string) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const defaultProject = {
  name: 'Default Project',
  created_at: new Date().toISOString(),
};

export default function AccountsList({ accounts, onSelect, onAccountCreated, sidebarStyle, showDefault, setShowDefault }: AccountsListProps) {
  const [showForm, setShowForm] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoaded } = useUser();
  const [teams, setTeams] = useState<Array<{ team_id: string }>>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setTeams(data || []);
        if (data && data.length > 0) setActiveTeamId(data[0].team_id);
      });
  }, [user?.id]);

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!activeTeamId) {
      setError('No team selected.');
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert([{ name: accountName, team_id: activeTeamId }])
        .select();
      if (error) throw error;
      setAccountName('');
      setShowForm(false);
      if (onAccountCreated) onAccountCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 text-gray-900 p-0">
      <div className="m-3 flex-1 flex flex-col">
        <div className="bg-white rounded-lg shadow p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h2 className="text-lg font-bold">Accounts</h2>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                onClick={() => setShowForm((v) => !v)}
                disabled={!isLoaded || !activeTeamId}
                title={!isLoaded ? 'Loading user...' : !activeTeamId ? 'No team selected' : ''}
              >
                + Create Account
              </button>
              <button
                className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 text-sm"
                onClick={() => setShowDefault(!showDefault)}
              >
                Show Default Project
              </button>
            </div>
          </div>
          {showForm && (
            <form onSubmit={handleCreateAccount} className="mb-4 flex gap-2 items-center">
              <input
                type="text"
                value={accountName}
                onChange={e => setAccountName(e.target.value)}
                placeholder="Account name"
                className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                disabled={loading || !activeTeamId}
              />
              <button
                type="submit"
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                disabled={loading || !accountName.trim() || !activeTeamId}
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                className="px-2 py-1 text-gray-500 hover:text-gray-700 text-xs"
                onClick={() => setShowForm(false)}
                disabled={loading}
              >
                Cancel
              </button>
              {error && <span className="text-xs text-red-600 ml-2">{error}</span>}
            </form>
          )}
          <ul className="space-y-2 flex-1 overflow-y-auto">
            {accounts.map((account) => (
              <li
                key={account.id}
                className="p-3 bg-gray-50 rounded hover:bg-blue-100 cursor-pointer border border-gray-200 text-gray-900 shadow-sm transition-colors duration-150"
                onClick={() => onSelect(account)}
              >
                <div className="font-semibold text-gray-900">{account.name}</div>
                {account.created_at && (
                  <div className="text-xs text-gray-500 mt-1">
                    Created: {formatDate(account.created_at)}
                  </div>
                )}
              </li>
            ))}
          </ul>
          {showDefault && <LegacyDemoProject />}
        </div>
      </div>
    </div>
  );
}
