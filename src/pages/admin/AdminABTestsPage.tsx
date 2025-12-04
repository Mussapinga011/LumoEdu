import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAllTests, 
  activateTest, 
  pauseTest, 
  completeTest,
  calculateConversionRate,
  getTestWinner
} from '../../services/abTestService';
import { ABTest } from '../../types/abTest';
import { Play, Pause, CheckCircle, Edit, Trash2, Plus, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

const AdminABTestsPage = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    setLoading(true);
    const allTests = await getAllTests();
    setTests(allTests);
    setLoading(false);
  };

  const handleActivate = async (testId: string) => {
    if (confirm('Ativar este teste? Isso irá pausar outros testes na mesma localização.')) {
      await activateTest(testId);
      fetchTests();
    }
  };

  const handlePause = async (testId: string) => {
    if (confirm('Pausar este teste?')) {
      await pauseTest(testId);
      fetchTests();
    }
  };

  const handleComplete = async (testId: string) => {
    if (confirm('Completar este teste? Isso irá finalizá-lo permanentemente.')) {
      await completeTest(testId);
      fetchTests();
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700',
      active: 'bg-green-100 text-green-700',
      paused: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-blue-100 text-blue-700'
    };

    const labels = {
      draft: 'Rascunho',
      active: 'Ativo',
      paused: 'Pausado',
      completed: 'Concluído'
    };

    return (
      <span className={clsx('px-3 py-1 rounded-full text-xs font-bold', styles[status as keyof typeof styles])}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getLocationLabel = (location: string) => {
    const labels = {
      challenge_limit_screen: 'Tela de Limite - Challenge',
      study_blocked_screen: 'Tela Bloqueada - Estudo',
      profile_premium_banner: 'Banner Premium - Perfil',
      disciplines_page_banner: 'Banner - Disciplinas'
    };
    return labels[location as keyof typeof labels] || location;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Testes A/B</h1>
          <p className="text-gray-500 mt-1">Gerencie experimentos de conversão</p>
        </div>
        <button
          onClick={() => navigate('/admin/ab-tests/new')}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors"
        >
          <Plus size={20} />
          Criar Novo Teste
        </button>
      </div>

      {/* Tests List */}
      {tests.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <TrendingUp size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">Nenhum teste criado</h3>
          <p className="text-gray-500 mb-6">Crie seu primeiro teste A/B para otimizar conversões</p>
          <button
            onClick={() => navigate('/admin/ab-tests/new')}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors"
          >
            Criar Primeiro Teste
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => {
            const winner = getTestWinner(test);
            const rateA = calculateConversionRate(test.results.variantA.views, test.results.variantA.conversions);
            const rateB = calculateConversionRate(test.results.variantB.views, test.results.variantB.conversions);

            return (
              <div key={test.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                {/* Test Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{test.name}</h3>
                      {getStatusBadge(test.status)}
                    </div>
                    <p className="text-sm text-gray-500">{getLocationLabel(test.location)}</p>
                    {test.description && (
                      <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {test.status === 'draft' && (
                      <button
                        onClick={() => handleActivate(test.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Ativar"
                      >
                        <Play size={20} />
                      </button>
                    )}
                    {test.status === 'active' && (
                      <>
                        <button
                          onClick={() => handlePause(test.id)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Pausar"
                        >
                          <Pause size={20} />
                        </button>
                        <button
                          onClick={() => handleComplete(test.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Completar"
                        >
                          <CheckCircle size={20} />
                        </button>
                      </>
                    )}
                    {test.status === 'paused' && (
                      <button
                        onClick={() => handleActivate(test.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Reativar"
                      >
                        <Play size={20} />
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/admin/ab-tests/edit/${test.id}`)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit size={20} />
                    </button>
                  </div>
                </div>

                {/* Results */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {/* Variant A */}
                  <div className={clsx(
                    'border-2 rounded-xl p-4',
                    winner === 'A' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  )}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-700">Versão A</h4>
                      {winner === 'A' && (
                        <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                          🏆 VENCEDOR
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{test.variantA.title}</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{test.results.variantA.views}</div>
                        <div className="text-xs text-gray-500">Views</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">{test.results.variantA.clicks}</div>
                        <div className="text-xs text-gray-500">Cliques</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{test.results.variantA.conversions}</div>
                        <div className="text-xs text-gray-500">Conversões</div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-center">
                        <div className="text-xl font-bold text-purple-600">{rateA.toFixed(2)}%</div>
                        <div className="text-xs text-gray-500">Taxa de Conversão</div>
                      </div>
                    </div>
                  </div>

                  {/* Variant B */}
                  <div className={clsx(
                    'border-2 rounded-xl p-4',
                    winner === 'B' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  )}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-700">Versão B</h4>
                      {winner === 'B' && (
                        <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                          🏆 VENCEDOR
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{test.variantB.title}</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{test.results.variantB.views}</div>
                        <div className="text-xs text-gray-500">Views</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">{test.results.variantB.clicks}</div>
                        <div className="text-xs text-gray-500">Cliques</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{test.results.variantB.conversions}</div>
                        <div className="text-xs text-gray-500">Conversões</div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-center">
                        <div className="text-xl font-bold text-purple-600">{rateB.toFixed(2)}%</div>
                        <div className="text-xs text-gray-500">Taxa de Conversão</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Winner Message */}
                {winner === 'insufficient_data' && test.status === 'active' && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                    <p className="text-sm text-yellow-700">
                      ⚠️ Dados insuficientes. Precisa de pelo menos 100 visualizações em cada variante.
                    </p>
                  </div>
                )}
                {winner === 'tie' && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <p className="text-sm text-blue-700">
                      🤝 Empate técnico. As duas versões têm performance similar.
                    </p>
                  </div>
                )}
                {(winner === 'A' || winner === 'B') && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-sm text-green-700">
                      🎉 Versão {winner} está vencendo com {winner === 'A' ? rateA.toFixed(2) : rateB.toFixed(2)}% de conversão!
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminABTestsPage;
