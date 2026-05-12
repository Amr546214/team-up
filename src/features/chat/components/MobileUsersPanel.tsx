import { useState, useEffect } from 'react';
import { Search, ArrowLeft, X, MessageSquare } from 'lucide-react';
import { getAvailableProfiles } from '../services/profileService';
import type { Profile } from '../services/profileService';
import type { ChatUser } from '../types';

interface MobileUsersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ChatUser;
  onStartChat: (userId: string, name: string) => void;
  startingChatFor: string | null;
}

export function MobileUsersPanel({
  isOpen,
  onClose,
  currentUser,
  onStartChat,
  startingChatFor,
}: MobileUsersPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && searchQuery.length >= 3) {
      fetchProfiles();
    }
  }, [isOpen, searchQuery]);

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await getAvailableProfiles(currentUser.id);
    if (err) {
      setError(err);
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  const filteredProfiles = profiles.filter((profile) => {
    if (profile.id === currentUser.id) return false;
    const query = searchQuery.toLowerCase();
    const name = (profile.full_name || '').toLowerCase();
    const email = (profile.email || '').toLowerCase();
    const role = (profile.role || '').toLowerCase();
    return name.includes(query) || email.includes(query) || role.includes(query);
  });

  const getInitials = (name?: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadgeColor = (role?: string | null) => {
    switch (role) {
      case 'client':
        return 'bg-blue-100 text-blue-700';
      case 'developer':
        return 'bg-green-100 text-green-700';
      case 'company':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col md:hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
        <button
          onClick={onClose}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">Available Users</h2>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-10 pr-10 py-2.5 bg-gray-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>
        {searchQuery.length > 0 && searchQuery.length < 3 && (
          <p className="text-xs text-gray-400 mt-2">Type at least 3 characters to search</p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-8">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-teal-600 rounded-full animate-spin" />
            Loading users...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && searchQuery.length >= 3 && filteredProfiles.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">No users found</p>
        )}

        {!loading && !error && filteredProfiles.length > 0 && (
          <div className="space-y-3">
            {filteredProfiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
              >
                {/* Avatar */}
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'User'}
                    className="w-12 h-12 rounded-full object-cover shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div
                  className={`w-12 h-12 rounded-full bg-teal-100 text-teal-700 items-center justify-center text-sm font-semibold shrink-0 ${
                    profile.avatar_url ? 'hidden' : 'flex'
                  }`}
                >
                  {getInitials(profile.full_name)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">
                    {profile.full_name || 'Unnamed'}
                  </p>
                  {profile.email && (
                    <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                  )}
                  {profile.role && (
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-medium mt-1 ${getRoleBadgeColor(profile.role)}`}>
                      {profile.role}
                    </span>
                  )}
                </div>

                {/* Chat Button */}
                <button
                  onClick={() => onStartChat(profile.id, profile.full_name || 'User')}
                  disabled={startingChatFor === profile.id}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-wait transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  {startingChatFor === profile.id ? '...' : 'Chat'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
