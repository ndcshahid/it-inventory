import { X } from 'lucide-react';

interface SimpleModalProps {
  title: string;
  onClose: () => void;
  onSave: () => void;
  children: React.ReactNode;
  saveLabel?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SimpleModal({ title, onClose, onSave, children, saveLabel = 'Save', size = 'md' }: SimpleModalProps) {
  const sizeClass = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-md';
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content w-full ${sizeClass}`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onSave} className="btn-primary">{saveLabel}</button>
        </div>
      </div>
    </div>
  );
}
