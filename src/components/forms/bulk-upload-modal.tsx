'use client';
import { useRef, useState } from 'react';
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface BulkUploadModalProps {
  onClose: () => void;
  onSave: () => void;
}

const TEMPLATE_HEADERS = [
  'assetName', 'assetTag', 'serialNumber', 'brand', 'model',
  'categoryName', 'locationName', 'condition', 'status',
  'purchaseDate', 'purchasePrice', 'warrantyExpiry', 'supplierName', 'notes',
];

const SAMPLE_ROW = [
  'Dell Laptop', 'TAG-001', 'SN-ABC123', 'Dell', 'Latitude 5520',
  'Laptops', 'Head Office', 'GOOD', 'AVAILABLE',
  '2024-01-15', '1200', '2027-01-15', 'Dell Inc.', 'IT dept use',
];

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, SAMPLE_ROW]);
  // Column widths
  ws['!cols'] = TEMPLATE_HEADERS.map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Assets');
  XLSX.writeFile(wb, 'asset-import-template.xlsx');
}

export function BulkUploadModal({ onClose, onSave }: BulkUploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<number | null>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setErrors([]);
    setSuccess(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setErrors([]);
    setSuccess(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/assets/bulk', { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok) {
        setErrors(d.errors || [d.error || 'Upload failed']);
        return;
      }
      setSuccess(d.inserted);
      toast.success(`${d.inserted} asset(s) imported successfully!`);
      onSave();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content w-full max-w-lg" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Bulk Import Assets</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Template download */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div>
              <p className="text-sm font-medium text-blue-800">Download Template</p>
              <p className="text-xs text-blue-600 mt-0.5">Fill in the Excel template then upload below</p>
            </div>
            <button onClick={downloadTemplate} className="btn-secondary text-xs flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Template
            </button>
          </div>

          {/* Required columns hint */}
          <div className="text-xs text-gray-500 space-y-1">
            <p><span className="font-medium text-gray-700">Required:</span> assetName, assetTag, serialNumber</p>
            <p><span className="font-medium text-gray-700">Condition:</span> NEW / GOOD / FAIR / POOR</p>
            <p><span className="font-medium text-gray-700">Status:</span> AVAILABLE / ISSUED / UNDER_REPAIR / DAMAGED / LOST / RETIRED</p>
            <p><span className="font-medium text-gray-700">categoryName / locationName</span> must match existing names exactly</p>
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-green-600" />
                <span className="text-sm font-medium text-gray-700">{file.name}</span>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Drop your Excel file here or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">.xlsx, .xls, .csv</p>
              </>
            )}
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 max-h-48 overflow-y-auto space-y-1">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <p className="text-sm font-medium text-red-700">{errors.length} error(s) found — fix and re-upload</p>
              </div>
              {errors.map((e, i) => (
                <p key={i} className="text-xs text-red-600 pl-5">{e}</p>
              ))}
            </div>
          )}

          {/* Success */}
          {success !== null && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-700 font-medium">{success} asset(s) imported successfully!</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Import Assets'}
          </button>
        </div>
      </div>
    </div>
  );
}
