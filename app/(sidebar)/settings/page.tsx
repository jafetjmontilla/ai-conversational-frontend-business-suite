'use client';

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardTitle, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useAllowed } from "@/lib/hooks/useAllowed";
import * as Typography from "@/components/Typography";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Plus, Edit, Trash2, Users, Clock, Scissors, Calendar, Package } from "lucide-react";

export default function SettingPage() {
  const { authUser, loading, logout } = useAuth();
  const { getCurrentRole, getCurrentPlan } = useAllowed();
  const { t } = useTranslation(['dashboard', 'common']);

  const [businessInfo, setBusinessInfo] = useState({
    commercialName: "Pestilo Barbershop",
    description: "Barbería moderna especializada en cortes de cabello, afeitado y cuidado personal para hombres. Ofrecemos servicios de alta calidad con profesionales experimentados.",
    logo: "",
    phoneNumber: "+58 212 555-0123",
    address: "Av. Principal, Centro Comercial Plaza, Local 15, Caracas, Venezuela",
    socialMedia: {
      instagram: "@pestilobarbershop",
      facebook: "PestiloBarbershop",
      whatsapp: "+58 212 555-0123",
      tiktok: "@pestilobarbershop"
    },
    country: "Venezuela",
    hasMultipleBranches: true
  });

  const [branches, setBranches] = useState([
    {
      id: 1,
      name: "Sucursal Centro",
      address: "Av. Principal, Centro",
      country: "Venezuela",
      locality: "Caracas",
      manager: "Juan Pérez",
      professionals: 8,
      services: 15,
      activeClients: 120
    },
    {
      id: 2,
      name: "Sucursal Este",
      address: "Calle Comercial, Este",
      country: "Venezuela",
      locality: "Valencia",
      manager: "María García",
      professionals: 6,
      services: 12,
      activeClients: 85
    }
  ]);

  const authUserDisplay = [
    { title: t('dashboard:name'), value: authUser?.displayName || 'No especificado' },
    { title: t('dashboard:email'), value: authUser?.email || 'No especificado' },
    { title: t('dashboard:emailVerified'), value: authUser?.emailVerified || false },
    { title: t('dashboard:role'), value: getCurrentRole() || 'No especificado' },
    { title: t('dashboard:plan'), value: getCurrentPlan() || 'No especificado' }
  ];

  const addBranch = () => {
    const newBranch = {
      id: Date.now(),
      name: "Nueva Sucursal",
      address: "",
      country: "Venezuela",
      locality: "",
      manager: "",
      professionals: 0,
      services: 0,
      activeClients: 0
    };
    setBranches([...branches, newBranch]);
  };

  const deleteBranch = (id: number) => {
    setBranches(branches.filter(branch => branch.id !== id));
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col">
            <CardTitle>Configuración del Sistema</CardTitle>
            <CardDescription>Gestiona la configuración de tu negocio y sucursales</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Información del Usuario */}
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
            <CardContent className="flex flex-col md:flex-row gap-[1vw] justify-between px-[1vw] py-2">
              {authUserDisplay.map((item) => (
                <Card key={item.title} className="flex-1">
                  <CardContent className="flex flex-row items-center gap-2 py-0.5 md:py-2">
                    <Typography.TypographySmall className="capitalize">{item.title}</Typography.TypographySmall>
                    {typeof item.value === 'boolean'
                      ? <Badge variant={item.value ? "default" : "secondary"} className="mt-1">
                        {item.value ? t('common:yes') : t('common:no')}
                      </Badge>
                      : <Typography.TypographyLarge>{item.value}</Typography.TypographyLarge>}
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          <Separator className="my-4" />

          {/* Configuración del Negocio */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Negocio</CardTitle>
              <CardDescription>Información básica de tu empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Section */}
              <div className="space-y-4">
                <Label htmlFor="logo">Logotipo del Negocio</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center bg-muted/50">
                    {businessInfo.logo ? (
                      <img
                        src={businessInfo.logo}
                        alt="Logo del negocio"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <div className="text-muted-foreground text-xs text-center">
                        <div className="text-2xl mb-1">🏢</div>
                        <div>Sin logo</div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      id="logo"
                      placeholder="URL del logotipo o ruta de archivo"
                      value={businessInfo.logo}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, logo: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ingresa la URL de tu logotipo o sube una imagen
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="commercialName">Nombre Comercial</Label>
                  <Input
                    id="commercialName"
                    value={businessInfo.commercialName}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, commercialName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Número de Teléfono</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="+58 212 555-0123"
                    value={businessInfo.phoneNumber}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, phoneNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">País de Operación</Label>
                  <Select value={businessInfo.country} onValueChange={(value) => setBusinessInfo({ ...businessInfo, country: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Venezuela">Venezuela</SelectItem>
                      <SelectItem value="Colombia">Colombia</SelectItem>
                      <SelectItem value="México">México</SelectItem>
                      <SelectItem value="España">España</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hasMultipleBranches">Múltiples Sucursales</Label>
                  <Select value={businessInfo.hasMultipleBranches.toString()} onValueChange={(value) => setBusinessInfo({ ...businessInfo, hasMultipleBranches: value === 'true' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sí</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Dirección Principal</Label>
                <Input
                  id="address"
                  placeholder="Av. Principal, Centro Comercial Plaza, Local 15, Caracas, Venezuela"
                  value={businessInfo.address}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Dirección física principal de tu negocio
                </p>
              </div>

              {/* Social Media */}
              <div className="space-y-4">
                <Label>Redes Sociales</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram" className="flex items-center gap-2">
                      <span className="text-pink-600">📷</span>
                      Instagram
                    </Label>
                    <Input
                      id="instagram"
                      placeholder="@pestilobarbershop"
                      value={businessInfo.socialMedia.instagram}
                      onChange={(e) => setBusinessInfo({
                        ...businessInfo,
                        socialMedia: { ...businessInfo.socialMedia, instagram: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook" className="flex items-center gap-2">
                      <span className="text-blue-600">📘</span>
                      Facebook
                    </Label>
                    <Input
                      id="facebook"
                      placeholder="PestiloBarbershop"
                      value={businessInfo.socialMedia.facebook}
                      onChange={(e) => setBusinessInfo({
                        ...businessInfo,
                        socialMedia: { ...businessInfo.socialMedia, facebook: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="flex items-center gap-2">
                      <span className="text-green-600">💬</span>
                      WhatsApp
                    </Label>
                    <Input
                      id="whatsapp"
                      placeholder="+58 212 555-0123"
                      value={businessInfo.socialMedia.whatsapp}
                      onChange={(e) => setBusinessInfo({
                        ...businessInfo,
                        socialMedia: { ...businessInfo.socialMedia, whatsapp: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tiktok" className="flex items-center gap-2">
                      <span className="text-black dark:text-white">🎵</span>
                      TikTok
                    </Label>
                    <Input
                      id="tiktok"
                      placeholder="@pestilobarbershop"
                      value={businessInfo.socialMedia.tiktok}
                      onChange={(e) => setBusinessInfo({
                        ...businessInfo,
                        socialMedia: { ...businessInfo.socialMedia, tiktok: e.target.value }
                      })}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Las redes sociales ayudarán a los clientes a encontrarte y conocer tu trabajo
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción del Negocio</Label>
                <Textarea
                  id="description"
                  placeholder="Describe tu negocio, servicios y lo que te hace único..."
                  value={businessInfo.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBusinessInfo({ ...businessInfo, description: e.target.value })}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Esta descripción aparecerá en tu perfil público y ayudará a los clientes a conocerte mejor
                </p>
              </div>


            </CardContent>
          </Card>

          {/* Gestión de Sucursales */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestión de Sucursales</CardTitle>
                  <CardDescription>Administra tus sucursales y su configuración</CardDescription>
                </div>
                <Button onClick={addBranch} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nueva Sucursal
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Vista General</TabsTrigger>
                  <TabsTrigger value="professionals">Profesionales</TabsTrigger>
                  <TabsTrigger value="schedules">Horarios</TabsTrigger>
                  <TabsTrigger value="services">Servicios</TabsTrigger>
                  <TabsTrigger value="clients">Clientes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {branches.map((branch) => (
                      <Card key={branch.id} className="relative">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{branch.name}</CardTitle>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => deleteBranch(branch.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <CardDescription>{branch.address}, {branch.locality}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Encargado:</span>
                            <span className="font-medium">{branch.manager}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <Users className="h-4 w-4 text-blue-600" />
                              <span className="text-xs text-muted-foreground">Profesionales</span>
                              <span className="font-semibold">{branch.professionals}</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <Scissors className="h-4 w-4 text-green-600" />
                              <span className="text-xs text-muted-foreground">Servicios</span>
                              <span className="font-semibold">{branch.services}</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <Calendar className="h-4 w-4 text-purple-600" />
                              <span className="text-xs text-muted-foreground">Clientes</span>
                              <span className="font-semibold">{branch.activeClients}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="professionals" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Gestión de Profesionales</CardTitle>
                      <CardDescription>Agrega, edita y elimina empleados de tus sucursales</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Selecciona una sucursal para gestionar sus profesionales</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="schedules" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configuración de Horarios</CardTitle>
                      <CardDescription>Define horarios de trabajo y turnos</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Configura horarios de sucursales y profesionales</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="services" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Gestión de Servicios</CardTitle>
                      <CardDescription>Lista de servicios con precios y duración</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <Scissors className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Configura los servicios ofrecidos en cada sucursal</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="clients" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Clientes y Citas</CardTitle>
                      <CardDescription>Historial de clientes y gestión de citas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Gestiona clientes y agenda de citas</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Inventario y Facturación */}
          <Card>
            <CardHeader>
              <CardTitle>Inventario y Facturación</CardTitle>
              <CardDescription>Gestión interna y control financiero</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Módulo de inventario y facturación próximamente disponible</p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}