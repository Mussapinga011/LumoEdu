import { Link, Navigate } from 'react-router-dom';
import { 
  CheckCircle, 
  Zap, 
  Shield, 
  Users, 
  Download, 
  BookOpen, 
  Target, 
  ArrowRight,
  School
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import clsx from 'clsx';

const LandingPage = () => {
  const { user, loading } = useAuthStore();

  if (loading) return null;
  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/learning" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/lumo_text.png" alt="LumoEdu" className="h-10 w-auto object-contain" />
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-500">
            <a href="#recursos" className="hover:text-primary transition-colors">Recursos</a>
            <a href="#comunidade" className="hover:text-primary transition-colors">Comunidade</a>
            <a href="#instituicoes" className="hover:text-primary transition-colors">Instituições</a>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className="text-sm font-bold text-secondary hover:text-secondary-hover transition-colors px-4 py-2"
            >
              Já tenho conta
            </Link>
            <Link 
              to="/register" 
              className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-xl shadow-[0_4px_0_0_#58a700] active:shadow-none active:translate-y-[4px] transition-all text-center uppercase tracking-wide text-xs"
            >
              Começar Agora
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left space-y-8">
            <h1 className="text-4xl md:text-6xl font-black text-gray-800 leading-tight tracking-tight">
              A forma grátis, divertida e eficaz de estudar para <span className="text-secondary">Exames!</span>
            </h1>
            <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto lg:mx-0">
              Prepare-se para os maiores exames do país com trilhas personalizadas, 
              simulados reais e uma comunidade ativa de alto desempenho.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
              <Link 
                to="/register" 
                className="bg-primary hover:bg-primary-hover text-white font-black py-4 px-10 rounded-2xl shadow-[0_5px_0_0_#58a700] active:shadow-none active:translate-y-[5px] transition-all text-center uppercase tracking-widest flex items-center justify-center gap-3"
              >
                Começar Agora <ArrowRight size={20} />
              </Link>
              <Link 
                to="/login" 
                className="bg-white border-2 border-gray-200 hover:bg-gray-50 text-secondary font-black py-4 px-10 rounded-2xl shadow-[0_5px_0_0_#e5e5e5] active:shadow-none active:translate-y-[5px] transition-all text-center uppercase tracking-widest"
              >
                Já tenho conta
              </Link>
            </div>
            
            <div className="flex items-center gap-4 pt-4 justify-center lg:justify-start">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i+20}`} alt="User" />
                  </div>
                ))}
              </div>
              <p className="text-sm font-bold text-gray-400 italic">
                Mais de <span className="text-gray-700">10+ alunos</span> estudando hoje
              </p>
            </div>
          </div>
          
          <div className="flex-1 flex justify-center relative">
            <div className="relative z-10 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-full flex items-center justify-center shadow-2xl overflow-hidden animate-float">
               <img 
                 src="/lumo_mascot.png" 
                 alt="Mascote LumoEdu" 
                 className="w-4/5 h-4/5 object-contain"
               />
            </div>
            {/* Achievement badges */}
            <div className="absolute -top-4 right-10 z-20 bg-yellow-400 p-4 rounded-2xl shadow-lg -rotate-12 animate-bounce">
               <Zap size={32} className="text-white" />
            </div>
            <div className="absolute bottom-10 -left-4 z-20 bg-secondary p-3 rounded-xl shadow-lg rotate-12">
               <CheckCircle size={24} className="text-white" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Quick View */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
           <div className="text-center space-y-1">
              <div className="text-3xl font-black text-primary italic">25k+</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Questões Respondidas</div>
           </div>
           <div className="text-center space-y-1">
              <div className="text-3xl font-black text-secondary italic">500+</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Simulados Oficiais</div>
           </div>
           <div className="text-center space-y-1">
              <div className="text-3xl font-black text-indigo-600 italic">98%</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Taxa de Aprovação</div>
           </div>
           <div className="text-center space-y-1">
              <div className="text-3xl font-black text-amber-500 italic">24/7</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Suporte da Comunidade</div>
           </div>
        </div>
      </section>

      {/* Updated Features Grid */}
      <section id="recursos" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-gray-800 tracking-tight">
              Recursos para sua <span className="text-primary">Aprovação</span>
            </h2>
            <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto italic">
              Desenvolvemos as ferramentas necessárias para que seu estudo seja produtivo e focado no que realmente cai nas provas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={BookOpen}
              title="Modo Aprender"
              description="Aulas modulares e trilhas dinâmicas organizadas de forma lógica e progressiva."
              color="bg-blue-100 text-blue-600"
            />
            <FeatureCard 
              icon={Target}
              title="Simulados Reais"
              description="Pratique com os exames oficiais das maiores universidades e concursos do país."
              color="bg-indigo-100 text-indigo-600"
            />
            <FeatureCard 
              icon={Users}
              title="Grupos de Estudo"
              description="Tire dúvidas e interaja com outros alunos em canais de chat por matérias."
              color="bg-emerald-100 text-emerald-600"
            />
            <FeatureCard 
              icon={Download}
              title="Central de Downloads"
              description="Acesso a PDFs, resumos e guias de estudo exclusivos para imprimir ou baixar."
              color="bg-cyan-100 text-cyan-600"
            />
            <FeatureCard 
              icon={School}
              title="Foco nas Instituições"
              description="Informações específicas e provas anteriores detalhadas por universidade."
              color="bg-violet-100 text-violet-600"
            />
            <FeatureCard 
              icon={Shield}
              title="Monitoramento"
              description="Acompanhe seu progresso, defina metas e visualize sua evolução diária."
              color="bg-amber-100 text-amber-600"
            />
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="comunidade" className="py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase tracking-widest italic border border-emerald-100">
                <Users size={14} /> Social Learning
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-gray-800 tracking-tight leading-tight uppercase italic">
                Não estude sozinho. <br /> faça parte da <span className="text-emerald-500 underline decoration-emerald-100 underline-offset-8 italic">alcateia</span>.
              </h2>
              <p className="text-lg text-gray-500 font-medium italic leading-relaxed">
                Nossos Grupos de Estudo permitem que você troque materiais, tire dúvidas em tempo real 
                e mantenha a motivação alta com quem tem o mesmo objetivo que você.
              </p>
              <ul className="space-y-4 pt-4">
                {[
                  'Canais exclusivos por disciplina',
                  'Troca de resumos e materiais em PDF',
                  'Desafios semanais em grupo',
                  'Ranking de engajamento da comunidade'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-gray-700 font-bold italic">
                    <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                      <CheckCircle size={14} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 relative">
              <div className="relative z-10 bg-slate-50 border-8 border-white shadow-2xl rounded-[3rem] p-8 aspect-video flex items-center justify-center overflow-hidden group">
                 <div className="absolute inset-0 bg-emerald-600/5 group-hover:bg-transparent transition-colors duration-700"></div>
                 <div className="space-y-4 w-full">
                    {/* Mock Chat UI */}
                    <div className="flex items-start gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 translate-x-4 animate-float">
                       <div className="w-8 h-8 rounded-full bg-blue-100" />
                       <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black uppercase italic">João.Silva</span>
                             <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Matemática</span>
                          </div>
                          <p className="text-xs text-gray-600 italic">Alguém conseguiu resolver a questão 42 da FUVEST?</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-3 bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 -translate-x-4 animate-float-delayed">
                       <div className="w-8 h-8 rounded-full bg-emerald-100" />
                       <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black uppercase italic text-emerald-600">Lumo.Bot</span>
                             <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest">Assistant</span>
                          </div>
                          <p className="text-xs text-gray-600 italic">Aqui está uma dica: Use a fórmula de Bhaskara para encontrar o delta primeiro.</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Institutions */}
      <section id="instituicoes" className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-12">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] italic">Principais Exames Disponíveis</p>
          <div className="flex flex-wrap justify-center items-center gap-12 grayscale opacity-40">
             <img src="https://logodownload.org/wp-content/uploads/2014/10/usp-logo.png" className="h-8 w-auto" alt="USP" />
             <img src="https://logodownload.org/wp-content/uploads/2017/02/unicamp-logo.png" className="h-10 w-auto" alt="Unicamp" />
             <img src="https://logodownload.org/wp-content/uploads/2016/11/enem-logo-0.png" className="h-6 w-auto" alt="ENEM" />
             <img src="https://logodownload.org/wp-content/uploads/2015/02/unesp-logo.png" className="h-8 w-auto" alt="UNESP" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-primary text-white text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none italic uppercase">
            Comece a estudar <br /> <span className="text-secondary select-none">de verdade</span> hoje.
          </h2>
          <p className="text-lg font-medium italic opacity-90 leading-relaxed">
            Milhares de alunos já estão transformando seu futuro com a LumoEdu. 
            Crie sua conta gratuita em segundos.
          </p>
          <div className="pt-4">
            <Link 
              to="/register" 
              className="bg-white text-primary font-black py-5 px-12 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-center uppercase tracking-widest italic text-lg"
            >
              Criar Conta Gratuita
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
           <img src="/lumo_text.png" alt="LumoEdu" className="h-8 w-auto" />
           <p className="text-gray-400 text-sm font-medium italic">© 2024 LumoEdu Platform. Desenvolvido para a sua aprovação.</p>
           <div className="flex gap-8 text-xs font-bold text-gray-400 uppercase tracking-widest italic">
              <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
              <a href="#" className="hover:text-primary transition-colors">Termos</a>
           </div>
        </div>
      </footer>

      {/* Global CSS for animations */}
      <style>{`
        @keyframes floating {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes floating-delayed {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-25px); }
        }
        .animate-float { animation: floating 6s ease-in-out infinite; }
        .animate-float-delayed { animation: floating-delayed 8s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description, color }: any) => (
  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
    <div className={clsx("w-16 h-16 rounded-2xl flex items-center justify-center mb-6", color)}>
      <Icon size={30} />
    </div>
    <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight italic mb-4">{title}</h3>
    <p className="text-gray-500 font-medium italic leading-relaxed">{description}</p>
  </div>
);

export default LandingPage;
