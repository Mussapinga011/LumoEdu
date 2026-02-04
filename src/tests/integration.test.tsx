import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import LandingPage from '../pages/LandingPage';
// import StudentDashboard from '../pages/StudentDashboard'; // Comentado por enquanto para evitar erros de dependencia complexa

// Mock do AuthStore
vi.mock('../stores/useAuthStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  })),
}));

// Mock do Hook de Navegação
const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

describe('LumoEdu Frontend Integration Tests', () => {
  
  it('TEST-LANDING-001: Landing Page renders correctly', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    // Verifica elementos chave da Landing Page
    expect(screen.getByText(/A forma grátis, divertida e eficaz de estudar/i)).toBeInTheDocument();
    // Verificamos se existem múltiplos botões (Nav e Hero)
    const ctaButtons = screen.getAllByText(/Começar Agora/i);
    expect(ctaButtons.length).toBeGreaterThan(0);

    const loginButtons = screen.getAllByText(/Já tenho conta/i);
    expect(loginButtons.length).toBeGreaterThan(0);
    
    // Verifica se as seções principais estão presentes (pelo texto)
    expect(screen.getByText(/Recursos para sua/i)).toBeInTheDocument();
    expect(screen.getByText(/Não estude sozinho/i)).toBeInTheDocument();
  });

  // Exemplo de como testaríamos o Dashboard se tivessemos todo o contexto mockado
  // it('TEST-AUTH-001: Redirects to Login if not authenticated', () => {
  //   // Setup mock return for this specific test if needed
  //   // render(<StudentDashboard />);
  //   // expect(navigate).toHaveBeenCalledWith('/login');
  // });
});
