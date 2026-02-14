'use client';

import { DetailedHTMLProps, FC, HTMLAttributes } from 'react';
import { FileIcon, defaultStyles } from 'react-file-icon';

interface FileIconComponentProps extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  extension: string;
}

export const FileIconComponent: FC<FileIconComponentProps> = (props) => {
  const { extension, className = '', ...rest } = props;

  const extensionKey = extension as keyof typeof defaultStyles;
  const styles = defaultStyles[extensionKey] || {};

  return (
    <div className={`text-foreground ${className}`.trim()} {...rest}>
      <FileIcon extension={extension} {...styles} />
    </div>
  );
};
