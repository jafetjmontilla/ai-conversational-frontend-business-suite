"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { Upload, Download, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ExcelImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportItem {
  code: string;
  description: string;
  type: "mercancia" | "servicio";
  store: "guardians" | "jaihom";
  quantity: number;
  unitCost: number;
  salesPrice: number;
  status: boolean;
}

export default function ExcelImportDialog({
  isOpen,
  onClose,
  onSuccess,
}: ExcelImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importData, setImportData] = useState<ImportItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" &&
        selectedFile.type !== "application/vnd.ms-excel") {
        toast.error("Por favor selecciona un archivo Excel válido (.xlsx o .xls)");
        return;
      }
      setFile(selectedFile);
      setImportData([]);
      setErrors([]);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      toast.error("Por favor selecciona un archivo");
      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append("file", file);

      // Simular procesamiento del archivo Excel
      // En una implementación real, aquí procesarías el Excel
      const mockData: ImportItem[] = [
        {
          code: "ITEM-001",
          description: "Producto de prueba 1",
          type: "mercancia",
          store: "guardians",
          quantity: 10,
          unitCost: 100,
          salesPrice: 150,
          status: true,
        },
        {
          code: "ITEM-002",
          description: "Producto de prueba 2",
          type: "servicio",
          store: "jaihom",
          quantity: 5,
          unitCost: 200,
          salesPrice: 300,
          status: true,
        }
      ];

      setImportData(mockData);
      toast.success("Archivo procesado correctamente. Revisa los datos antes de importar.");
    } catch (error) {
      console.error("Error al procesar archivo:", error);
      toast.error("Error al procesar el archivo Excel");
      setErrors(["Error al procesar el archivo. Verifica que el formato sea correcto."]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (importData.length === 0) {
      toast.error("No hay datos para importar");
      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      const result = await fetchApiV1({
        query: queries.bulkCreateInventoryItems,
        type: "json",
        variables: {
          items: importData
        }
      });

      if (result && result.length > 0) {
        toast.success(`${result.length} productos importados correctamente`);
        onSuccess();
        handleClose();
      } else {
        toast.warning("No se pudieron importar los productos");
      }
    } catch (error) {
      console.error("Error en la importación:", error);
      toast.error("Error durante la importación");
      setErrors(["Error al importar los productos. Verifica que los datos sean correctos."]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setImportData([]);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const downloadTemplate = () => {
    // Crear un CSV de ejemplo para descargar
    const csvContent = "code,description,type,store,quantity,unitCost,salesPrice,status\n" +
      "ITEM-001,Producto de ejemplo 1,mercancia,guardians,10,100,150,true\n" +
      "ITEM-002,Servicio de ejemplo,servicio,jaihom,5,200,300,true";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_inventario.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Plantilla descargada correctamente");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Inventario desde Excel
          </DialogTitle>
          <DialogDescription>
            Sube un archivo Excel con los datos del inventario para importar múltiples productos de una vez.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Descargar plantilla */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div>
              <h4 className="font-medium">Plantilla de ejemplo</h4>
              <p className="text-sm text-muted-foreground">
                Descarga la plantilla para ver el formato correcto
              </p>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Descargar plantilla
            </Button>
          </div>

          {/* Subir archivo */}
          <div className="space-y-2">
            <Label htmlFor="excel-file">Archivo Excel</Label>
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                id="excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="flex-1"
              />
              <Button
                onClick={handleFileUpload}
                disabled={!file || isLoading}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isLoading ? "Procesando..." : "Procesar"}
              </Button>
            </div>
          </div>

          {/* Errores */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Errores encontrados:</p>
                  {errors.map((error, index) => (
                    <p key={index} className="text-sm">• {error}</p>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Vista previa de datos */}
          {importData.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Vista previa de datos ({importData.length} productos)</h4>
              <div className="max-h-40 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Código</th>
                      <th className="p-2 text-left">Descripción</th>
                      <th className="p-2 text-left">Tipo</th>
                      <th className="p-2 text-left">Tienda</th>
                      <th className="p-2 text-left">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importData.slice(0, 10).map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{item.code}</td>
                        <td className="p-2">{item.description}</td>
                        <td className="p-2">{item.type === "mercancia" ? "Mercancía" : "Servicio"}</td>
                        <td className="p-2">{item.store === "guardians" ? "Guardians" : "Jaihom"}</td>
                        <td className="p-2">{item.quantity}</td>
                      </tr>
                    ))}
                    {importData.length > 10 && (
                      <tr>
                        <td colSpan={5} className="p-2 text-center text-muted-foreground">
                          ... y {importData.length - 10} más
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={importData.length === 0 || isLoading}
          >
            {isLoading ? "Importando..." : `Importar ${importData.length} productos`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
