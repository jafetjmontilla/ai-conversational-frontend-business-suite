'use client';

import { ComponentType, FC, HTMLAttributes } from "react"
import { FileIconComponent } from "./FileIconComponent"
import { Download } from "lucide-react"
import { Interweave } from "interweave"
import { HashtagMatcher, UrlMatcher, UrlProps } from "interweave-autolink"
import Link from "next/link"

interface Comment {
  _id?: string
  comment?: string
  attachments?: Array<{ name: string; size: number }>
  createdAt?: string
  uid?: string
  nicknameUnregistered?: string
  displayName?: string
}

interface ListCommentsProps extends HTMLAttributes<HTMLDivElement> {
  item: Comment
  identifierDisabled?: boolean
  onDownloadFile?: (fileName: string) => void
}

export const ListComments: FC<ListCommentsProps> = ({
  item,
  identifierDisabled,
  onDownloadFile,
  ...props
}) => {
  const replacesLink: ComponentType<UrlProps> = (props) => {
    return (
      <Link href={props?.url || '#'} target="_blank" className="text-xs break-all underline">
        {props?.children}
      </Link>
    )
  };

  return (
    <div className={`flex flex-col w-full px-2 py-1 border-t-[1px] hover:bg-gray-100 relative`} {...props}>
      <div className='flex flex-1 items-start w-full'>
        <div className="w-8 h-8">
          {!identifierDisabled && (
            <div className='bg-gray-300 w-8 h-8 rounded-full mt-1 flex items-center justify-center cursor-pointer'>
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-semibold">
                {(item?.displayName || item?.nicknameUnregistered || 'U')?.[0]?.toUpperCase()}
              </div>
            </div>
          )}
          {identifierDisabled && <div className="w-8 h-8" />}
        </div>
        <div className="flex flex-col flex-1 px-1.5 w-[85%]">
          <span className="text-[11px] mt-2.5 font-semibold">
            {item?.displayName || item?.nicknameUnregistered || 'Usuario'}
          </span>
          {item?.attachments && item.attachments.length > 0 && (
            <div className="grid grid-cols-2 gap-3 max-w-[280px] mt-2">
              {item.attachments.map((elem: any, idx: number) => (
                <div key={idx} className="bg-gray-300 col-span-1 flex flex-col items-center w-[130px] h-[80px] rounded-lg overflow-hidden">
                  <div className="flex-1 w-full flex justify-center items-center relative">
                    {onDownloadFile && (
                      <div
                        className="absolute z-20 right-3 top-2 text-gray-600 hover:text-gray-800 cursor-pointer"
                        onClick={() => onDownloadFile(elem.name)}
                      >
                        <Download className="w-6 h-6" />
                      </div>
                    )}
                    <div className="w-full h-[54px] flex flex-col items-center justify-center">
                      <FileIconComponent
                        extension={(elem?.name ?? elem?.file?.name)?.split(".")?.slice(-1)[0] || 'file'}
                        className="w-10 h-10 mb-2 border-[1px] border-gray-300 rounded-[5px]"
                      />
                    </div>
                  </div>
                  <div className="w-full flex flex-col items-center px-2 cursor-default">
                    <span className="w-full text-[10px] truncate text-center">{elem?.name ?? elem?.file?.name}</span>
                    <span className="text-gray-800 text-[9px] select-none">
                      {Math.trunc(((elem?.size ?? elem?.file?.size) || 0) / 1024)} K
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="w-[65vw] md:w-full overflow-hidden text-ellipsis whitespace-nowrap">
            <Interweave
              className="text-xs transition-all"
              content={item?.comment}
              matchers={[
                new UrlMatcher('url', {}, replacesLink),
                new HashtagMatcher('hashtag')
              ]}
            />
          </div>
        </div>
      </div>
      {item?.createdAt && (
        <span className='cursor-default justify-end text-[9px] font-medium flex-1 flex right-0 mt-1 text-gray-500'>
          {new Date(item.createdAt).toLocaleString()}
        </span>
      )}
    </div>
  )
}
