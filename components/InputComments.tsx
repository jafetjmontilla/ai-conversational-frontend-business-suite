'use client';

import { ChangeEvent, Dispatch, FC, SetStateAction, useEffect, useState } from "react"
import { QuillEditor, PastedAndDropFile } from "./QuillEditor"
import { IoIosSend } from "react-icons/io";
import { Plus } from "lucide-react";
import ClickAwayListener from "react-click-away-listener"
import { PiFileArrowUpThin } from "react-icons/pi"
import { IoClose } from "react-icons/io5";
import { SwiperPastedAndDropFiles } from "./SwiperPastedAndDropFiles"
import { LiaTrashSolid } from "react-icons/lia";
import { FileIconComponent } from "./FileIconComponent"
import { customAlphabet } from "nanoid"
import { Lock } from 'lucide-react'

interface Comment {
  _id?: string
  comment?: string
  attachments?: Array<{ name: string; size: number }>
  createdAt?: string
}

interface InputCommentsProps {
  disabled?: boolean
  disableAttachments?: boolean
  onCommentAdded?: (comment: Comment) => void
  placeholder?: string
}

export const InputComments: FC<InputCommentsProps> = ({
  disabled = false,
  disableAttachments = false,
  onCommentAdded,
  placeholder = "Escribe un comentario..."
}) => {
  const [value, setValue] = useState<string>("<p><br></p>")
  const [valir, setValir] = useState(false)
  const [pastedAndDropFiles, setPastedAndDropFiles] = useState<PastedAndDropFile[]>([]);
  const [slideSelect, setSlideSelect] = useState(0)
  const [attachment, setAttachment] = useState(false);
  const [enabledInput, setEnabledInput] = useState(false);

  useEffect(() => {
    const valir = value?.replace(/ id="selected"/g, "")?.replace(/ focusoffset="[^"]*"/g, '').split("<p><br></p>").find(elem => elem !== "")
    if (value && !!valir) {
      setValir(true)
    } else {
      setValir(false)
    }
  }, [value])

  const handleCreateComment = async () => {
    if (disabled) {
      return;
    }

    setValir(false)
    if (value || pastedAndDropFiles.length) {
      const valueSend = value?.replace(/ id="selected"/g, "")?.replace(/ focusoffset="[^"]*"/g, '')
      const attachments = pastedAndDropFiles?.map((elem) => {
        return { name: elem.file.name, size: elem.file.size }
      })

      const newComment: Comment = {
        _id: customAlphabet('1234567890abcdef', 24)(),
        comment: valueSend,
        attachments,
        createdAt: new Date().toISOString()
      }

      // Notificar al componente padre si se proporciona el callback
      if (onCommentAdded && typeof onCommentAdded === 'function') {
        onCommentAdded(newComment);
      }

      // Limpiar formulario
      setValue("<p><br></p>");
      setPastedAndDropFiles([]);
    }
  }

  type FileChangeEvent = {
    event: ChangeEvent<HTMLInputElement>
    saveType: string
  }

  const handleFileChange = async ({ event, saveType }: FileChangeEvent) => {
    if (disabled) {
      return;
    }

    const files = [...Array.from(event.currentTarget.files || [])]
    const newFiles = files.map(elem => ({
      saveType,
      _id: customAlphabet('1234567890abcdef', 24)(),
      loading: true,
      file: elem
    }))
    setPastedAndDropFiles([...pastedAndDropFiles, ...newFiles]);
  };

  const handleClosePasteImages = () => {
    setSlideSelect(0)
    setPastedAndDropFiles([])
  };

  // MOSTRAR MENSAJE DE SOLO LECTURA SI ESTÁ DESHABILITADO
  if (disabled) {
    return (
      <div className='bg-muted/50 flex items-center justify-center pt-2 px-2 py-4 border-t border-border'>
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Lock className="w-4 h-4" />
          <span className="text-sm">Los comentarios están deshabilitados - No tienes permisos para comentar</span>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-background flex items-center pt-2 px-2 relative'>
      <div className='flex flex-1 relative'>
        {!!pastedAndDropFiles?.length && (
          <div className='bg-muted/50 absolute z-[20] -translate-y-[calc(100%-90px)] w-full md:w-[90%] border border-border rounded-md shadow-md flex flex-col items-center justify-center'>
            <div className='bg-muted w-full h-8 flex justify-end items-center px-2'>
              <div onClick={() => {
                if (disabled) return;

                if (slideSelect === pastedAndDropFiles.length - 1 && pastedAndDropFiles.length > 1) {
                  setSlideSelect(slideSelect - 1)
                }
                if (pastedAndDropFiles.length === 1) {
                  handleClosePasteImages()
                }
                const newFiles = [...pastedAndDropFiles]
                newFiles.splice(slideSelect, 1)
                setPastedAndDropFiles(newFiles)
              }} className={disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}>
                <LiaTrashSolid className="w-6 h-6 mr-6 text-foreground" />
              </div>
              <div onClick={() => {
                if (!disabled) {
                  handleClosePasteImages()
                }
              }} className={`text-foreground ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                <IoClose className="w-6 h-6" />
              </div>
            </div>
            {pastedAndDropFiles[slideSelect].saveType === "image"
              ? <img src={URL.createObjectURL(pastedAndDropFiles[slideSelect].file)} alt="Imagen" style={{ maxWidth: '100%', maxHeight: '240px', minHeight: '150px' }} />
              : <div className="w-full h-[150px] flex flex-col items-center justify-center">
                <FileIconComponent extension={pastedAndDropFiles[slideSelect].file.name.split(".").slice(-1)[0]} className="w-10 h-10 mb-2 border border-border rounded-[5px]" />
                <p className="w-[150px] text-center text-foreground">{pastedAndDropFiles[slideSelect].file.name}</p>
                <span className="text-muted-foreground">{Math.trunc(pastedAndDropFiles[slideSelect].file.size / 1024)} K</span>
              </div>
            }
            <div className={`w-full min-h-[52px] flex items-center px-2 ${disabled ? 'bg-muted/70' : 'bg-muted'}`}>
              <QuillEditor
                value={value}
                setValue={disabled ? () => { } : setValue}
                setPastedAndDropFiles={disabled ? () => { } : setPastedAndDropFiles}
                pastedAndDropFiles={pastedAndDropFiles}
              />
            </div>
            <div className='bg-muted flex w-full h-10'>
              <div className="w-14 h-full flex justify-center items-center"></div>
              <div className="flex-1 h-full flex justify-center items-center">
                {pastedAndDropFiles.length > 1 && (
                  <SwiperPastedAndDropFiles pastedAndDropFiles={pastedAndDropFiles} setSlideSelect={setSlideSelect} slideSelect={slideSelect} />
                )}
              </div>
              <span
                onClick={() => {
                  if (disabled) return;

                  handleCreateComment()
                }}
                className={`w-10 flex justify-center items-center right-3 bottom-[10.5px] ${disabled
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer font-semibold"
                  }`}
              >
                <IoIosSend className={`h-[23px] w-auto select-none ${disabled ? "text-muted-foreground" : "text-primary"
                  }`} />
              </span>
            </div>
          </div>
        )}
        {!pastedAndDropFiles.length && (
          <div className="w-full flex flex-row-reverse">
            <div className='w-full min-h-[52px] flex items-center relative'>
              <div className={`w-full ${disabled ? 'opacity-60' : ''}`}>
                <QuillEditor
                  value={value}
                  setValue={disabled ? () => { } : setValue}
                  setPastedAndDropFiles={disabled ? () => { } : setPastedAndDropFiles}
                  pastedAndDropFiles={pastedAndDropFiles}
                />
              </div>
              {disabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded">
                  <div className="text-center">
                    <Lock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Comentarios deshabilitados</p>
                  </div>
                </div>
              )}
            </div>
            {!disableAttachments && (
              <div className='flex justify-center items-center'>
                {enabledInput && !disabled && (
                  <>
                    <input
                      type="file"
                      accept='image/*'
                      onChange={(event) => handleFileChange({ event, saveType: "image" })}
                      id={`file-upload-img`}
                      className="hidden"
                      multiple
                      disabled={disabled}
                    />
                    <input
                      type="file"
                      onChange={(event) => handleFileChange({ event, saveType: "doc" })}
                      id={`file-upload-doc`}
                      className="hidden"
                      multiple
                      disabled={disabled}
                    />
                  </>
                )}
                <div className="">
                  <ClickAwayListener onClickAway={() => {
                    if (!disabled) {
                      setAttachment(false)
                    }
                  }}>
                    <div className={`select-none ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                      <div className='translate-y-[4px]'>
                        {attachment && !disabled && (
                          <div className='bg-popover w-40 absolute z-50 -translate-y-full -translate-x-4 border border-border rounded-md shadow-md'>
                            <ul className='py-2 px-1 text-[11px] text-foreground'>
                              <li onClickCapture={() => setEnabledInput(true)} className='cursor-pointer hover:bg-muted rounded-md items-center'>
                                <label htmlFor={`file-upload-doc`} className='font-semibold cursor-pointer flex items-center space-x-1 p-1'>
                                  <PiFileArrowUpThin className='w-6 h-6' />
                                  <span>Adjuntar archivo</span>
                                </label>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                      <div onClick={() => {
                        if (disabled) return;

                        setTimeout(() => {
                          setAttachment(!attachment)
                        }, 10);
                      }} className={`w-10 h-10 flex justify-center items-center rounded-full ${disabled
                        ? "opacity-50"
                        : pastedAndDropFiles?.length
                          ? "hover:bg-accent"
                          : "hover:bg-muted"
                        }`}>
                        <Plus className="w-5 h-5 text-foreground" />
                      </div>
                    </div>
                  </ClickAwayListener>
                </div>
              </div>
            )}
            <span
              onClick={valir && !disabled
                ? () => {
                  handleCreateComment()
                }
                : () => { }}
              className={`absolute right-3 bottom-[10.5px] ${valir && !disabled
                ? "cursor-pointer font-semibold"
                : "text-muted-foreground"
                } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
              title={disabled ? "No tienes permisos para comentar" : ""}
            >
              <IoIosSend className={`h-[23px] w-auto select-none ${valir && !disabled ? "text-primary" : "text-muted-foreground"
                }`} />
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
