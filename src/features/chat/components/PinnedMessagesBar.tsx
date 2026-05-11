import { useState, useCallback } from 'react';
import { Pin, X, FileText, Image, Music, File, ChevronDown, ChevronUp } from 'lucide-react';
import type { PinnedMessageWithData } from '../services/supabaseChatService';

interface PinnedMessagesBarProps {
  pinnedMessages: PinnedMessageWithData[];
  currentUserId: string;
  onUnpinMessage: (messageId: string) => void;
  onNavigateToMessage: (messageId: string) => void;
}

const MAX_PREVIEW_LENGTH = 60;

function getMessagePreview(message: PinnedMessageWithData['message'] | null | undefined): string {
  if (!message) {
    return '📎 Unknown message';
  }

  if (message.content) {
    return message.content.length > MAX_PREVIEW_LENGTH
      ? message.content.slice(0, MAX_PREVIEW_LENGTH) + '...'
      : message.content;
  }

  switch (message.type) {
    case 'image':
      return '📷 Image';
    case 'voice':
      return message.duration
        ? `🎤 Voice message (${Math.floor(message.duration)}s)`
        : '🎤 Voice message';
    case 'audio':
      return message.duration
        ? `🎵 Audio (${Math.floor(message.duration)}s)`
        : '🎵 Audio';
    case 'file':
      return message.fileName || '📎 File';
    default:
      return '📎 Attachment';
  }
}

function getMessageIcon(type: string) {
  switch (type) {
    case 'image':
      return <Image className="w-4 h-4" />;
    case 'voice':
      return <Music className="w-4 h-4" />;
    case 'audio':
      return <Music className="w-4 h-4" />;
    case 'file':
      return <FileText className="w-4 h-4" />;
    default:
      return <File className="w-4 h-4" />;
  }
}

export function PinnedMessagesBar({
  pinnedMessages,
  currentUserId,
  onUnpinMessage,
  onNavigateToMessage,
}: PinnedMessagesBarProps) {
  // Debug log
  console.log('[PinnedMessagesBar] rendered with', {
    pinnedMessagesCount: pinnedMessages?.length || 0,
    pinnedMessages: pinnedMessages?.map(p => ({ id: p.id, messageId: p.messageId, hasMessage: !!p.message })),
    currentUserId,
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleUnpin = useCallback(
    (e: React.MouseEvent, messageId: string) => {
      e.stopPropagation();
      console.log('[PinnedMessagesBar] unpin clicked', messageId);
      onUnpinMessage(messageId);
    },
    [onUnpinMessage]
  );

  const handleNavigate = useCallback(
    (messageId: string) => {
      console.log('[PinnedMessagesBar] navigate to message', messageId);
      onNavigateToMessage(messageId);
    },
    [onNavigateToMessage]
  );

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % pinnedMessages.length);
  }, [pinnedMessages.length]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + pinnedMessages.length) % pinnedMessages.length);
  }, [pinnedMessages.length]);

  if (!pinnedMessages || pinnedMessages.length === 0) {
    console.log('[PinnedMessagesBar] no pinned messages, returning null');
    return null;
  }

  const activePinned = pinnedMessages[activeIndex];
  const isMultiple = pinnedMessages.length > 1;

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <Pin className="w-4 h-4 text-amber-600 fill-amber-600" />
          <span className="text-sm font-medium text-amber-800">
            Pinned Message{isMultiple ? 's' : ''}
          </span>
          {isMultiple && (
            <span className="text-xs text-amber-600">
              {activeIndex + 1} of {pinnedMessages.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isMultiple && (
            <>
              <button
                onClick={handlePrev}
                className="p-1 hover:bg-amber-100 rounded transition-colors"
                title="Previous pinned message"
              >
                <ChevronUp className="w-4 h-4 text-amber-600" />
              </button>
              <button
                onClick={handleNext}
                className="p-1 hover:bg-amber-100 rounded transition-colors"
                title="Next pinned message"
              >
                <ChevronDown className="w-4 h-4 text-amber-600" />
              </button>
            </>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-amber-100 rounded transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-amber-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-amber-600" />
            )}
          </button>
        </div>
      </div>

      {/* Active Pinned Message Preview */}
      <div
        onClick={() => handleNavigate(activePinned.messageId)}
        className="px-4 pb-2 cursor-pointer hover:bg-amber-100/50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5 text-amber-600">
            {getMessageIcon(activePinned.message?.type || 'text')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-amber-900 truncate">
              {getMessagePreview(activePinned.message)}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Pinned by {activePinned.pinnedBy === currentUserId ? 'you' : 'someone'}
            </p>
          </div>
          <button
            onClick={(e) => handleUnpin(e, activePinned.messageId)}
            className="shrink-0 p-1 hover:bg-amber-200 rounded transition-colors"
            title="Unpin message"
          >
            <X className="w-4 h-4 text-amber-600" />
          </button>
        </div>
      </div>

      {/* Expanded List */}
      {isExpanded && isMultiple && (
        <div className="border-t border-amber-200">
          {pinnedMessages.map((pinned, index) => (
            <div
              key={pinned.id}
              onClick={() => {
                setActiveIndex(index);
                handleNavigate(pinned.messageId);
              }}
              className={`px-4 py-2 cursor-pointer hover:bg-amber-100/50 transition-colors ${
                index === activeIndex ? 'bg-amber-100' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5 text-amber-600">
                  {getMessageIcon(pinned.message?.type || 'text')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-amber-900 truncate">
                    {getMessagePreview(pinned.message)}
                  </p>
                </div>
                <button
                  onClick={(e) => handleUnpin(e, pinned.messageId)}
                  className="shrink-0 p-1 hover:bg-amber-200 rounded transition-colors"
                  title="Unpin message"
                >
                  <X className="w-4 h-4 text-amber-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
