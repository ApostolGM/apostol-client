// pages/campaign/ChatSection.jsx
import { useRef, useEffect } from 'react';

export default function ChatSection({ messages, input, setInput, onSend, onKeyDown }) {
  const chatRef = useRef(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.length === 0 && (
          <p className="text-wasteland-500 text-center mt-8 text-sm">Чат пуст. /r 2d10 + 3 для броска</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`text-sm ${m.isRoll ? 'bg-wasteland-800/50 p-1.5 rounded border border-wasteland-700' : ''}`}>
            <span className="text-wasteland-500 text-xs">{m.time}</span>{' '}
            <span className={`font-bold ${
              m.user === 'Система' ? 'text-accent-yellow' :
              m.user?.includes('Скрытый') ? 'text-accent-red' :
              'text-accent-orange'
            }`}>{m.user}:</span>{' '}
            <span className="text-wasteland-200">{m.text}</span>
          </div>
        ))}
      </div>
      <form onSubmit={onSend} onKeyDown={onKeyDown} className="p-2 bg-wasteland-800 border-t border-wasteland-600 flex gap-2 flex-shrink-0">
        <input
          className="flex-1 bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 placeholder-wasteland-500 text-sm"
          placeholder="Сообщение или /r 2d10 + 3"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button type="submit" className="bg-wasteland-600 text-wasteland-100 px-3 py-2 rounded text-sm hover:bg-wasteland-500 transition flex-shrink-0">→</button>
      </form>
    </div>
  );
}
