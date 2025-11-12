import { Request, Response, NextFunction } from "express";
import puppeteer from "puppeteer";

// Configurações que podem ser definidas via variáveis de ambiente
const LOGIN_BASE_URL = process.env.LOGIN_BASE_URL || "https://admin.avec.beauty";
const LOGIN_TIMEOUT = parseInt(process.env.LOGIN_TIMEOUT || "30000");

// Mapeamento de unidades para URLs
const UNIT_MAPPING: { [key: string]: string } = {
  villa: "moringaescovaria",
  aquarius: "tratbem-hair-cosmeticos-ltda",
  uberaba: "knhairexpert"
};

// Função para construir URL de login baseada na unidade
const buildLoginUrl = (unidade?: string): string => {
  const defaultUnit = "moringaescovaria";
  const unit = unidade && UNIT_MAPPING[unidade.toLowerCase()] 
    ? UNIT_MAPPING[unidade.toLowerCase()] 
    : defaultUnit;
  return `${LOGIN_BASE_URL}/${unit}/admin`;
};

// Interface para a resposta de login
interface LoginResponse {
  success: boolean;
  token?: string;
  message?: string;
}

// Função de login usando Puppeteer
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let browser = null;
  
  try {
    console.log("[login] Recebendo requisição de login:", {
      method: req.method,
      path: req.path,
      body: {
        email: req.body.email ? "Fornecido" : "Não fornecido",
        password: req.body.password ? "Fornecido" : "Não fornecido",
        unidade: req.body.unidade || "Não especificada (usando villa como padrão)",
      },
    });

    const { email, password, unidade } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email e senha são obrigatórios" });
      return;
    }

    // Construir URL de login baseada na unidade
    const loginUrl = buildLoginUrl(unidade);

    console.log("[login] Iniciando navegador Puppeteer...");

    // Configurar o navegador
    browser = await puppeteer.launch({
      headless: true, // Mude para false se quiser ver o navegador
      defaultViewport: { width: 1280, height: 720 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Configurar timeout e user agent
    await page.setDefaultTimeout(LOGIN_TIMEOUT);
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36');

    console.log(`[login] Navegando para: ${loginUrl}`);

    // Navegar para a página de login
    await page.goto(loginUrl, { 
      waitUntil: 'networkidle2',
      timeout: LOGIN_TIMEOUT 
    });

    console.log("[login] Página carregada, procurando elementos de login...");

    // Aguardar os elementos de login aparecerem
    await page.waitForSelector("input[placeholder='Digite aqui...']", { timeout: 10000 });
    await page.waitForSelector("input[placeholder='Digite sua senha...']", { timeout: 10000 });

    console.log("[login] Elementos encontrados, preenchendo credenciais...");

    // Encontrar e preencher o campo de email
    const emailInput = await page.$("input[placeholder='Digite aqui...']");
    if (!emailInput) {
      throw new Error("Campo de email não encontrado");
    }
    await emailInput.click();
    await emailInput.type(email, { delay: 100 });

    // Encontrar e preencher o campo de senha
    const passwordInput = await page.$("input[placeholder='Digite sua senha...']");
    if (!passwordInput) {
      throw new Error("Campo de senha não encontrado");
    }
    await passwordInput.click();
    await passwordInput.type(password, { delay: 100 });

    console.log("[login] Credenciais preenchidas, clicando no botão de login...");

    // Encontrar e clicar no botão de login - usando um seletor mais simples
    const loginButton = await page.$("button[class*='bg-primary-main'][class*='text-neutral-white']");
    
    if (!loginButton) {
      throw new Error("Botão de login não encontrado");
    }

    // Aguardar navegação após o clique
    await Promise.all([
      page.waitForNavigation({ 
        waitUntil: 'networkidle2', 
        timeout: LOGIN_TIMEOUT 
      }),
      loginButton.click()
    ]);

    console.log("[login] Login executado, verificando resultado...");

    // Verificar se o login foi bem-sucedido
    const currentUrl = page.url();
    console.log(`[login] URL atual após login: ${currentUrl}`);

    // Se ainda estiver na página de login, provavelmente houve erro
    if (currentUrl.includes('/login') || currentUrl === loginUrl) {
      // Verificar se há mensagem de erro na página
      const errorMessage = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"], [class*="warning"]');
        return errorElements.length > 0 ? (errorElements[0].textContent || '') : '';
      });

      throw new Error(`Login falhou: ${errorMessage || 'Credenciais inválidas'}`);
    }

    console.log("[login] Login bem-sucedido, extraindo cookies...");

    // Extrair apenas o cookie de sessão necessário
    const cookies = await page.cookies();
    
    // Procurar especificamente pelo cookie ci3_session
    const sessionCookie = cookies.find(cookie => cookie.name === 'ci3_session');

    if (!sessionCookie) {
      throw new Error('Cookie de sessão não encontrado após login');
    }

    console.log(`[login] Token de sessão extraído: ${sessionCookie.value.substring(0, 20)}...`);

    console.log("[login] Resposta preparada, fechando navegador...");

    res.status(200).json({
      success: true,
      token: sessionCookie.value
    });

  } catch (error: any) {
    console.error("Erro durante o login:", error);

    res.status(500).json({
      success: false,
      message: `Erro durante o processo de login: ${error.message}`
    });
  } finally {
    // Sempre fechar o navegador
    if (browser) {
      try {
        await browser.close();
        console.log("[login] Navegador fechado");
      } catch (closeError) {
        console.error("Erro ao fechar navegador:", closeError);
      }
    }
  }
};

