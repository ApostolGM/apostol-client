// pages/Register.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../api/auth.js';

export default function Register({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await auth.register(username, password);
      localStorage.setItem('token', data.token);
      setUser(data.user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-wasteland-900">
      <div className="bg-wasteland-800 p-8 rounded-lg border border-wasteland-600 w-full max-w-md">
        <h1 className="text-2xl font-stylized text-center mb-6 text-accent-orange">APOSTOL 2.0</h1>
        <h2 className="text-lg text-center mb-4 text-wasteland-300">Регистрация</h2>
        {error && <p className="text-accent-red text-sm mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 placeholder-wasteland-500" placeholder="Логин" value={username} onChange={e => setUsername(e.target.value)} required />
          <input type="password" className="w-full bg-wasteland-900 border border-wasteland-600 rounded p-2 text-wasteland-100 placeholder-wasteland-500" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required />
          <button className="w-full bg-accent-orange text-wasteland-900 font-bold py-2 rounded hover:bg-orange-500 transition">Создать аккаунт</button>
        </form>
        <p className="text-center mt-4 text-wasteland-400 text-sm">
          Уже есть аккаунт? <Link to="/login" className="text-accent-orange hover:underline">Войти</Link>
        </p>
      </div>
    </div>
  );
}
