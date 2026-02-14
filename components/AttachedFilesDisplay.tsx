'use client';

import React from 'react';
import { FileIcon, defaultStyles } from 'react-file-icon';

export interface AttachedFileItem {
  name: string;
  url?: string;
}

interface AttachedFilesDisplayProps {
  files: AttachedFileItem[];
  className?: string;
  /** Tamaño del icono: 'sm' (default) | 'md' */
  size?: 'sm' | 'md';
}

function getExtension(filename: string): string {
  const name = (filename || '').toLowerCase();
  return name.split('.').pop() || '';
}

function getFileIconStyles(extension: string) {
  const ext = extension.toLowerCase();
  const key = ext as keyof typeof defaultStyles;
  return defaultStyles[key] || {};
}

export function AttachedFilesDisplay({ files, className = '', size = 'sm' }: AttachedFilesDisplayProps) {
  if (!files?.length) return null;

  const iconSize = size === 'md' ? 'w-10 h-12' : 'w-8 h-10';
  const iconSvg = size === 'md' ? '[&>svg]:w-10 [&>svg]:h-12' : '[&>svg]:w-8 [&>svg]:h-10';
  const textSize = size === 'md' ? 'text-xs' : 'text-[10px]';
  const maxW = size === 'md' ? 'max-w-[5rem]' : 'max-w-[4rem]';

  return (
    <div className={`flex flex-wrap gap-3 items-start ${className}`}>
      {files.map((file, index) => {
        const ext = getExtension(file.name);
        const styles = getFileIconStyles(ext);
        const content = (
          <div
            className={`flex flex-col items-center gap-1 min-w-0 flex-shrink-0 ${size === 'md' ? 'w-20' : 'w-16'}`}
          >
            <div className={`${iconSize} flex items-center justify-center ${iconSvg}`}>
              <FileIcon extension={ext} {...styles} />
            </div>
            <span
              className={`${textSize} font-medium text-center truncate w-full ${maxW}`}
              title={file.name}
            >
              {file.name}
            </span>
          </div>
        );

        if (file.url) {
          return (
            <a
              key={`${file.name}-${index}`}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-90 transition-opacity"
            >
              {content}
            </a>
          );
        }

        return <div key={`${file.name}-${index}`}>{content}</div>;
      })}
    </div>
  );
}
