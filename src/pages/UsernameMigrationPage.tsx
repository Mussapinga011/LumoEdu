import { useState } from 'react';
import { migrateUsersToUsername, checkMigrationStatus } from '../services/migrationService';

/**
 * Página de Migração de Usernames
 * 
 * Esta página permite que administradores:
 * 1. Verifiquem o status da migração
 * 2. Executem a migração de usernames para usuários existentes
 * 
 * ATENÇÃO: Esta página deve ser acessível apenas por administradores
 */
const UsernameMigrationPage = () => {
  const [status, setStatus] = useState<any>(null);
  const [migrationResults, setMigrationResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckStatus = async () => {
    setIsLoading(true);
    setError('');
    try {
      const statusData = await checkMigrationStatus();
      setStatus(statusData);
    } catch (err: any) {
      setError(err.message || 'Erro ao verificar status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigrate = async () => {
    if (!window.confirm('Tem certeza que deseja executar a migração? Esta ação não pode ser desfeita.')) {
      return;
    }

    setIsLoading(true);
    setError('');
    setMigrationResults(null);
    
    try {
      const results = await migrateUsersToUsername();
      setMigrationResults(results);
      
      // Atualizar status após migração
      const statusData = await checkMigrationStatus();
      setStatus(statusData);
    } catch (err: any) {
      setError(err.message || 'Erro durante migração');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            🔧 Migração de Usernames
          </h1>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>ATENÇÃO:</strong> Esta ferramenta deve ser usada apenas UMA VEZ para migrar usuários existentes.
                  Execute a migração apenas se você tiver usuários sem username no banco de dados.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={handleCheckStatus}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verificando...' : '📊 Verificar Status'}
            </button>

            <button
              onClick={handleMigrate}
              disabled={isLoading || (status && status.withoutUsername === 0)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Migrando...' : '🚀 Executar Migração'}
            </button>
          </div>

          {/* Status da Migração */}
          {status && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Status Atual</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Total de Usuários</div>
                  <div className="text-2xl font-bold text-gray-800">{status.total}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Com Username</div>
                  <div className="text-2xl font-bold text-green-600">{status.withUsername}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Sem Username</div>
                  <div className="text-2xl font-bold text-red-600">{status.withoutUsername}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Progresso</div>
                  <div className="text-2xl font-bold text-blue-600">{status.percentage}%</div>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-green-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${status.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Resultados da Migração */}
          {migrationResults && (
            <div className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">✅ Resultados da Migração</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-green-100 p-4 rounded-lg">
                  <div className="text-sm text-green-700">Sucesso</div>
                  <div className="text-3xl font-bold text-green-800">{migrationResults.success}</div>
                </div>
                <div className="bg-red-100 p-4 rounded-lg">
                  <div className="text-sm text-red-700">Falhas</div>
                  <div className="text-3xl font-bold text-red-800">{migrationResults.failed}</div>
                </div>
              </div>

              {migrationResults.errors.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-bold text-gray-800 mb-2">❌ Erros Encontrados:</h3>
                  <div className="bg-white rounded-lg p-4 max-h-60 overflow-y-auto">
                    {migrationResults.errors.map((err: any, index: number) => (
                      <div key={index} className="mb-2 pb-2 border-b border-gray-200 last:border-0">
                        <div className="text-sm font-mono text-gray-600">UID: {err.uid}</div>
                        <div className="text-sm text-red-600">{err.error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {migrationResults.success > 0 && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800">
                    ✅ Migração concluída com sucesso! {migrationResults.success} usuário(s) atualizado(s).
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Instruções */}
          <div className="mt-8 bg-blue-50 rounded-xl p-6">
            <h2 className="text-xl font-bold text-blue-800 mb-4">📖 Instruções</h2>
            <ol className="list-decimal list-inside space-y-2 text-blue-900">
              <li>Clique em "Verificar Status" para ver quantos usuários precisam de username</li>
              <li>Se houver usuários sem username, clique em "Executar Migração"</li>
              <li>A migração irá gerar usernames únicos baseados no email ou nome de cada usuário</li>
              <li>Após a migração, verifique o status novamente para confirmar</li>
              <li>Esta operação só precisa ser executada uma vez</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsernameMigrationPage;
