"use client";

import React, { useState, useRef, useEffect, useMemo, createRef } from 'react';
import { fetchApiJaihomV1, queries } from '@/lib/Fetching';
import { Supplier, FetchSupplierResults } from '@/lib/types/payment-reports';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Receipt, Search, Plus, Save, Download, Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Función para obtener la fecha actual en formato YYYY-MM-DD
const getToday = () => new Date().toISOString().slice(0, 10);

// Interfaces para los datos de retención
interface Retencion {
  Serie: string;
  NumeroDocumento: string;
  FechaEmision: string;
}

interface Proveedor {
  letterIdentifier: string;
  numberIdentifier: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  TotalBaseImponible: string;
  TotalIVA: string;
  TotalRetenido: string;
}

interface Factura {
  FechaDocumento: string;
  SerieDocumento: string;
  NumeroDocumento: string;
  NumeroControl: string;
  MontoTotal: string;
  MontoExento: string;
  BaseImponible: string;
  PorcentajeIVA: string;
  MontoIVA: string;
  Retenido: string;
  Porcentaje: string;
  RetenidoIVA: string;
  Percibido: string;
}

export default function RetentionIVAPage() {

  // Estados principales
  const [retencion, setRetencion] = useState<Retencion>({
    Serie: "",
    NumeroDocumento: "",
    FechaEmision: getToday()
  });

  const [proveedor, setProveedor] = useState<Proveedor>({
    letterIdentifier: "",
    numberIdentifier: "",
    name: "",
    address: "",
    phone: "",
    email: "",
    TotalBaseImponible: "",
    TotalIVA: "",
    TotalRetenido: ""
  });

  const [proveedorId, setProveedorId] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [sugerencias, setSugerencias] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Estados para facturas
  const [facturas, setFacturas] = useState<Factura[]>([
    {
      FechaDocumento: getToday(),
      SerieDocumento: "",
      NumeroDocumento: "",
      NumeroControl: "",
      MontoTotal: "",
      MontoExento: "",
      BaseImponible: "",
      PorcentajeIVA: "16",
      MontoIVA: "",
      Retenido: "",
      Porcentaje: "",
      RetenidoIVA: "",
      Percibido: ""
    }
  ]);

  // Refs para navegación con Enter
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Función para calcular automáticamente los montos
  const calcularMontos = (factura: Factura, index: number) => {
    const baseImponible = parseFloat(factura.BaseImponible) || 0;
    const porcentajeRetencion = parseFloat(factura.Porcentaje) || 0;

    // Calcular Monto IVA (Base Imponible * 16%)
    const montoIVA = baseImponible * 0.16;

    // Calcular Monto Retenido (Monto IVA * % Retención)
    const montoRetenido = montoIVA * (porcentajeRetencion / 100);

    const facturasActualizadas = [...facturas];
    facturasActualizadas[index] = {
      ...factura,
      MontoIVA: montoIVA.toFixed(2),
      Retenido: montoRetenido.toFixed(2)
    };

    setFacturas(facturasActualizadas);
  };

  // Función de búsqueda con debounce
  const buscarProveedores = async (valor: string) => {
    if (valor.length) {
      try {
        setLoading(true);
        const result: FetchSupplierResults = await fetchApiJaihomV1({
          query: queries.searchSupplier,
          variables: { text: valor },
          type: "json"
        });

        if (result && result.results) {
          setSugerencias(result.results);
          setShowSuggestions(true);
        } else {
          setSugerencias([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error("Error buscando proveedores:", error);
        setSugerencias([]);
        setShowSuggestions(false);
        toast.error("Error al buscar proveedores");
      } finally {
        setLoading(false);
      }
    } else {
      setSugerencias([]);
      setShowSuggestions(false);
    }
  };

  // Buscar proveedores por nombre o número de identificación con debounce
  const handleBusqueda = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setBusqueda(valor);

    // Limpiar el timeout anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Crear nuevo timeout para ejecutar la búsqueda después de 500ms de pausa
    debounceRef.current = setTimeout(() => {
      buscarProveedores(valor);
    }, 500);
  };

  // Limpiar timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Seleccionar proveedor de la lista
  const seleccionarProveedor = (p: Supplier) => {
    setProveedor({
      letterIdentifier: p.letterIdentifier || "",
      numberIdentifier: p.numberIdentifier?.toString() || "",
      name: p.name || "",
      address: p.address || "",
      phone: p.phone || "",
      email: p.email || "",
      TotalBaseImponible: "",
      TotalIVA: "",
      TotalRetenido: ""
    });
    setProveedorId(p._id);
    setBusqueda("");
    setSugerencias([]);
    setShowSuggestions(false);
  };

  // Guardar nuevo proveedor
  const guardarNuevoProveedor = async () => {
    if (!proveedor.name || !proveedor.letterIdentifier || !proveedor.numberIdentifier) {
      toast.error("Por favor complete los campos obligatorios: Razón Social, Tipo y Número de Identificación");
      return;
    }

    setLoading(true);
    try {
      const result = await fetchApiJaihomV1({
        query: queries.createSupplier,
        variables: {
          args: [{
            letterIdentifier: proveedor.letterIdentifier,
            numberIdentifier: proveedor.numberIdentifier,
            name: proveedor.name,
            address: proveedor.address,
            phone: proveedor.phone,
            email: proveedor.email
          }]
        },
        type: "json"
      });

      if (result && result.results && result.results.length > 0) {
        const nuevoProveedor = result.results[0];
        setProveedorId(nuevoProveedor._id);
        toast.success("Proveedor guardado exitosamente");
      } else {
        toast.error("Error al guardar el proveedor");
      }
    } catch (error) {
      console.error("Error guardando proveedor:", error);
      toast.error("Error al guardar el proveedor");
    } finally {
      setLoading(false);
    }
  };

  // Guardar cambios en proveedor existente
  const guardarCambiosProveedor = async () => {
    if (!proveedorId) {
      toast.error("No hay un proveedor seleccionado para actualizar");
      return;
    }

    if (!proveedor.name || !proveedor.letterIdentifier || !proveedor.numberIdentifier) {
      toast.error("Por favor complete los campos obligatorios: Razón Social, Tipo y Número de Identificación");
      return;
    }

    setLoading(true);
    try {
      const result = await fetchApiJaihomV1({
        query: queries.updateSupplier,
        variables: {
          args: {
            _id: proveedorId,
            letterIdentifier: proveedor.letterIdentifier,
            numberIdentifier: proveedor.numberIdentifier,
            name: proveedor.name,
            address: proveedor.address,
            phone: proveedor.phone,
            email: proveedor.email
          }
        },
        type: "json"
      });

      if (result && result._id) {
        toast.success("Cambios guardados exitosamente");
      } else {
        toast.error("Error al actualizar el proveedor");
      }
    } catch (error) {
      console.error("Error actualizando proveedor:", error);
      toast.error("Error al actualizar el proveedor");
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear fecha en formato dd/mm/yyyy
  const formatearFecha = (fecha: string | Date) => {
    const date = new Date(fecha);
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    const año = date.getFullYear();
    return `${dia}/${mes}/${año}`;
  };

  // Función para formatear hora en formato HH:MM:SS am/pm
  const formatearHora = (fecha: Date = new Date()) => {
    const horas = fecha.getHours();
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    const segundos = fecha.getSeconds().toString().padStart(2, '0');
    const ampm = horas >= 12 ? 'pm' : 'am';
    const horas12 = horas % 12 || 12;
    const horasFormateadas = horas12.toString().padStart(2, '0');
    return `${horasFormateadas}:${minutos}:${segundos} ${ampm}`;
  };

  // Función para generar ZIP con JSONs
  const generarZip = async () => {
    try {
      // Obtener numeración continua del localStorage
      const lastNumber = localStorage.getItem('retencion_iva_counter') || '0';
      const nextNumber = parseInt(lastNumber) + 1;
      localStorage.setItem('retencion_iva_counter', nextNumber.toString());

      // Formatear fecha para el nombre del archivo
      const today = new Date();
      const yyyymmdd = today.getFullYear().toString() +
        (today.getMonth() + 1).toString().padStart(2, '0') +
        today.getDate().toString().padStart(2, '0');

      const fileName = `J402014171-${yyyymmdd}-${nextNumber.toString().padStart(3, '0')}.zip`;

      // Crear estructura base del JSON
      const baseJson = {
        "DocumentoElectronico": {
          "Encabezado": {
            "IdentificacionDocumento": {
              "TipoDocumento": "05",
              "NumeroDocumento": retencion.NumeroDocumento || "00002",
              "TipoProveedor": null,
              "TipoTransaccion": "01",
              "NumeroPlanillaImportacion": null,
              "NumeroExpedienteImportacion": null,
              "SerieFacturaAfectada": null,
              "NumeroFacturaAfectada": null,
              "FechaFacturaAfectada": null,
              "MontoFacturaAfectada": null,
              "ComentarioFacturaAfectada": null,
              "RegimenEspTributacion": null,
              "FechaEmision": retencion.FechaEmision ? formatearFecha(retencion.FechaEmision) : formatearFecha(new Date()),
              "FechaVencimiento": null,
              "HoraEmision": formatearHora(),
              "Anulado": false,
              "TipoDePago": "importado",
              "Serie": retencion.Serie || "",
              "Sucursal": "0000",
              "TipoDeVenta": "interna",
              "Moneda": "VES"
            },
            "Vendedor": null,
            "Comprador": null,
            "SujetoRetenido": {
              "TipoIdentificacion": proveedor.letterIdentifier || "V",
              "NumeroIdentificacion": proveedor.numberIdentifier || "26159207",
              "RazonSocial": proveedor.name || "Proveedor de Prueba",
              "Direccion": proveedor.address || "Av principal de prueba, donde estan los proveedores",
              "Pais": "VE",
              "Telefono": proveedor.phone ? [proveedor.phone] : ["02122447664"],
              "Correo": proveedor.email ? [proveedor.email] : ["jafetmontilla@gmail.com"]
            },
            "Totales": null,
            "TotalesRetencion": {
              "FechaEmisionCR": retencion.FechaEmision ? formatearFecha(retencion.FechaEmision) : formatearFecha(new Date()),
              "NumeroCompRetencion": retencion.NumeroDocumento || "00002",
              "TotalBaseImponible": "0.00",
              "TotalIVA": "0.00",
              "TotalRetenido": "0.00"
            }
          },
          "DetallesItems": null,
          "DetallesRetencion": [] as any[],
          "Viajes": null,
          "InfoAdicional": null,
          "GuiaDespacho": null
        }
      };

      // Calcular totales
      let totalBaseImponible = 0;
      let totalIVA = 0;
      let totalRetenido = 0;

      // Agregar cada factura como DetalleRetencion
      facturas.forEach((factura, index) => {
        const baseImponible = parseFloat(factura.BaseImponible) || 0;
        const montoIVA = parseFloat(factura.MontoIVA) || 0;
        const retenido = parseFloat(factura.Retenido) || 0;

        totalBaseImponible += baseImponible;
        totalIVA += montoIVA;
        totalRetenido += retenido;

        const detalleRetencion = {
          "NumeroLinea": (index + 1).toString(),
          "FechaDocumento": factura.FechaDocumento ? formatearFecha(factura.FechaDocumento) : formatearFecha(new Date()),
          "SerieDocumento": factura.SerieDocumento || "A",
          "TipoDocumento": "01",
          "NumeroDocumento": factura.NumeroDocumento || "000070",
          "NumeroControl": factura.NumeroControl || "00-000070",
          "TipoTransaccion": "01",
          "MontoTotal": factura.MontoTotal || "11.60",
          "MontoExento": factura.MontoExento || "0",
          "BaseImponible": factura.BaseImponible || "10.00",
          "PorcentajeIVA": factura.PorcentajeIVA || "16.00",
          "MontoIVA": factura.MontoIVA || "1.60",
          "Retenido": factura.Retenido || "100",
          "Porcentaje": factura.Porcentaje || "100",
          "RetenidoIVA": factura.Porcentaje || "100",
          "Percibido": factura.Retenido || "100",
          "Moneda": "VES",
          "InfoAdicionalItem": [
            {
              "Campo": "prueba pdf",
              "Valor": "resutado prueba"
            }
          ]
        };

        baseJson.DocumentoElectronico.DetallesRetencion.push(detalleRetencion);
      });

      // Actualizar totales
      baseJson.DocumentoElectronico.Encabezado.TotalesRetencion.TotalBaseImponible = totalBaseImponible.toFixed(2);
      baseJson.DocumentoElectronico.Encabezado.TotalesRetencion.TotalIVA = totalIVA.toFixed(2);
      baseJson.DocumentoElectronico.Encabezado.TotalesRetencion.TotalRetenido = totalRetenido.toFixed(2);

      // Crear archivo JSON
      const jsonContent = JSON.stringify(baseJson, null, 2);
      const jsonBlob = new Blob([jsonContent], { type: 'application/json' });

      // Crear y descargar el archivo JSON directamente
      const url = URL.createObjectURL(jsonBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.replace('.zip', '.json');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Archivo JSON generado exitosamente: ${fileName.replace('.zip', '.json')}`);
    } catch (error) {
      console.error("Error generando ZIP:", error);
      toast.error("Error al generar el archivo JSON");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Receipt className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold">Retenciones IVA</h1>
      </div>

      {/* Datos de Retención */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos de Retención</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serie">Serie</Label>
              <Input
                id="serie"
                value={retencion.Serie}
                onChange={(e) => setRetencion({ ...retencion, Serie: e.target.value })}
                placeholder="Ingrese la serie"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero">Número Documento</Label>
              <Input
                id="numero"
                value={retencion.NumeroDocumento}
                onChange={(e) => setRetencion({ ...retencion, NumeroDocumento: e.target.value })}
                placeholder="Ingrese el número"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha Emisión</Label>
              <Input
                id="fecha"
                type="date"
                value={retencion.FechaEmision}
                onChange={(e) => setRetencion({ ...retencion, FechaEmision: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos del Proveedor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos del Proveedor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Búsqueda de proveedor */}
          <div className="space-y-2">
            <Label htmlFor="busqueda">Buscar Proveedor</Label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  ref={inputRef}
                  id="busqueda"
                  value={busqueda}
                  onChange={handleBusqueda}
                  placeholder="Buscar por nombre o identificación..."
                  className="pl-10"
                  disabled={loading}
                />
                {loading && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin" />
                )}
              </div>

              {/* Sugerencias */}
              {showSuggestions && sugerencias.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {sugerencias.map((p) => (
                    <div
                      key={p._id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      onClick={() => seleccionarProveedor(p)}
                    >
                      <div className="font-medium">{p.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {p.letterIdentifier}-{p.numberIdentifier}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex space-x-2">
            <Button
              onClick={guardarNuevoProveedor}
              disabled={loading}
              variant="outline"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Guardar Nuevo
            </Button>
            {proveedorId && (
              <Button
                onClick={guardarCambiosProveedor}
                disabled={loading}
                variant="outline"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar Cambios
              </Button>
            )}
          </div>

          {/* Formulario del proveedor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipoIdentificacion">Tipo Identificación</Label>
              <Input
                id="tipoIdentificacion"
                value={proveedor.letterIdentifier}
                onChange={(e) => setProveedor({ ...proveedor, letterIdentifier: e.target.value })}
                placeholder="V, J, E, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numeroIdentificacion">Número Identificación</Label>
              <Input
                id="numeroIdentificacion"
                value={proveedor.numberIdentifier}
                onChange={(e) => setProveedor({ ...proveedor, numberIdentifier: e.target.value })}
                placeholder="Número de identificación"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="razonSocial">Razón Social</Label>
              <Input
                id="razonSocial"
                value={proveedor.name}
                onChange={(e) => setProveedor({ ...proveedor, name: e.target.value })}
                placeholder="Nombre o razón social del proveedor"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={proveedor.address}
                onChange={(e) => setProveedor({ ...proveedor, address: e.target.value })}
                placeholder="Dirección del proveedor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={proveedor.phone}
                onChange={(e) => setProveedor({ ...proveedor, phone: e.target.value })}
                placeholder="Número de teléfono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={proveedor.email}
                onChange={(e) => setProveedor({ ...proveedor, email: e.target.value })}
                placeholder="Correo electrónico"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos de Facturas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos de Facturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Fecha</th>
                  <th className="text-left p-2">Serie</th>
                  <th className="text-left p-2">No. Doc.</th>
                  <th className="text-left p-2">No. Control</th>
                  <th className="text-left p-2">Monto Total</th>
                  <th className="text-left p-2">Monto Exento</th>
                  <th className="text-left p-2">Base Imponible</th>
                  <th className="text-left p-2">% IVA</th>
                  <th className="text-left p-2">Monto IVA</th>
                  <th className="text-left p-2">% Ret</th>
                  <th className="text-left p-2">Monto Ret</th>
                  <th className="text-left p-2"></th>
                </tr>
              </thead>
              <tbody>
                {facturas.map((factura, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">
                      <Input
                        type="date"
                        value={factura.FechaDocumento}
                        onChange={(e) => {
                          const f = [...facturas];
                          f[idx].FechaDocumento = e.target.value;
                          setFacturas(f);
                        }}
                        className="w-32"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={factura.SerieDocumento}
                        onChange={(e) => {
                          const f = [...facturas];
                          f[idx].SerieDocumento = e.target.value;
                          setFacturas(f);
                        }}
                        className="w-20"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={factura.NumeroDocumento}
                        onChange={(e) => {
                          const f = [...facturas];
                          f[idx].NumeroDocumento = e.target.value;
                          setFacturas(f);
                        }}
                        className="w-24"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={factura.NumeroControl}
                        onChange={(e) => {
                          const f = [...facturas];
                          f[idx].NumeroControl = e.target.value;
                          setFacturas(f);
                        }}
                        className="w-24"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={factura.MontoTotal}
                        onChange={(e) => {
                          const f = [...facturas];
                          f[idx].MontoTotal = e.target.value;
                          setFacturas(f);
                        }}
                        className="w-24"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={factura.MontoExento}
                        onChange={(e) => {
                          const f = [...facturas];
                          f[idx].MontoExento = e.target.value;
                          setFacturas(f);
                        }}
                        className="w-24"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={factura.BaseImponible}
                        onChange={(e) => {
                          const f = [...facturas];
                          f[idx].BaseImponible = e.target.value;
                          setFacturas(f);
                          // Calcular montos automáticamente cuando cambia la base imponible
                          setTimeout(() => calcularMontos(f[idx], idx), 0);
                        }}
                        className="w-24"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={factura.PorcentajeIVA}
                        disabled
                        className="w-16 bg-muted"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={factura.MontoIVA}
                        disabled
                        className="w-24 bg-muted"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={factura.Porcentaje}
                        onChange={(e) => {
                          const f = [...facturas];
                          f[idx].Porcentaje = e.target.value;
                          setFacturas(f);
                          // Calcular montos automáticamente cuando cambia el porcentaje de retención
                          setTimeout(() => calcularMontos(f[idx], idx), 0);
                        }}
                        className="w-16"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={factura.Retenido}
                        disabled
                        className="w-24 bg-muted"
                      />
                    </td>
                    <td className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const f = [...facturas];
                          f.splice(idx, 1);
                          setFacturas(f);
                        }}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button
            onClick={() => setFacturas([
              ...facturas,
              {
                FechaDocumento: getToday(),
                SerieDocumento: "",
                NumeroDocumento: "",
                NumeroControl: "",
                MontoTotal: "",
                MontoExento: "",
                BaseImponible: "",
                PorcentajeIVA: "16",
                MontoIVA: "",
                Retenido: "",
                Porcentaje: "",
                RetenidoIVA: "",
                Percibido: ""
              }
            ])}
            className="mt-4"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Factura
          </Button>
        </CardContent>
      </Card>

      {/* Botón de generar ZIP */}
      <div className="flex justify-center">
        <Button
          onClick={generarZip}
          size="lg"
          className="px-8"
        >
          <Download className="w-5 h-5 mr-2" />
          Generar ZIP
        </Button>
      </div>
    </div>
  );
}
