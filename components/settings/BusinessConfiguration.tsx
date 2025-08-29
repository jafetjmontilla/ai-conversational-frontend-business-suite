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
import { BusinessInput } from "@/lib/interfases";
import { Field, FieldValue } from "@/components/Field";
import { FieldSocialmedias } from "@/components/FieldSocialmedias";
import { FieldLogo } from "@/components/FieldLogo";
import { COUNTRIES } from "@/lib/countries";

// Esquema de validación con Zod
const businessSchema = z.object({
  commercialName: z.string().min(1, 'El nombre comercial es requerido'),
  slug: z.string().min(1, 'El slug es requerido').regex(/^[a-z0-9-]+$/, 'El slug debe contener solo letras minúsculas, números y guiones'),
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
  const { currentBusiness, loading: businessLoading, error: businessError, updateBusiness, createBusiness, clearError, checkSlugAvailable } = useBusiness();
  const [saving, setSaving] = useState(false);
  const [slugChecking, setSlugChecking] = useState(false);

  // Determinar si estamos creando o editando
  const isCreating = !currentBusiness;

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
      name: 'slug',
      label: 'URL del negocio (slug)',
      placeholder: 'mi-negocio-url',
      type: 'text',
      component: Input,
      info: 'Esta será la URL única de tu negocio. Solo letras minúsculas, números y guiones.',
      disabled: !isCreating // Solo editable al crear
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
      slug: currentBusiness?.slug || '',
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
        slug: currentBusiness.slug || '',
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
    } else {
      // Si no hay negocio actual, resetear el formulario para creación
      form.reset({
        commercialName: '',
        slug: '',
        description: '',
        logo: '',
        phoneNumber: '',
        address: '',
        socialMedia: {
          instagram: '',
          facebook: '',
          whatsapp: '',
          tiktok: ''
        },
        country: 'Venezuela',
        hasMultipleBranches: false
      });
    }
  }, [currentBusiness, form]);

  // Función para validar slug único
  const validateSlug = async (slug: string): Promise<boolean> => {
    if (!isCreating) return true; // No validar en edición
    if (!slug) return false;

    setSlugChecking(true);
    try {
      const isAvailable = await checkSlugAvailable(slug);
      return isAvailable;
    } catch (error) {
      console.error('Error checking slug:', error);
      return false;
    } finally {
      setSlugChecking(false);
    }
  };

  // Función para crear o actualizar negocio
  const onSubmit = async (data: BusinessFormData) => {
    setSaving(true);
    clearError();

    try {
      const businessData: BusinessInput = {
        name: data.commercialName,
        slug: data.slug,
        description: data.description,
        logo: data.logo,
        phoneNumber: data.phoneNumber,
        address: data.address,
        country: data.country,
        isChain: data.hasMultipleBranches,
        socialMedia: data.socialMedia
      };

      if (isCreating) {
        // Validar slug único antes de crear
        const isSlugAvailable = await validateSlug(data.slug);
        if (!isSlugAvailable) {
          toast.error('El slug ya está en uso. Por favor, elige otro.');
          return;
        }

        const result = await createBusiness(businessData);
        if (result) {
          toast.success('Negocio creado correctamente');
        } else {
          toast.error('Error al crear el negocio');
        }
      } else {
        // Actualizar negocio existente
        if (!currentBusiness) {
          toast.error('No hay negocio seleccionado');
          return;
        }

        const result = await updateBusiness(currentBusiness._id, businessData);
        if (result) {
          toast.success('Información del negocio actualizada correctamente');
        } else {
          toast.error('Error al actualizar el negocio');
        }
      }
    } catch (error) {
      console.error('Error saving business:', error);
      toast.error(isCreating ? 'Error al crear el negocio' : 'Error al actualizar el negocio');
    } finally {
      setSaving(false);
    }
  };

  // Handler para el botón de guardar
  const handleSaveBusiness = () => {
    form.handleSubmit(onSubmit)();
  };

  // Función para auto-generar slug a partir del nombre comercial
  const generateSlugFromName = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Escuchar cambios en el nombre comercial para auto-generar slug (solo en creación)
  useEffect(() => {
    if (isCreating) {
      const subscription = form.watch((value, { name }) => {
        if (name === 'commercialName' && value.commercialName && !form.getValues('slug')) {
          const generatedSlug = generateSlugFromName(value.commercialName);
          form.setValue('slug', generatedSlug);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [form, isCreating]);

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
            <CardTitle>{isCreating ? 'Crear Nuevo Negocio' : 'Configuración del Negocio'}</CardTitle>
            <CardDescription>
              {isCreating
                ? 'Completa la información para crear tu primer negocio'
                : 'Información básica de tu empresa'
              }
            </CardDescription>
          </div>
          <Button
            onClick={handleSaveBusiness}
            disabled={saving || businessLoading || slugChecking}
            className="flex items-center gap-2"
          >
            {saving
              ? (isCreating ? "Creando..." : "Guardando...")
              : (isCreating ? "Crear Negocio" : "Guardar Cambios")
            }
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
