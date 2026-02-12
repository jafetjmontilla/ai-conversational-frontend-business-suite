'use client';

import { DetailedHTMLProps, FC, HTMLAttributes } from 'react';
import { FileIcon, defaultStyles } from 'react-file-icon';

interface FileIconComponentProps extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  extension: string;
}

export const FileIconComponent: FC<FileIconComponentProps> = (props) => {
  const { extension } = props;

  const extensionKey = extension as keyof typeof defaultStyles;
  const styles = defaultStyles[extensionKey] || {};

  return (
    <div {...props}>
      <FileIcon extension={extension} {...styles} />
    </div>
  );
};
