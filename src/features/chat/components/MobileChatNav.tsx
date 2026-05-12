import { Home, MessageSquare, Users } from 'lucide-react';
import type { ChatUser } from '../types';

interface MobileChatNavProps {
  currentScreen: 'conversations' | 'chat' | 'users';
  onScreenChange: (screen: 'conversations' | 'chat' | 'users') => void;
  currentUser: ChatUser;
  totalUnreadCount: number;
  onBackHome: () => void;
}

export function MobileChatNav({
  currentScreen,
  onScreenChange,
  currentUser,
  totalUnreadCount,
  onBackHome,
}: MobileChatNavProps) {
  const getInitials = (name?: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200/70 px-4 py-2 z-50 safe-area-pb">
      <div className="flex items-center justify-around">
        {/* Home Button */}
        <button
          onClick={onBackHome}
          className="flex flex-col items-center gap-1 p-2 rounded-lg active:bg-gray-100 transition-colors"
          aria-label="Go home"
        >
          <Home className="w-5 h-5 text-gray-500" />
          <span className="text-[10px] text-gray-500">Home</span>
        </button>

        {/* Conversations Button */}
        <button
          onClick={() => onScreenChange('conversations')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors relative ${
            currentScreen === 'conversations'
              ? 'text-teal-600'
              : 'text-gray-500 active:bg-gray-100'
          }`}
          aria-label="Conversations"
        >
          <div className="relative">
            <MessageSquare className={`w-5 h-5 ${currentScreen === 'conversations' ? 'text-teal-600' : 'text-gray-500'}`} />
            {totalUnreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 bg-teal-600 text-white text-[9px] font-medium rounded-full flex items-center justify-center">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] ${currentScreen === 'conversations' ? 'text-teal-600' : 'text-gray-500'}`}>
            Chats
          </span>
        </button>

        {/* Users Button */}
        <button
          onClick={() => onScreenChange('users')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            currentScreen === 'users'
              ? 'text-teal-600'
              : 'text-gray-500 active:bg-gray-100'
          }`}
          aria-label="Users"
        >
          <Users className={`w-5 h-5 ${currentScreen === 'users' ? 'text-teal-600' : 'text-gray-500'}`} />
          <span className={`text-[10px] ${currentScreen === 'users' ? 'text-teal-600' : 'text-gray-500'}`}>
            Users
          </span>
        </button>

        {/* Current User Avatar */}
        <div className="flex flex-col items-center gap-1 p-2">
          <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name || 'User'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div
              className={`w-full h-full bg-teal-100 text-teal-700 flex items-center justify-center text-[10px] font-semibold ${
                currentUser.avatar ? 'hidden' : 'flex'
              }`}
            >
              {getInitials(currentUser.name)}
            </div>
          </div>
          <span className="text-[10px] text-gray-500">You</span>
        </div>
      </div>
    </div>
  );
}
