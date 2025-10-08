"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { Upload, Download, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTasaBCV } from "@/hooks/useTasaBCV";
import * as XLSX from "xlsx";

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

export default function ExcelImportDialog({ isOpen, onClose, onSuccess }: ExcelImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importData, setImportData] = useState<ImportItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { tasaBCV } = useTasaBCV();

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
    console.log("handleFileUpload");
    if (!file) {
      toast.error("Por favor selecciona un archivo");
      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      // Leer el archivo Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });

      // Obtener la primera hoja
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convertir a JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (jsonData.length === 0) {
        toast.error("El archivo está vacío");
        setErrors(["El archivo no contiene datos"]);
        return;
      }

      // Validar y transformar los datos
      const validationErrors: string[] = [];
      const processedData: ImportItem[] = [];
      console.log("jsonData", jsonData);

      jsonData.forEach((row, index) => {
        const rowNumber = index + 2; // +2 porque la fila 1 es el encabezado

        // Validar campos requeridos
        if (!row.code) {
          validationErrors.push(`Fila ${rowNumber}: Falta el código`);
          return;
        }
        if (!row.description) {
          validationErrors.push(`Fila ${rowNumber}: Falta la descripción`);
          return;
        }
        if (!row.type || (row.type !== "mercancia" && row.type !== "servicio")) {
          validationErrors.push(`Fila ${rowNumber}: Tipo inválido (debe ser "mercancia" o "servicio")`);
          return;
        }
        if (!row.store || (row.store !== "guardians" && row.store !== "jaihom")) {
          validationErrors.push(`Fila ${rowNumber}: Tienda inválida (debe ser "guardians" o "jaihom")`);
          return;
        }

        // Validar y convertir números
        const quantity = Number(row.quantity);
        const unitCost = Number(row.unitCost);
        const salesPrice = Number(row.salesPrice);

        if (isNaN(quantity) || quantity < 0) {
          validationErrors.push(`Fila ${rowNumber}: Cantidad inválida`);
          return;
        }
        if (isNaN(unitCost) || unitCost < 0) {
          validationErrors.push(`Fila ${rowNumber}: Costo unitario inválido`);
          return;
        }
        if (isNaN(salesPrice) || salesPrice < 0) {
          validationErrors.push(`Fila ${rowNumber}: Precio de venta inválido`);
          return;
        }

        // Convertir status a boolean
        const status = row.status === true || row.status === "true" || row.status === 1 || row.status === "1";

        processedData.push({
          code: String(row.code).trim(),
          description: String(row.description).trim(),
          type: row.type,
          store: row.store,
          quantity,
          unitCost,
          salesPrice,
          status,
        });
      });

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        toast.error(`Se encontraron ${validationErrors.length} errores de validación`);
        return;
      }

      if (processedData.length === 0) {
        toast.error("No se pudieron procesar los datos");
        setErrors(["No hay datos válidos para importar"]);
        return;
      }

      setImportData(processedData);
      toast.success(`${processedData.length} productos listos para importar`);
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
          items: importData,
          tasaBCV: tasaBCV?.tasa || 0
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
    // Crear datos de ejemplo
    const templateData = [
      {
        code: "ITEM-001",
        description: "Producto de ejemplo 1",
        type: "mercancia",
        store: "guardians",
        quantity: 10,
        unitCost: 100,
        salesPrice: 150,
        status: true,
      },
      {
        code: "ITEM-002",
        description: "Servicio de ejemplo",
        type: "servicio",
        store: "jaihom",
        quantity: 5,
        unitCost: 200,
        salesPrice: 300,
        status: true,
      }
    ];

    // Crear un libro de Excel
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");

    // Descargar el archivo
    XLSX.writeFile(workbook, "plantilla_inventario.xlsx");

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
