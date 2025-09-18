"use client";

import React, { useState, useEffect } from 'react';
import { fetchApiJaihomV1, queries } from '@/lib/Fetching';
import { UploadFile, FetchUploadFilesResults, TasaBCV, FetchTasaBCVResults } from '@/lib/types/payment-reports';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  Download,
  FileText,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

// Componente para el módulo de subida de archivos
const ModuloSubida = ({ onFileUpload, loading }: { onFileUpload: (file: File) => void; loading: boolean; }) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = () => {
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5" />
          <span>Subir Archivo Excel</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload">Seleccionar archivo Excel</Label>
          <Input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={loading}
          />
        </div>

        {file && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">{file.name}</span>
              <Badge variant="secondary">
                {(file.size / 1024).toFixed(1)} KB
              </Badge>
            </div>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Subir Archivo
            </>
          )}
        </Button>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Importante:</strong> Antes de subir el archivo Excel, debe cargar la tasa del BCV
            de los días en los que se pagaron las facturas. Si no, el sistema no generará el
            correspondiente archivo JSON para las facturas de ese día.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

// Componente para la lista de archivos ZIP
const ListFileZip = ({ filesZip, loading }: { filesZip: UploadFile[] | null; loading: boolean; }) => {
  const handleDownload = (file: UploadFile) => {
    // Aquí implementarías la lógica de descarga
    toast.success(`Descargando archivo: ${file.path}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Clock className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!filesZip || filesZip.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No hay archivos disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filesZip.map((file) => (
        <div
          key={file._id}
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <FileText className="w-4 h-4 text-primary" />
            <div>
              <p className="font-medium text-sm">{file.path}</p>
              <p className="text-xs text-muted-foreground">
                Lote: {file.lote} • {new Date(file.createdAt).toLocaleDateString('es-VE')}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload(file)}
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar
          </Button>
        </div>
      ))}
    </div>
  );
};

// Componente para gestionar tasas BCV
const TasasBCV = ({ tasasBCV, setTasasBCV, addTasa, setAddTasa }: { tasasBCV: TasaBCV[] | null; setTasasBCV: (tasas: TasaBCV[] | null) => void; addTasa: boolean; setAddTasa: (add: boolean) => void; }) => {
  const [fecha, setFecha] = useState('');
  const [tasa, setTasa] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddTasa = async () => {
    if (!fecha || !tasa) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    setLoading(true);
    try {
      const result = await fetchApiJaihomV1({
        query: queries.createTasaBCV,
        variables: {
          fecha: new Date(fecha).toISOString(),
          tasa: parseFloat(tasa)
        },
        type: "json"
      });

      if (result && result._id) {
        // Actualizar la lista de tasas
        const nuevaTasa = {
          _id: result._id,
          tasa: result.tasa,
          fecha: result.fecha,
          createdAt: result.createdAt
        };

        setTasasBCV(tasasBCV ? [nuevaTasa, ...tasasBCV] : [nuevaTasa]);
        setFecha('');
        setTasa('');
        setAddTasa(false);
        toast.success('Tasa BCV agregada exitosamente');
      }
    } catch (error) {
      console.error('Error agregando tasa BCV:', error);
      toast.error('Error al agregar la tasa BCV');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTasa = async (id: string) => {
    setLoading(true);
    try {
      await fetchApiJaihomV1({
        query: queries.deleteTasaBCV,
        variables: { _id: id },
        type: "json"
      });

      setTasasBCV(tasasBCV?.filter(t => t._id !== id) || null);
      toast.success('Tasa BCV eliminada exitosamente');
    } catch (error) {
      console.error('Error eliminando tasa BCV:', error);
      toast.error('Error al eliminar la tasa BCV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {addTasa && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fecha-tasa">Fecha</Label>
                <Input
                  id="fecha-tasa"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tasa-valor">Tasa</Label>
                <Input
                  id="tasa-valor"
                  type="number"
                  step="0.01"
                  value={tasa}
                  onChange={(e) => setTasa(e.target.value)}
                  placeholder="Ej: 17.50"
                  disabled={loading}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleAddTasa}
                  disabled={loading}
                  size="sm"
                >
                  {loading ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span className="ml-2">Agregar</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAddTasa(false)}
                  disabled={loading}
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {tasasBCV?.map((tasa) => (
          <div
            key={tasa._id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <DollarSign className="w-4 h-4 text-green-600" />
              <div>
                <p className="font-medium text-sm">
                  {tasa.tasa.toFixed(2)} Bs
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(tasa.fecha).toLocaleDateString('es-VE')}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteTasa(tasa._id)}
              disabled={loading}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )) || (
            <div className="text-center text-muted-foreground py-4">
              <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay tasas BCV registradas</p>
            </div>
          )}
      </div>
    </div>
  );
};

export default function TheFactoryPage() {
  const [filesZip, setFilesZip] = useState<UploadFile[] | null>(null);
  const [tasasBCV, setTasasBCV] = useState<TasaBCV[] | null>(null);
  const [addTasa, setAddTasa] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingTasas, setLoadingTasas] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Cargar archivos subidos
  const loadFiles = async () => {
    setLoadingFiles(true);
    try {
      const result: FetchUploadFilesResults = await fetchApiJaihomV1({
        query: queries.getUploadFiles,
        variables: {
          limit: 7,
          skip: 0,
          sort: { createdAt: -1 }
        },
      });
      setFilesZip(result?.results || []);
    } catch (error) {
      console.error('Error cargando archivos:', error);
      toast.error('Error al cargar los archivos');
    } finally {
      setLoadingFiles(false);
    }
  };

  // Cargar tasas BCV
  const loadTasasBCV = async () => {
    setLoadingTasas(true);
    try {
      const result: FetchTasaBCVResults = await fetchApiJaihomV1({
        query: queries.getTasaBCV,
        variables: {
          limit: 0,
          skip: 0,
          sort: { fecha: -1 }
        },
      });
      setTasasBCV(result?.results || []);
    } catch (error) {
      console.error('Error cargando tasas BCV:', error);
      toast.error('Error al cargar las tasas BCV');
    } finally {
      setLoadingTasas(false);
    }
  };

  // Manejar subida de archivo
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await fetchApiJaihomV1({
        query: queries.fileUpload,
        variables: {
          file,
          args: JSON.stringify({ monto: 17.5 })
        },
        type: "formData"
      });

      if (result && result._id) {
        toast.success('Archivo subido exitosamente');
        // Recargar la lista de archivos
        await loadFiles();
      }
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      toast.error('Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadFiles();
    loadTasasBCV();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <FileText className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold">The Factory</h1>
      </div>


      <div className="flex items-center justify-end pr-10">
        <div className="flex flex-col items-center w-[300px]">
          <div className="flex items-center gap-4">
            <Calendar className="w-4 h-4" />
            <span className="first-letter:uppercase">
              {new Date().toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Tasa del Dia {tasasBCV?.find(t => t.fecha === new Date().toISOString())?.tasa.toFixed(2)} Bs</span>
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
      </div>


      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Módulo de subida */}
        <div className="lg:col-span-1">
          <ModuloSubida
            onFileUpload={handleFileUpload}
            loading={uploading}
          />
        </div>

        {/* Lista de archivos ZIP */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>Descargar Archivos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ListFileZip
                filesZip={filesZip}
                loading={loadingFiles}
              />
            </CardContent>
          </Card>
        </div>

        {/* Gestión de tasas BCV */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Tasa Diaria BCV</span>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddTasa(!addTasa)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <TasasBCV
                tasasBCV={tasasBCV}
                setTasasBCV={setTasasBCV}
                addTasa={addTasa}
                setAddTasa={setAddTasa}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
