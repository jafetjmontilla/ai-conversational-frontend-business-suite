import { Field, FieldValue } from "./Field";
import { TypographyExtraSmall } from "./Typography";
import { Input } from "./ui/input";
import { useTranslation } from "react-i18next";

interface FieldSocialmediasProps {
  form: any;
  value: any;
}

export const FieldSocialmedias = ({ form, value }: FieldSocialmediasProps) => {
  const { t } = useTranslation();

  const valuesSocialmedias: FieldValue[] = [
    {
      name: "socialMedia.instagram",
      label: t('dashboard:instagram'),
      placeholder: t('dashboard:instagramPlaceholder'),
      type: 'text',
      component: Input,
      icon: '📷',
      color: 'text-pink-600'
    },
    {
      name: "socialMedia.facebook",
      label: t('dashboard:facebook'),
      placeholder: t('dashboard:facebookPlaceholder'),
      type: 'text',
      component: Input,
      icon: '📘',
      color: 'text-blue-600'
    },
    {
      name: "socialMedia.whatsapp",
      label: t('dashboard:whatsapp'),
      placeholder: t('dashboard:whatsappPlaceholder'),
      type: 'text',
      component: Input,
      icon: '💬',
      color: 'text-green-600'
    },
    {
      name: "socialMedia.tiktok",
      label: t('dashboard:tiktok'),
      placeholder: t('dashboard:tiktokPlaceholder'),
      type: 'text',
      component: Input,
      icon: '🎵',
      color: 'text-black dark:text-white'
    }
  ]

  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {
          valuesSocialmedias.map((item) => (
            <Field key={item.name} value={item} form={form} />
          ))
        }
      </div >
      {value.info && <TypographyExtraSmall className="absolute -translate-y-2">{value.info}</TypographyExtraSmall>}
    </div>
  )
}
