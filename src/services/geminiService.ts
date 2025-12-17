/**
 * Gemini API Service
 * Processa imagens de questões de exame usando Gemini Vision API
 */

export interface ProcessedQuestion {
  statement: string;      // LaTeX do enunciado
  options: string[];      // Array com 4 ou 5 alternativas em LaTeX
  correctOption: string;  // Letra da alternativa correta (A, B, C, D, E)
  explanation?: string;   // LaTeX da explicação (opcional)
  order: number;          // Ordem da questão
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Usando o nome exato da lista de modelos (Item 20)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

// Configurações de Rate Limiting
const RPM_LIMIT = 10; // Limite seguro de requisições por minuto (grátis geralmente é 15)
const DELAY_MS = (60000 / RPM_LIMIT) + 500; // Delay entre requisições (6.5s)

const PROMPT_TEMPLATE = `Analise esta imagem de uma questão de exame e extraia as seguintes informações em formato JSON VÁLIDO.

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional, sem markdown, sem \`\`\`json.

Formato esperado:
{
  "statement": "enunciado completo em LaTeX",
  "options": ["alternativa A em LaTeX", "alternativa B em LaTeX", "alternativa C em LaTeX", "alternativa D em LaTeX"],
  "correctOption": "A",
  "explanation": "explicação da resposta em LaTeX (se disponível)"
}

Regras:
1. Use sintaxe LaTeX para fórmulas matemáticas (ex: $x^2$, \\frac{a}{b}, \\sqrt{x})
2. Mantenha formatação original do texto
3. Se houver apenas 4 alternativas, retorne array com 4 itens
4. Se houver 5 alternativas (A, B, C, D, E), retorne array com 5 itens
5. correctOption deve ser apenas a letra (A, B, C, D ou E)
6. Se não houver explicação visível na imagem, deixe explanation como string vazia ""
7. Não adicione texto explicativo, apenas retorne o JSON puro

RETORNE APENAS O JSON, SEM NENHUM TEXTO ADICIONAL.`;

/**
 * Converte File para base64
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove o prefixo "data:image/png;base64,"
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Parseia a resposta do Gemini e extrai o JSON
 */
const parseGeminiResponse = (data: any): ProcessedQuestion => {
  try {
    // A resposta vem em data.candidates[0].content.parts[0].text
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      if (data.promptFeedback) {
        throw new Error(`Imagem bloqueada: ${JSON.stringify(data.promptFeedback)}`);
      }
      throw new Error('Resposta vazia do Gemini');
    }

    // Remove possíveis markdown code blocks
    let jsonText = text.trim();
    jsonText = jsonText.replace(/```json\n?/g, '');
    jsonText = jsonText.replace(/```\n?/g, '');
    jsonText = jsonText.trim();

    // Parse JSON
    const parsed = JSON.parse(jsonText);

    // Validação básica
    if (!parsed.statement || !Array.isArray(parsed.options) || !parsed.correctOption) {
      throw new Error('JSON inválido: faltam campos obrigatórios');
    }

    // Validar que correctOption é uma letra válida
    const validOptions = ['A', 'B', 'C', 'D', 'E'];
    if (!validOptions.includes(parsed.correctOption.toUpperCase())) {
      throw new Error(`correctOption inválido: ${parsed.correctOption}`);
    }

    // Validar número de opções (4 ou 5)
    if (parsed.options.length < 4 || parsed.options.length > 5) {
      throw new Error(`Número inválido de opções: ${parsed.options.length}`);
    }

    return {
      statement: parsed.statement,
      options: parsed.options,
      correctOption: parsed.correctOption.toUpperCase(),
      explanation: parsed.explanation || '',
      order: 0 // Será definido depois
    };
  } catch (error: any) {
    console.error('Erro ao parsear resposta do Gemini:', error);
    console.error('Resposta original:', data);
    throw new Error(`Erro ao processar resposta: ${error.message}`);
  }
};

/**
 * Função auxiliar para delay
 */
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Processa uma imagem com Gemini Vision API
 */
export const processImageWithGemini = async (
  imageFile: File,
  order: number,
  retryCount = 0
): Promise<ProcessedQuestion> => {
  if (!GEMINI_API_KEY) {
    throw new Error('VITE_GEMINI_API_KEY não configurada no .env.local');
  }

  try {
    // 1. Converter imagem para base64
    const base64Data = await fileToBase64(imageFile);

    // 2. Determinar mime type
    const mimeType = imageFile.type || 'image/png';

    console.log(`Enviando requisição Gemini (Tentativa ${retryCount + 1})...`);

    // 3. Chamar Gemini Vision API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT_TEMPLATE },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1, // Baixa temperatura para respostas mais consistentes
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Retry em caso de 429 (Too Many Requests)
      if (response.status === 429 && retryCount < 3) {
        const waitTime = (retryCount + 1) * 10000; // 10s, 20s, 30s
        console.warn(`Rate limit atingido. Aguardando ${waitTime/1000}s para tentar novamente...`);
        await wait(waitTime);
        return processImageWithGemini(imageFile, order, retryCount + 1);
      }

      throw new Error(
        `Erro na API Gemini: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();

    // 4. Parsear resposta
    const question = parseGeminiResponse(data);
    question.order = order;

    return question;
  } catch (error: any) {
    console.error('Erro ao processar imagem:', error);
    throw new Error(`Falha ao processar imagem: ${error.message}`);
  }
};

/**
 * Processa múltiplas imagens em batch com rate limiting
 */
export const processBatchImages = async (
  imageFiles: File[],
  onProgress?: (current: number, total: number) => void
): Promise<ProcessedQuestion[]> => {
  const results: ProcessedQuestion[] = [];
  const total = imageFiles.length;

  for (let i = 0; i < total; i++) {
    try {
      console.log(`Processando imagem ${i + 1}/${total}...`);
      
      const question = await processImageWithGemini(imageFiles[i], i + 1);
      results.push(question);
      
      if (onProgress) {
        onProgress(i + 1, total);
      }

      // Delay obrigatório para respeitar taxa gratuita (RPM)
      if (i < total - 1) {
        console.log(`Aguardando ${DELAY_MS}ms para próxima requisição...`);
        await wait(DELAY_MS);
      }
    } catch (error: any) {
      console.error(`Erro fatal ao processar imagem ${i + 1}:`, error);
      // Adiciona uma questão com erro para manter a ordem
      results.push({
        statement: `ERRO DE PROCESSAMENTO: ${error.message}`,
        options: ['', '', '', ''],
        correctOption: 'A',
        explanation: 'Falha na comunicação com IA',
        order: i + 1,
      });
      
      if (onProgress) {
        onProgress(i + 1, total);
      }
      
      // Delay mesmo em caso de erro
      if (i < total - 1) {
        await wait(DELAY_MS);
      }
    }
  }

  return results;
};
