'use client';

import { useState, useRef } from 'react';
import { Button } from './Button';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';
import { useApiRequest } from '@/lib/hooks/useApiRequest';

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ row: number; field: string; error: string }>;
}

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  title: string;
  apiEndpoint: string;
  csvTemplate: string;
  requiredFields: string[];
  optionalFields?: string[];
  fieldDescriptions?: Record<string, string>;
}

export function ImportModal({
  isOpen,
  onClose,
  onImportComplete,
  title,
  apiEndpoint,
  csvTemplate,
  requiredFields,
  optionalFields = [],
  fieldDescriptions = {},
}: ImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { request: importRequest } = useApiRequest();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const result = await importRequest(apiEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (result) {
        setImportResult(result);
        onImportComplete();
      }
    } catch (error) {
      console.error('Error importing data:', error);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_import_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalHeader>
        Import {title}
      </ModalHeader>
      <ModalBody>
        {importResult ? (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-green-600 mb-2">Import Completed!</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{importResult.total}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{importResult.successful}</div>
                    <div className="text-sm text-gray-600">Successful</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>
              </div>
              {importResult.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-red-600 mb-2">Errors:</h4>
                  <div className="max-h-40 overflow-y-auto bg-red-50 p-3 rounded text-sm">
                    {importResult.errors.map((error, index) => (
                      <div key={index} className="mb-1">
                        Row {error.row}: {error.field} - {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Upload a CSV file to import {title.toLowerCase()}. The file must contain the required fields.
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-file"
                />
                <label htmlFor="csv-file" className="cursor-pointer">
                  <div className="text-gray-600">
                    {selectedFile ? (
                      <div>
                        <div className="font-medium">{selectedFile.name}</div>
                        <div className="text-sm">({(selectedFile.size / 1024).toFixed(1)} KB)</div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-lg mb-2">📄</div>
                        <div>Click to select CSV file</div>
                        <div className="text-sm">or drag and drop</div>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">CSV Format Requirements:</h4>
              <div className="text-sm text-blue-700 space-y-2">
                <div>
                  <strong>Required fields:</strong> {requiredFields.join(', ')}
                </div>
                {optionalFields.length > 0 && (
                  <div>
                    <strong>Optional fields:</strong> {optionalFields.join(', ')}
                  </div>
                )}
                {Object.keys(fieldDescriptions).length > 0 && (
                  <div>
                    <strong>Field descriptions:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {Object.entries(fieldDescriptions).map(([field, description]) => (
                        <li key={field}>
                          <code>{field}</code>: {description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="mt-2"
              >
                Download Template
              </Button>
            </div>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        {importResult ? (
          <Button onClick={handleClose}>
            Close
          </Button>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || importing}
            >
              {importing ? 'Importing...' : `Import ${title}`}
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}