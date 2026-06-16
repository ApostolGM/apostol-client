// components/ui/Modal.jsx

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-wasteland-800 border border-wasteland-600 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {title && (
          <div className="flex justify-between items-center p-3 border-b border-wasteland-600">
            <h3 className="text-accent-orange font-bold text-sm">{title}</h3>
            <button onClick={onClose} className="text-wasteland-400 hover:text-wasteland-200">✕</button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
