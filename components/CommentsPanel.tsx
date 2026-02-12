'use client';

import { InputComments } from '@/components/InputComments';
import { ListComments } from '@/components/ListComments';
import { MessageSquare, Bell, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Comment {
  _id?: string
  comment?: string
  attachments?: Array<{ name: string; size: number }>
  createdAt?: string
  uid?: string
  displayName?: string
}

interface CommentsPanelProps {
  comments: Comment[]
  disabled?: boolean
  disableAttachments?: boolean
  onCommentAdded: (comment: Comment) => void
  onDeleteComment?: (commentId?: string) => void
  onDownloadFile?: (fileName: string) => void
  currentUserId?: string
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({
  comments,
  disabled = false,
  disableAttachments = false,
  onCommentAdded,
  onDeleteComment,
  onDownloadFile,
  currentUserId = 'current-user-id',
}) => {
  const [previousCountComments, setPreviousCountComments] = useState(0);
  const commentsContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al agregar nuevos comentarios
  useEffect(() => {
    if (comments.length > previousCountComments) {
      setTimeout(() => {
        if (commentsContainerRef.current) {
          commentsContainerRef.current.scrollTo({
            top: commentsContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
    setPreviousCountComments(comments.length);
  }, [comments.length, previousCountComments]);

  const handleDeleteComment = (commentId?: string) => {
    if (onDeleteComment) {
      onDeleteComment(commentId);
    }
  };

  return (
    <div className="flex flex-col bg-gray-50 h-[600px] border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="h-[49px] px-2 border-b border-gray-200 bg-white flex items-center flex-shrink-0">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-xl font-semibold">Actividad</div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{comments.length} comentarios</span>
            <Bell className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
          </div>
        </div>
      </div>

      {/* Contenedor de comentarios con scroll */}
      <div
        ref={commentsContainerRef}
        id="comments-container"
        className="flex-1 overflow-y-auto min-h-0 bg-gray-50"
      >
        {comments.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No hay comentarios</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="space-y-2 flex-shrink-0">
              {comments.map((comment) => (
                <div key={comment._id} className="relative group">
                  <ListComments
                    item={comment}
                    onDownloadFile={onDownloadFile}
                  />
                  {comment.uid === currentUserId && (
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded shadow-sm hover:bg-gray-100"
                      title="Eliminar comentario"
                    >
                      <Trash2 className="w-4 h-4 text-gray-500 hover:text-[#ef4444]" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input de comentarios - fijo abajo */}
      <div className="border-t border-gray-200 bg-white flex-shrink-0">
        <InputComments
          disabled={disabled}
          disableAttachments={disableAttachments}
          onCommentAdded={onCommentAdded}
        />
      </div>
    </div>
  );
};
