// src/hooks/useConfirm.js
import { useState } from 'react';
import Modal from '../components/Modal';

export default function useConfirm() {
  const [state, setState] = useState({ isOpen: false, message: '', onConfirm: null });

  const confirm = (message) => new Promise((resolve) => {
    setState({ isOpen: true, message, onConfirm: () => { setState({ isOpen: false, message: '', onConfirm: null }); resolve(true); } });
  });

  const ConfirmModal = (
    <Modal isOpen={state.isOpen} onClose={() => { setState({ isOpen: false, message: '', onConfirm: null }); }} title="Подтверждение">
      <p className="text-wasteland-200 text-sm mb-4">{state.message}</p>
      <div className="flex gap-2">
        <button onClick={state.onConfirm} className="flex-1 bg-accent-orange text-wasteland-900 font-bold py-2 rounded text-sm">Да</button>
        <button onClick={() => { setState({ isOpen: false, message: '', onConfirm: null }); }} className="flex-1 bg-wasteland-600 text-wasteland-300 py-2 rounded text-sm">Нет</button>
      </div>
    </Modal>
  );

  return { confirm, ConfirmModal };
}
