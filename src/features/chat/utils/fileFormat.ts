/**
 * Format file size in human-readable format
 * @param bytes - file size in bytes
 * @returns formatted string like "1.5 MB", "200 KB", "50 B"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  
  return `${size} ${units[i]}`;
}

/**
 * Format duration in mm:ss format
 * @param seconds - duration in seconds
 * @returns formatted string like "1:30", "0:45"
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get file icon based on file type
 * @param fileType - MIME type or file extension
 * @returns Lucide icon name (as string)
 */
export function getFileIcon(fileType?: string): string {
  if (!fileType) return 'File';
  
  const type = fileType.toLowerCase();
  
  if (type.includes('image')) return 'Image';
  if (type.includes('audio')) return 'Music';
  if (type.includes('video')) return 'Video';
  if (type.includes('pdf')) return 'FileText';
  if (type.includes('word') || type.includes('document')) return 'FileText';
  if (type.includes('excel') || type.includes('sheet')) return 'Table';
  if (type.includes('zip') || type.includes('compressed')) return 'Archive';
  if (type.includes('code') || type.includes('javascript') || type.includes('typescript')) return 'Code';
  
  return 'File';
}

/**
 * Create object URL from file
 * @param file - File object
 * @returns object URL string
 */
export function createObjectUrlFromFile(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke object URL to free memory
 * @param url - object URL to revoke
 */
export function revokeObjectUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Check if MediaRecorder is supported in the browser
 */
export function isMediaRecorderSupported(): boolean {
  return typeof MediaRecorder !== 'undefined' && typeof navigator.mediaDevices !== 'undefined';
}

/**
 * Get supported MIME types for voice recording
 */
export function getSupportedMimeTypes(): string[] {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
    'audio/mpeg',
  ];
  
  return types.filter(type => MediaRecorder.isTypeSupported(type));
}
