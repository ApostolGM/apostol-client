import { useState } from 'react';
import Modal from '../components/Modal';

export default function usePrompt() {
  const [state, setState] = useState({ isOpen: false, title: '', defaultValue: '', onConfirm: null });
  const [inputValue, setInputValue] = useState('');

  const prompt = (title, defaultValue = '') => new Promise((resolve) => {
    setInputValue(defaultValue);
    setState({
      isOpen: true,
      title,
      defaultValue,
      onConfirm: () => {
        setState({ isOpen: false, title: '', defaultValue: '', onConfirm: null });
        resolve(inputValue);
      }
    });
  });

  const handleCancel = () => {
    setState({ isOpen: false, title: '', defaultValue: '', onConfirm: null });
  };

  const PromptModal = (
    <Modal isOpen={state.isOpen} onClose={handleCancel} title={state.title}>
      <input
        className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 text-sm mb-4"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        autoFocus
        onKeyDown={e => { if (e.key === 'Enter') state.onConfirm?.(); }}
      />
      <div className="flex gap-2">
        <button onClick={state.onConfirm} className="flex-1 bg-accent-orange text-wasteland-900 font-bold py-2 rounded text-sm">OK</button>
        <button onClick={handleCancel} className="flex-1 bg-wasteland-600 text-wasteland-300 py-2 rounded text-sm">Отмена</button>
      </div>
    </Modal>
  );

  return { prompt, PromptModal };
}
