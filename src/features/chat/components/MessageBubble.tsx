import { useState, useRef, useEffect } from 'react';
import type { Message, ChatUser } from '../types';
import { formatMessageTime } from '../utils/dateFormat';
import { formatFileSize } from '../utils/fileFormat';
import {
  File,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  FileArchive,
  MoreHorizontal,
  Star,
  Trash2,
  Flag,
  Trash,
  Play,
  Pin,
} from 'lucide-react';
import { VoiceMessageBubble } from './VoiceMessageBubble';
import { VideoPreviewModal } from './VideoPreviewModal';
import Avatar from '../../../components/common/Avatar';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  sender?: ChatUser;
  onImageClick?: () => void;
  onToggleStar?: (messageId: string, isStarred: boolean) => void;
  onHideForMe?: (messageId: string) => void;
  onReport?: (messageId: string) => void;
  onDeleteForEveryone?: (messageId: string) => Promise<void>;
  onPinMessage?: (messageId: string) => void;
  isPinned?: boolean;
  isHighlighted?: boolean;
  // Ref for scrolling to message
  messageRef?: (el: HTMLDivElement | null) => void;
  // Audio coordination props
  activeAudioId?: string | null;
  setActiveAudioId?: (id: string | null) => void;
  registerAudioRef?: (audioId: string, audioElement: HTMLAudioElement | null) => void;
  stopOtherAudios?: (audioId: string) => void;
}

export function MessageBubble({
  message,
  isCurrentUser,
  sender,
  onImageClick,
  onToggleStar,
  onHideForMe,
  onReport,
  onDeleteForEveryone,
  onPinMessage,
  isPinned = false,
  isHighlighted = false,
  messageRef,
  activeAudioId,
  setActiveAudioId,
  registerAudioRef,
  stopOtherAudios,
}: MessageBubbleProps) {
  // Debug log for pin troubleshooting
  console.log('[Pin Debug] MessageBubble props', {
    messageId: message?.id,
    isPinned,
    hasOnPinMessage: typeof onPinMessage === 'function',
    hasOnUnpinMessage: typeof onPinMessage === 'function', // using onPinMessage for both pin/unpin
  });

  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [deleteForEveryoneConfirm, setDeleteForEveryoneConfirm] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Resolve sender display info: prefer senderProfile from message, fall back to sender prop
  const senderAvatarUrl = !avatarError
    ? (message.senderProfile?.avatarUrl || sender?.avatar || null)
    : null;
  const senderDisplayName =
    message.senderProfile?.name || sender?.name || 'Unknown';

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // True if this message has been soft-deleted for everyone
  const isDeletedForEveryone =
    !!message.deletedAt && message.deleteScope === 'everyone';

  const handleStar = () => {
    if (isDeletedForEveryone) {
      console.warn('[Message Actions] blocked action on deleted message', { messageId: message.id, action: 'star' });
      return;
    }
    console.log('[Star Debug] message', message.id, 'isStarred', message.isStarred);
    onToggleStar?.(message.id, !message.isStarred);
    setMenuOpen(false);
  };

  const handlePin = () => {
    console.log('[Pin Debug] handlePin CALLED', {
      messageId: message?.id,
      isPinned,
      isDeletedForEveryone,
    });

    if (isDeletedForEveryone) {
      console.warn('[Message Actions] blocked action on deleted message', { messageId: message.id, action: 'pin' });
      return;
    }

    if (!message?.id) {
      console.warn('[Pin Debug] cannot pin because message.id is missing', message);
      return;
    }

    console.log('[Pin Debug] calling onPinMessage with', message.id);
    onPinMessage?.(message.id);
    setMenuOpen(false);
  };

  const handleHide = () => {
    onHideForMe?.(message.id);
    setMenuOpen(false);
  };

  const handleReport = () => {
    if (isDeletedForEveryone) {
      console.warn('[Message Actions] blocked action on deleted message', { messageId: message.id, action: 'report' });
      return;
    }
    if (isCurrentUser) {
      console.warn('[Report Message] blocked reporting own message', message.id);
      return;
    }
    if (message.reportedAt) {
      console.warn('[Message Actions] already reported', { messageId: message.id });
      return;
    }
    console.log('[Report Message] opening modal', message.id);
    onReport?.(message.id);
    setMenuOpen(false);
  };

  const handleDeleteForEveryone = () => {
    console.log('[DeleteEveryone UI Debug]', {
      messageId: message.id,
      messageSenderId: message.senderId,
      messageSender_id: (message as any).sender_id,
      senderPropId: sender?.id,
      isCurrentUser,
    });
    console.log('[DeleteEveryone Click Debug]', {
      messageId: message.id,
      messageSenderId: message.senderId,
      fullMessage: message,
    });
    setMenuOpen(false);
    setDeleteForEveryoneConfirm(true);
  };

  const confirmDeleteForEveryone = () => {
    setDeleteForEveryoneConfirm(false);
    onDeleteForEveryone?.(message.id);
  };

  const renderMessageContent = () => {
    if (isDeletedForEveryone) {
      return (
        <p className="text-sm italic text-gray-400">This message was deleted</p>
      );
    }
    switch (message.type) {
      case 'image':
        return (
          <div className="space-y-2">
            {message.mediaUrl ? (
              <button
                onClick={onImageClick}
                className="block p-0 m-0 border-0 bg-transparent cursor-pointer group"
                aria-label="View image preview"
              >
                <img
                  src={message.mediaUrl}
                  alt={message.fileName || 'Image'}
                  className="max-w-[280px] w-full rounded-lg object-cover transition-transform group-hover:scale-[1.02] group-hover:brightness-105"
                />
              </button>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <ImageIcon className="w-5 h-5" />
                <span>Image unavailable</span>
              </div>
            )}
            {message.fileName && (
              <p className="text-xs opacity-75">{message.fileName}</p>
            )}
          </div>
        );

      case 'file': {
        const hasMedia = !!message.mediaUrl;

        // Helper to check if file is a video
        const isVideoFile = () => {
          const fileType = message.fileType || '';
          const fileName = message.fileName || '';
          const extension = fileName.split('.').pop()?.toLowerCase();
          return fileType.startsWith('video/') || ['mp4', 'mov', 'webm', 'mkv'].includes(extension || '');
        };

        const isVideo = isVideoFile();

        // Helper to get file icon based on type
        const getFileIcon = () => {
          const fileType = message.fileType || '';
          const fileName = message.fileName || '';
          const extension = fileName.split('.').pop()?.toLowerCase();

          // Video files
          if (fileType.startsWith('video/') || ['mp4', 'mov', 'webm', 'mkv', 'avi', 'flv', 'wmv'].includes(extension || '')) {
            return <Video className="w-5 h-5" />;
          }

          // Audio files
          if (fileType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma'].includes(extension || '')) {
            return <Music className="w-5 h-5" />;
          }

          // Image files
          if (fileType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico'].includes(extension || '')) {
            return <ImageIcon className="w-5 h-5" />;
          }

          // PDF files
          if (fileType === 'application/pdf' || extension === 'pdf') {
            return <FileText className="w-5 h-5" />;
          }

          // Archive files
          if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension || '')) {
            return <FileArchive className="w-5 h-5" />;
          }

          // Default fallback
          return <File className="w-5 h-5" />;
        };

        const handleFileClick = () => {
          if (!hasMedia) return;
          if (isVideo) {
            // Open video preview modal for video files
            setVideoModalOpen(true);
          } else {
            // Open in new tab for non-video files
            window.open(message.mediaUrl, '_blank', 'noopener,noreferrer');
          }
        };

        const handleFileKeyDown = (e: React.KeyboardEvent) => {
          if (!hasMedia) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (isVideo) {
              setVideoModalOpen(true);
            } else {
              window.open(message.mediaUrl, '_blank', 'noopener,noreferrer');
            }
          }
        };

        const handleOpenInNewTab = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (hasMedia) {
            window.open(message.mediaUrl, '_blank', 'noopener,noreferrer');
          }
        };

        return (
          <>
            <div
              className={`flex items-center gap-3 min-w-[200px] rounded-lg transition-all ${
                hasMedia
                  ? `cursor-pointer ${
                      isCurrentUser
                        ? 'hover:bg-teal-700/50 hover:shadow-sm'
                        : 'hover:bg-gray-200/70 hover:shadow-sm'
                    }`
                  : 'cursor-default opacity-70'
              }`}
              onClick={handleFileClick}
              onKeyDown={handleFileKeyDown}
              role={hasMedia ? 'button' : undefined}
              tabIndex={hasMedia ? 0 : undefined}
              aria-label={hasMedia ? `Open ${isVideo ? 'video preview' : 'file'} ${message.fileName || 'File'}` : 'File unavailable'}
            >
              <div className={`p-2 rounded-lg ${isCurrentUser ? 'bg-teal-700' : 'bg-gray-200'} relative`}>
                {getFileIcon()}
                {isVideo && hasMedia && (
                  <div className={`absolute inset-0 flex items-center justify-center rounded-lg ${isCurrentUser ? 'bg-teal-700/80' : 'bg-gray-200/80'}`}>
                    <Play className="w-3 h-3 fill-current" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {message.fileName || 'File'}
                  {!hasMedia && <span className="text-xs opacity-60 ml-2">(unavailable)</span>}
                </p>
                {message.fileSize && hasMedia && (
                  <p className="text-xs opacity-75">{formatFileSize(message.fileSize)}</p>
                )}
              </div>
              {hasMedia && (
                <div
                  className={`p-2 rounded-full transition-colors ${
                    isCurrentUser
                      ? 'hover:bg-teal-700 text-teal-100'
                      : 'hover:bg-gray-200 text-gray-600'
                  }`}
                  title="Open in new tab"
                  onClick={handleOpenInNewTab}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              )}
            </div>

            {/* Video Preview Modal */}
            {isVideo && videoModalOpen && message.mediaUrl && (
              <VideoPreviewModal
                videoUrl={message.mediaUrl}
                fileName={message.fileName}
                onClose={() => setVideoModalOpen(false)}
              />
            )}
          </>
        );
      }

      case 'voice':
        console.log('[MessageBubble] voice message', { id: message.id, mediaUrl: message.mediaUrl, type: message.type });
        return (
          <VoiceMessageBubble
            mediaUrl={message.mediaUrl || ''}
            duration={message.duration}
            isOwnMessage={isCurrentUser}
            variant="voice"
            messageId={message.id}
            activeAudioId={activeAudioId || null}
            setActiveAudioId={setActiveAudioId || (() => {})}
            registerAudioRef={registerAudioRef || (() => {})}
            stopOtherAudios={stopOtherAudios || (() => {})}
            message={message}
          />
        );

      case 'audio':
        console.log('[MessageBubble] audio message', { id: message.id, mediaUrl: message.mediaUrl, type: message.type });
        return (
          <VoiceMessageBubble
            mediaUrl={message.mediaUrl || ''}
            duration={message.duration}
            isOwnMessage={isCurrentUser}
            fileName={message.fileName}
            variant="audio"
            messageId={message.id}
            activeAudioId={activeAudioId || null}
            setActiveAudioId={setActiveAudioId || (() => {})}
            registerAudioRef={registerAudioRef || (() => {})}
            stopOtherAudios={stopOtherAudios || (() => {})}
            message={message}
          />
        );

      case 'text':
      default:
        return (
          <p className="text-[15px] leading-snug whitespace-pre-wrap">{message.content}</p>
        );
    }
  };

  return (
    <div
      id={`message-${message.id}`}
      ref={messageRef}
      data-message-id={message.id}
      className={`group flex w-full items-start gap-2 ${
        isCurrentUser ? 'justify-end' : 'justify-start'
      } ${isHighlighted ? 'animate-message-highlight' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >

      {/* Avatar for incoming messages (left side) */}
      {!isCurrentUser && (
        <div className="shrink-0 mt-1">
          <Avatar
            user={null}
            src={senderAvatarUrl}
            alt={senderDisplayName}
            size="sm"
            className="w-7 h-7"
            fallbackClassName="bg-gray-200 text-gray-600 text-xs"
          />
        </div>
      )}

      {/* Outgoing: Actions + Bubble */}
      {/* Incoming: Bubble + Actions */}
      {isCurrentUser ? (
        <>
          {/* Actions - left of bubble for outgoing */}
          <div className="relative shrink-0 flex items-center self-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`p-1.5 rounded-full transition-all duration-150 text-teal-600 hover:bg-teal-50 ${
                isHovered || menuOpen ? 'opacity-100' : 'opacity-0'
              }`}
              title="Message actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* Dropdown - opens to the LEFT of button */}
            {menuOpen && (
              <div
                ref={menuRef}
                className="absolute right-full top-0 mr-2 w-44 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50"
              >
                {!isDeletedForEveryone && (
                  <>
                    <button
                      onClick={handlePin}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Pin className={`w-4 h-4 ${isPinned ? 'fill-amber-600 text-amber-600' : ''}`} />
                      {isPinned ? 'Unpin message' : 'Pin message'}
                    </button>
                    <button
                      onClick={handleStar}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Star className={`w-4 h-4 ${message.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                      {message.isStarred ? 'Unstar message' : 'Star message'}
                    </button>
                  </>
                )}
                <button
                  onClick={handleHide}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  Delete for me
                </button>
                {!isDeletedForEveryone && (
                  <button
                    onClick={handleDeleteForEveryone}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash className="w-4 h-4" />
                    Delete for everyone
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bubble */}
          <div
            className="relative max-w-[65%] px-4 py-2.5 rounded-2xl shadow-sm bg-teal-600 text-white rounded-br-md"
            style={isHighlighted ? { animation: 'messagePop 1.2s ease-in-out 1' } : undefined}
          >
            {!isDeletedForEveryone && message.isStarred && (
              <div className="absolute -top-1 -left-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              </div>
            )}
            {!isDeletedForEveryone && message.reportedAt && (
              <div className="absolute -bottom-1 -left-1">
                <Flag className="w-3 h-3 text-orange-500" />
              </div>
            )}
            {renderMessageContent()}
            <div className="flex items-center justify-end gap-1.5 mt-1 text-teal-200">
              <span className="text-[11px]">{formatMessageTime(message.timestamp)}</span>
              {/* Read receipts: show check marks only for current user's messages */}
              {isCurrentUser && (
                <span
                  className="text-[11px] opacity-80"
                  title={message.readAt ? 'Seen' : 'Sent'}
                >
                  {message.readAt ? (
                    <span className="text-teal-200">✓✓</span>  // Two checks = read
                  ) : (
                    <span>✓</span>  // One check = sent but not read
                  )}
                </span>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Bubble */}
          <div
            className="relative max-w-[65%] px-4 py-2.5 rounded-2xl shadow-sm bg-white text-gray-800 border border-gray-100 rounded-bl-md"
            style={isHighlighted ? { animation: 'messagePop 1.2s ease-in-out 1' } : undefined}
          >
            {!isDeletedForEveryone && message.isStarred && (
              <div className="absolute -top-1 -right-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              </div>
            )}
            {!isDeletedForEveryone && message.reportedAt && (
              <div className="absolute -bottom-1 -right-1">
                <Flag className="w-3 h-3 text-orange-500" />
              </div>
            )}
            {renderMessageContent()}
            <div className="flex items-center justify-end gap-1.5 mt-1 text-gray-400">
              <span className="text-[11px]">{formatMessageTime(message.timestamp)}</span>
            </div>
          </div>

          {/* Actions - right of bubble for incoming */}
          <div className="relative shrink-0 flex items-center self-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`p-1.5 rounded-full transition-all duration-150 text-gray-400 hover:bg-gray-100 ${
                isHovered || menuOpen ? 'opacity-100' : 'opacity-0'
              }`}
              title="Message actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* Dropdown - opens to the LEFT of button (towards center) */}
            {menuOpen && (
              <div
                ref={menuRef}
                className="absolute right-full top-0 mr-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50"
              >
                {!isDeletedForEveryone && (
                  <>
                    <button
                      onClick={handlePin}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Pin className={`w-4 h-4 ${isPinned ? 'fill-amber-600 text-amber-600' : ''}`} />
                      {isPinned ? 'Unpin message' : 'Pin message'}
                    </button>
                    <button
                      onClick={handleStar}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Star className={`w-4 h-4 ${message.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                      {message.isStarred ? 'Unstar message' : 'Star message'}
                    </button>
                  </>
                )}
                <button
                  onClick={handleHide}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  Delete for me
                </button>
                {!isDeletedForEveryone && (
                  message.reportedAt ? (
                    <span className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 cursor-default">
                      <Flag className="w-4 h-4" />
                      Reported
                    </span>
                  ) : (
                    <button
                      onClick={handleReport}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Flag className="w-4 h-4 text-orange-500" />
                      Report message
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </>
      )}
      {/* Delete for everyone confirmation modal */}
      {deleteForEveryoneConfirm && (
        <div className="fixed inset-0 z-100 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteForEveryoneConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete message for everyone?</h3>
            <p className="text-sm text-gray-500 mb-5">
              This will remove the message from the chat for all participants, but it will remain stored for moderation.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteForEveryoneConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteForEveryone}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Delete for everyone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom animation for highlighted message (scale up/down pulse)
const style = document.createElement('style');
style.textContent = `
  @keyframes message-highlight {
    0%, 100% {
      transform: scale(1);
    }
    25% {
      transform: scale(1.02);
    }
    50% {
      transform: scale(1.05);
    }
    75% {
      transform: scale(1.02);
    }
  }
  
  .animate-message-highlight {
    animation: message-highlight 2s ease-in-out;
    z-index: 10;
  }
`;
document.head.appendChild(style);
