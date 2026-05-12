import { FC } from 'react';

interface AvatarProps {
  user?: object | null;
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackClassName?: string;
}

declare const Avatar: FC<AvatarProps>;
export default Avatar;
