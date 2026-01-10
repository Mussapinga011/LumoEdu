import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp } from '../services/authService.supabase';
import { checkDisplayNameExists } from '../services/dbService.supabase';
import { useAuthStore } from '../stores/useAuthStore';
import { getErrorMessage } from '../utils/errorMessages';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const [isCheckingName, setIsCheckingName] = useState(false);
  const navigate = useNavigate();
  const { setLoading } = useAuthStore();

  // Validate name uniqueness in real-time
  const handleNameChange = async (value: string) => {
    setName(value);
    setNameError('');

    // Only validate if name has at least 3 characters
    if (value.length >= 3) {
      setIsCheckingName(true);
      try {
        const exists = await checkDisplayNameExists(value);
        if (exists) {
          setNameError('Este nome já está em uso. Por favor, escolha outro nome.');
        }
      } catch (err) {
        console.error('Error checking name:', err);
      } finally {
        setIsCheckingName(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate name before submission
    if (name.length < 3) {
      setError('O nome deve ter pelo menos 3 caracteres');
      return;
    }

    if (nameError) {
      setError('Por favor, escolha um nome diferente');
      return;
    }

    setLoading(true);
    try {
      await signUp({ email, password, displayName: name });
      navigate('/learning');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden mb-4 border-2 border-blue-100">
             <img src="/lumo_mascot.png" alt="Mascote LumoEdu" className="w-4/5 h-4/5 object-contain" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 text-center">Junte-se ao LumoEdu</h2>
          <p className="text-gray-500 text-center">Comece sua jornada rumo à vaga dos sonhos</p>
        </div>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 ${
                nameError 
                  ? 'border-red-500 focus:ring-red-500' 
                  : name.length >= 3 && !isCheckingName
                  ? 'border-green-500 focus:ring-green-500'
                  : 'border-gray-300 focus:ring-primary'
              }`}
              placeholder="Escolha um nome único"
              minLength={3}
              required
            />
            {isCheckingName && (
              <p className="text-sm text-gray-500 mt-1">Verificando disponibilidade...</p>
            )}
            {nameError && (
              <p className="text-sm text-red-600 mt-1">{nameError}</p>
            )}
            {name.length >= 3 && !nameError && !isCheckingName && (
              <p className="text-sm text-green-600 mt-1">✓ Nome disponível</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl transition-colors shadow-[0_4px_0_0_#58a700] active:shadow-none active:translate-y-[4px]"
          >
            CRIAR CONTA
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
