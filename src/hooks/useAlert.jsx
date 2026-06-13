import { useState } from 'react';
import Modal from '../components/Modal';

export default function useAlert() {
  const [state, setState] = useState({ isOpen: false, message: '' });

  const alert = (message) => new Promise((resolve) => {
    setState({ isOpen: true, message });
  });

  const close = () => {
    setState({ isOpen: false, message: '' });
  };

  const AlertModal = (
    <Modal isOpen={state.isOpen} onClose={close} title="Внимание">
      <p className="text-wasteland-200 text-sm mb-4">{state.message}</p>
      <button onClick={close} className="w-full bg-accent-orange text-wasteland-900 font-bold py-2 rounded text-sm">ОК</button>
    </Modal>
  );

  return { alert, AlertModal };
}
