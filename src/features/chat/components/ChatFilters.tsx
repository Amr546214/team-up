import type { ChatFilter } from '../types';
import { chatFilterLabels } from '../utils/chatHelpers';

interface ChatFiltersProps {
  activeFilter: ChatFilter;
  onFilterChange: (filter: ChatFilter) => void;
}

const filters: ChatFilter[] = [
  'all',
  'direct',
  'group',
  'unread',
];

export function ChatFilters({ activeFilter, onFilterChange }: ChatFiltersProps) {
  return (
    <div className="px-5 py-3 border-b border-gray-100">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {filters.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`
                shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium
                transition-all duration-200 whitespace-nowrap
                ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }
              `}
            >
              {chatFilterLabels[filter]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
