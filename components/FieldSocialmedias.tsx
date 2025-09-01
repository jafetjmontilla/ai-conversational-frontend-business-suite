import { Field, FieldValue } from "./Field";
import { TypographyExtraSmall } from "./Typography";
import { Input } from "./ui/input";


interface FieldSocialmediasProps {
  form: any;
  value: any;
}

export const FieldSocialmedias = ({ form, value }: FieldSocialmediasProps) => {


  const valuesSocialmedias: FieldValue[] = [
    {
      name: "socialMedia.instagram",
      label: 'Instagram',
      placeholder: '@tuusuario',
      type: 'text',
      component: Input,
      icon: '📷',
      color: 'text-pink-600'
    },
    {
      name: "socialMedia.facebook",
      label: 'Facebook',
      placeholder: 'https://facebook.com/tupagina',
      type: 'text',
      component: Input,
      icon: '📘',
      color: 'text-blue-600'
    },
    {
      name: "socialMedia.whatsapp",
      label: 'WhatsApp',
      placeholder: '+56912345678',
      type: 'text',
      component: Input,
      icon: '💬',
      color: 'text-green-600'
    },
    {
      name: "socialMedia.tiktok",
      label: 'TikTok',
      placeholder: '@tuusuario',
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
