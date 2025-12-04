import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createABTest, getTestById, updateABTest } from '../../services/abTestService';
import { ABTestCreate, ABTestLocation, ABTestVariant } from '../../types/abTest';
import { useAuthStore } from '../../stores/useAuthStore';
import { ArrowLeft, Save } from 'lucide-react';
import clsx from 'clsx';

const AdminABTestEditorPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isEdit = !!testId;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<ABTestLocation>('challenge_limit_screen');

  const [variantA, setVariantA] = useState<ABTestVariant>({
    title: '',
    message: '',
    buttonText: '',
    buttonColor: 'yellow',
    emoji: '🚫',
    extraInfo: ''
  });

  const [variantB, setVariantB] = useState<ABTestVariant>({
    title: '',
    message: '',
    buttonText: '',
    buttonColor: 'yellow',
    emoji: '⭐',
    extraInfo: ''
  });

  useEffect(() => {
    if (isEdit && testId) {
      loadTest(testId);
    }
  }, [isEdit, testId]);

  const loadTest = async (id: string) => {
    setLoading(true);
    const test = await getTestById(id);
    if (test) {
      setName(test.name);
      setDescription(test.description || '');
      setLocation(test.location);
      setVariantA(test.variantA);
      setVariantB(test.variantB);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setSaving(true);

    try {
      const testData: ABTestCreate = {
        name,
        description,
        location,
        variantA,
        variantB
      };

      if (isEdit && testId) {
        await updateABTest(testId, testData);
      } else {
        await createABTest(testData, user.uid);
      }

      navigate('/admin/ab-tests');
    } catch (error) {
      console.error('Error saving test:', error);
      alert('Erro ao salvar teste. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const locations: { value: ABTestLocation; label: string }[] = [
    { value: 'challenge_limit_screen', label: 'Tela de Limite - Challenge' },
    { value: 'study_blocked_screen', label: 'Tela Bloqueada - Estudo' },
    { value: 'profile_premium_banner', label: 'Banner Premium - Perfil' },
    { value: 'disciplines_page_banner', label: 'Banner - Disciplinas' }
  ];

  const colors: { value: string; label: string; class: string }[] = [
    { value: 'yellow', label: 'Amarelo', class: 'bg-yellow-500' },
    { value: 'green', label: 'Verde', class: 'bg-green-500' },
    { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
    { value: 'red', label: 'Vermelho', class: 'bg-red-500' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/ab-tests')}
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {isEdit ? 'Editar Teste A/B' : 'Criar Novo Teste A/B'}
          </h1>
          <p className="text-gray-500 mt-1">Configure as variantes do seu experimento</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Informações Básicas</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Nome do Teste *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ex: Mensagem de Limite - Teste Positivo vs Negativo"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Descrição (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Descreva o objetivo deste teste..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Localização *
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value as ABTestLocation)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {locations.map(loc => (
                  <option key={loc.value} value={loc.value}>{loc.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Variant A */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-blue-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Versão A (Controle)</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Emoji
                </label>
                <input
                  type="text"
                  value={variantA.emoji}
                  onChange={(e) => setVariantA({ ...variantA, emoji: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-2xl text-center"
                  placeholder="🚫"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Cor do Botão
                </label>
                <select
                  value={variantA.buttonColor}
                  onChange={(e) => setVariantA({ ...variantA, buttonColor: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  {colors.map(color => (
                    <option key={color.value} value={color.value}>{color.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={variantA.title}
                onChange={(e) => setVariantA({ ...variantA, title: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Ex: Limite Diário Atingido"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Mensagem *
              </label>
              <textarea
                value={variantA.message}
                onChange={(e) => setVariantA({ ...variantA, message: e.target.value })}
                required
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Ex: Você já completou um desafio hoje. Volte amanhã ou atualize para Premium!"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Informação Extra (opcional)
              </label>
              <input
                type="text"
                value={variantA.extraInfo}
                onChange={(e) => setVariantA({ ...variantA, extraInfo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Ex: Apenas 300 MZN/mês"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Texto do Botão *
              </label>
              <input
                type="text"
                value={variantA.buttonText}
                onChange={(e) => setVariantA({ ...variantA, buttonText: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Ex: ⭐ Atualizar para Premium"
              />
            </div>
          </div>
        </div>

        {/* Variant B */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-green-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Versão B (Variante)</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Emoji
                </label>
                <input
                  type="text"
                  value={variantB.emoji}
                  onChange={(e) => setVariantB({ ...variantB, emoji: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-2xl text-center"
                  placeholder="⭐"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Cor do Botão
                </label>
                <select
                  value={variantB.buttonColor}
                  onChange={(e) => setVariantB({ ...variantB, buttonColor: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  {colors.map(color => (
                    <option key={color.value} value={color.value}>{color.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={variantB.title}
                onChange={(e) => setVariantB({ ...variantB, title: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Ex: Desbloqueie Desafios Ilimitados"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Mensagem *
              </label>
              <textarea
                value={variantB.message}
                onChange={(e) => setVariantB({ ...variantB, message: e.target.value })}
                required
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Ex: Você está indo bem! Usuários Premium podem fazer quantos desafios quiserem."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Informação Extra (opcional)
              </label>
              <input
                type="text"
                value={variantB.extraInfo}
                onChange={(e) => setVariantB({ ...variantB, extraInfo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Ex: Apenas 300 MZN/mês"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Texto do Botão *
              </label>
              <input
                type="text"
                value={variantB.buttonText}
                onChange={(e) => setVariantB({ ...variantB, buttonText: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Ex: ✨ Quero Premium Agora"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/ab-tests')}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className={clsx(
              "flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold transition-colors",
              saving ? "opacity-50 cursor-not-allowed" : "hover:bg-primary-hover"
            )}
          >
            <Save size={20} />
            {saving ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Criar Teste')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminABTestEditorPage;
