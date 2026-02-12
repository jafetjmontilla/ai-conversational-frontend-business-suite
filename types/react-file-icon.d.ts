declare module 'react-file-icon' {
  import { FC } from 'react';

  export interface FileIconProps {
    extension: string;
    [key: string]: any;
  }

  export const FileIcon: FC<FileIconProps>;
  export const defaultStyles: Record<string, any>;
}
