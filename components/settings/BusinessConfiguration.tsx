'use client';

import { Card, CardContent, CardDescription, CardTitle, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useBusiness } from "@/contexts/BusinessContext";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';
import { Field, FieldValue } from "@/components/Field";
import { FieldSocialmedias } from "@/components/FieldSocialmedias";
import { FieldLogo } from "@/components/FieldLogo";
import { COUNTRIES } from "@/lib/countries";

// Esquema de validación con Zod
const businessSchema = z.object({
  commercialName: z.string().min(1, 'El nombre comercial es requerido'),
  description: z.string().optional(),
  logo: z.string().optional(),
  phoneNumber: z.string().min(1, 'El número de teléfono es requerido'),
  address: z.string().min(1, 'La dirección es requerida'),
  socialMedia: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    whatsapp: z.string().optional(),
    tiktok: z.string().optional()
  }),
  country: z.string().min(1, 'El país es requerido'),
  hasMultipleBranches: z.boolean()
});

type BusinessFormData = z.infer<typeof businessSchema>;

interface BusinessConfigurationProps {
  cardFocusedId?: string;
  setCardFocusedId: (id: string) => void;
}

export default function BusinessConfiguration({ cardFocusedId, setCardFocusedId }: BusinessConfigurationProps) {
  const { t } = useTranslation(['dashboard', 'common']);
  const { currentBusiness, loading: businessLoading, error: businessError, updateBusiness, clearError } = useBusiness();
  const [saving, setSaving] = useState(false);

  const valuesBusiness: FieldValue[] = [
    {
      name: 'logo',
      label: t('dashboard:logo'),
      placeholder: t('dashboard:logoPlaceholder'),
      type: 'file',
      component: FieldLogo,
    },
    {
      name: 'commercialName',
      label: t('dashboard:commercialName'),
      placeholder: t('dashboard:commercialNamePlaceholder'),
      type: 'text',
      component: Input,
    },
    {
      name: 'phoneNumber',
      label: t('dashboard:phoneNumber'),
      placeholder: t('dashboard:phoneNumberPlaceholder'),
      type: 'text',
      component: Input,
    },
    {
      name: 'address',
      label: t('dashboard:address'),
      placeholder: t('dashboard:addressPlaceholder'),
      type: 'text',
      component: Input,
    },
    {
      name: 'country',
      label: t('dashboard:country'),
      placeholder: t('dashboard:countryPlaceholder'),
      type: 'text',
      component: Select,
      options: Object.values(COUNTRIES).map(country => ({
        label: `${country.flag} ${country.name}`,
        value: country.name
      }))
    },
    {
      name: 'hasMultipleBranches',
      label: t('dashboard:hasMultipleBranches'),
      placeholder: t('dashboard:hasMultipleBranchesPlaceholder'),
      type: 'boolean',
      component: Select,
      options: [
        { label: t('dashboard:yes'), value: true },
        { label: t('dashboard:no'), value: false }
      ]
    },
    {
      name: "description",
      label: t('dashboard:description'),
      placeholder: t('dashboard:descriptionPlaceholder'),
      type: 'text',
      component: Textarea,
      info: "Esta descripción aparecerá en tu perfil público y ayudará a los clientes a conocerte mejor"
    },
    {
      name: "socialMedia",
      label: t('dashboard:socialMedia'),
      placeholder: t('dashboard:socialMediaPlaceholder'),
      type: 'socialMedia',
      component: FieldSocialmedias,
      info: "Las redes sociales ayudarán a los clientes a encontrarte y conocer tu trabajo"
    }
  ];

  // Configuración del formulario con useForm y Zod
  const form = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      commercialName: currentBusiness?.name || '',
      description: currentBusiness?.description || '',
      logo: currentBusiness?.logo || '',
      phoneNumber: currentBusiness?.phoneNumber || '',
      address: currentBusiness?.address || '',
      socialMedia: {
        instagram: currentBusiness?.socialMedia?.instagram || '',
        facebook: currentBusiness?.socialMedia?.facebook || '',
        whatsapp: currentBusiness?.socialMedia?.whatsapp || '',
        tiktok: currentBusiness?.socialMedia?.tiktok || ''
      },
      country: currentBusiness?.country || 'Venezuela',
      hasMultipleBranches: currentBusiness?.isChain ?? false
    }
  });

  // Actualizar valores del formulario cuando cambie currentBusiness
  useEffect(() => {
    if (currentBusiness) {
      form.reset({
        commercialName: currentBusiness.name || '',
        description: currentBusiness.description || '',
        logo: currentBusiness.logo || '',
        phoneNumber: currentBusiness.phoneNumber || '',
        address: currentBusiness.address || '',
        socialMedia: {
          instagram: currentBusiness.socialMedia?.instagram || '',
          facebook: currentBusiness.socialMedia?.facebook || '',
          whatsapp: currentBusiness.socialMedia?.whatsapp || '',
          tiktok: currentBusiness.socialMedia?.tiktok || ''
        },
        country: currentBusiness.country || 'Venezuela',
        hasMultipleBranches: currentBusiness.isChain ?? false
      });
    }
  }, [currentBusiness, form]);

  // Función para guardar cambios del negocio
  const onSubmit = async (data: BusinessFormData) => {
    if (!currentBusiness) {
      toast.error('No hay negocio seleccionado');
      return;
    }

    setSaving(true);
    clearError();

    try {
      const updateData = {
        name: data.commercialName,
        description: data.description,
        logo: data.logo,
        phoneNumber: data.phoneNumber,
        address: data.address,
        country: data.country,
        isChain: data.hasMultipleBranches,
        socialMedia: data.socialMedia
      };

      await updateBusiness(currentBusiness._id, updateData);
      toast.success('Información del negocio actualizada correctamente');
    } catch (error) {
      console.error('Error saving business:', error);
      toast.error('Error al guardar la información del negocio');
    } finally {
      setSaving(false);
    }
  };

  // Handler para el botón de guardar
  const handleSaveBusiness = () => {
    console.log(100052, form.getValues());
    form.handleSubmit(onSubmit)();
  };

  return (
    <Card
      id="business-card"
      onClick={(e) => {
        e.stopPropagation();
        setCardFocusedId(e.currentTarget.id)
      }}
      className={`${cardFocusedId === "business-card" ? "border-accent" : ""}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Configuración del Negocio</CardTitle>
            <CardDescription>Información básica de tu empresa</CardDescription>
          </div>
          <Button
            onClick={handleSaveBusiness}
            disabled={saving || businessLoading}
            className="flex items-center gap-2"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {valuesBusiness.map((value) => (
              <Field key={value.name} value={value} form={form} />
            ))}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
