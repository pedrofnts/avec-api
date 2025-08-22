import { Request, Response } from "express";
import axios from "axios";

// Configurações que podem ser definidas via variáveis de ambiente
const API_BASE_URL = process.env.API_BASE_URL || "https://admin.avec.beauty";
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT || "30000");

// Função auxiliar para criar string de cookies para avec.beauty
const createCookieString = (authToken: string) => {
  return `ci3_session=${authToken}`;
};

// Função auxiliar para formatar telefone
const formatarTelefone = (telefone: string | null | undefined): string => {
  if (!telefone) return "";

  // Remove todos os caracteres não numéricos
  const numeroLimpo = telefone.replace(/\D/g, "");

  // Verifica o tamanho para determinar se é celular ou fixo
  if (numeroLimpo.length === 11) {
    // Formato celular: (XX) 9XXXX-XXXX
    return `(${numeroLimpo.substring(0, 2)}) ${numeroLimpo.substring(
      2,
      7
    )}-${numeroLimpo.substring(7, 11)}`;
  } else if (numeroLimpo.length === 10) {
    // Formato fixo: (XX) XXXX-XXXX
    return `(${numeroLimpo.substring(0, 2)}) ${numeroLimpo.substring(
      2,
      6
    )}-${numeroLimpo.substring(6, 10)}`;
  }

  // Se não se encaixar em nenhum formato padrão, retorna como está
  return telefone;
};

// Interface para aniversariantes do relatório
interface BirthdayReportItem {
  NOME: string;
  DATA_ANIVERSARIO: string;
  EMAIL: string;
  TELEFONE: string;
  ENDERECO: string;
  BAIRRO: string;
  NUMERO: string;
  COMPLEMENTO: string;
  CEP: string;
  CIDADE: string;
  cpfcnpj: string;
  IsPhoneAllowed: string;
  IsWhatsappAllowed: string;
  IsEmailAllowed: string;
  INATIVO: string;
}

// Função para buscar clientes
export const searchClients = async (req: Request, res: Response) => {
  try {
    console.log("[searchClients] Recebendo requisição:", {
      method: req.method,
      path: req.path,
      query: req.query,
      headers: req.headers.authorization
        ? "Com Authorization"
        : "Sem Authorization",
    });

    const authToken = req.headers.authorization?.split(" ")[1];

    if (!authToken) {
      res.status(401).json({ error: "Token não fornecido" });
      return;
    }

    // Obter parâmetros da query
    const searchTerm = req.query.searchTerm as string;
    const pageSize = req.query.pageSize || "10";
    const pageNum = req.query.pageNum || "1";

    if (!searchTerm) {
      res.status(400).json({ error: "Termo de busca não fornecido" });
      return;
    }

    // Criar a string de cookies
    const cookies = createCookieString(authToken);

    const timestamp = new Date().getTime();

    console.log("Enviando requisição de busca de clientes:", {
      url: `${API_BASE_URL}/search/clients`,
      searchTerm,
    });

    const url = `${API_BASE_URL}/search/clients?searchTerm=${encodeURIComponent(
      searchTerm
    )}&pageSize=${pageSize}&pageNum=${pageNum}&extraCondition=&_=${timestamp}`;

    const response = await axios.get(url, {
      headers: {
        accept: "*/*",
        "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "cache-control": "no-cache",
        dnt: "1",
        origin: API_BASE_URL,
        pragma: "no-cache",
        priority: "u=1, i",
        referer: `${API_BASE_URL}/`,
        "sec-ch-ua": '"Not:A-Brand";v="24", "Chromium";v="134"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
        "x-requested-with": "XMLHttpRequest",
        cookie: cookies,
      },
      timeout: API_TIMEOUT,
    });

    console.log("Resposta de busca de clientes recebida:", response.data);

    // Verificar a estrutura da resposta
    if (response.data && response.data.Results) {
      console.log(
        `Total de clientes encontrados: ${response.data.Results.length}`
      );
      console.log(
        `Primeiro cliente: ${JSON.stringify(response.data.Results[0])}`
      );
    } else {
      console.log("Resposta sem a estrutura esperada:", response.data);
    }

    res.json(response.data);
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    if (axios.isAxiosError(error)) {
      console.error("Detalhes do erro:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    }
    res.status(500).json({ error: "Erro ao buscar clientes" });
  }
};

// Função para listar clientes filtrados
export const listFilteredClients = async (req: Request, res: Response) => {
  try {
    console.log("[listFilteredClients] Recebendo requisição:", {
      method: req.method,
      path: req.path,
      body: req.body,
      headers: req.headers.authorization
        ? "Com Authorization"
        : "Sem Authorization",
    });

    const authToken = req.headers.authorization?.split(" ")[1];

    if (!authToken) {
      res.status(401).json({ error: "Token não fornecido" });
      return;
    }

    // Obter parâmetros do corpo da requisição
    const {
      sort = "",
      page = 1,
      pageSize = 10,
      group = "",
      filter = "",
      document = "",
      name = "",
      phone = "",
      initialDate = "",
      finalDate = "",
      media = "",
      type = "",
      email = "",
    } = req.body;

    // Criar a string de cookies
    const cookies = createCookieString(authToken);

    // Criar os dados do formulário exatamente como no CURL
    const formData = new URLSearchParams({
      sort: sort.toString(),
      page: page.toString(),
      pageSize: pageSize.toString(),
      group: group.toString(),
      filter: filter.toString(),
      document: document.toString(),
      name: name.toString(),
      phone: phone.toString(),
      initialDate: initialDate.toString(),
      finalDate: finalDate.toString(),
      media: media.toString(),
      type: type.toString(),
      email: email.toString(),
    }).toString();

    console.log("Enviando requisição de clientes filtrados:", {
      url: `${API_BASE_URL}/clients/filtered`,
      dados: {
        page,
        pageSize,
        name,
        phone,
        email,
        document,
      },
    });

    const response = await axios.post(
      `${API_BASE_URL}/clients/filtered`,
      formData,
      {
        headers: {
          accept: "*/*",
          "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          "cache-control": "no-cache",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          dnt: "1",
          origin: API_BASE_URL,
          pragma: "no-cache",
          priority: "u=1, i",
          referer: `${API_BASE_URL}/`,
          "sec-ch-ua": '"Not:A-Brand";v="24", "Chromium";v="134"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
          "x-requested-with": "XMLHttpRequest",
          cookie: cookies,
        },
        timeout: API_TIMEOUT,
      }
    );

    console.log("Resposta de clientes filtrados recebida");

    res.json(response.data);
  } catch (error) {
    console.error("Erro ao listar clientes filtrados:", error);
    if (axios.isAxiosError(error)) {
      console.error("Detalhes do erro:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    }
    res.status(500).json({ error: "Erro ao listar clientes filtrados" });
  }
};

// Função para buscar aniversariantes por data
export const getBirthdaysByDate = async (req: Request, res: Response) => {
  try {
    console.log("[getBirthdaysByDate] Recebendo requisição:", {
      method: req.method,
      path: req.path,
      body: req.body,
      headers: req.headers.authorization
        ? "Com Authorization"
        : "Sem Authorization",
    });

    const authToken = req.headers.authorization?.split(" ")[1];

    if (!authToken) {
      res.status(401).json({ error: "Token não fornecido" });
      return;
    }

    const { date } = req.body;

    if (!date) {
      res.status(400).json({
        error: "Data não fornecida",
        required: ["date"],
      });
      return;
    }

    // Criar a string de cookies
    const cookies = createCookieString(authToken);

    console.log("Enviando requisição de aniversariantes:", {
      url: `${API_BASE_URL}/clients/birthdays`,
      data: date,
    });

    const response = await axios.post(
      `${API_BASE_URL}/clients/birthdays`,
      `date=${encodeURIComponent(date)}`,
      {
        headers: {
          accept: "*/*",
          "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          "cache-control": "no-cache",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          dnt: "1",
          origin: API_BASE_URL,
          pragma: "no-cache",
          priority: "u=1, i",
          referer: `${API_BASE_URL}/`,
          "sec-ch-ua": '"Not:A-Brand";v="24", "Chromium";v="134"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
          "x-requested-with": "XMLHttpRequest",
          cookie: cookies,
        },
        timeout: API_TIMEOUT,
      }
    );

    console.log("Resposta de aniversariantes recebida");

    // Processar e formatar os dados se necessário
    let processedData = response.data;

    if (Array.isArray(response.data)) {
      processedData = response.data.map((item: BirthdayReportItem) => ({
        ...item,
        telefoneFormatado: formatarTelefone(item.TELEFONE),
      }));
    }

    res.json({
      success: true,
      date,
      data: processedData,
    });
  } catch (error) {
    console.error("Erro ao buscar aniversariantes:", error);
    if (axios.isAxiosError(error)) {
      console.error("Detalhes do erro:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    }
    res.status(500).json({ error: "Erro ao buscar aniversariantes" });
  }
};

// Função para buscar todos os clientes por unidade
export const getAllClientsByUnit = async (req: Request, res: Response) => {
  try {
    console.log("[getAllClientsByUnit] Recebendo requisição:", {
      method: req.method,
      path: req.path,
      body: req.body,
      headers: req.headers.authorization
        ? "Com Authorization"
        : "Sem Authorization",
    });

    const authToken = req.headers.authorization?.split(" ")[1];
    const structureId =
      (req.headers["x-organization-structure"] as string) || "1";

    if (!authToken) {
      res.status(401).json({ error: "Token não fornecido" });
      return;
    }

    // Criar a string de cookies
    const cookies = createCookieString(authToken);

    // Usar paginação ampla para buscar todos os clientes
    const formData = new URLSearchParams({
      sort: "",
      page: "1",
      pageSize: "10000", // Valor alto para pegar todos os registros
      group: "",
      filter: "",
      document: "",
      name: "",
      phone: "",
      initialDate: "",
      finalDate: "",
      media: "",
      type: "",
      email: "",
    }).toString();

    console.log("Enviando requisição de todos os clientes da unidade:", {
      url: `${API_BASE_URL}/clients/by-unit`,
      structureId,
    });

    const response = await axios.post(
      `${API_BASE_URL}/clients/by-unit`,
      formData,
      {
        headers: {
          accept: "*/*",
          "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          "cache-control": "no-cache",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          dnt: "1",
          origin: API_BASE_URL,
          pragma: "no-cache",
          priority: "u=1, i",
          referer: `${API_BASE_URL}/`,
          "sec-ch-ua": '"Not:A-Brand";v="24", "Chromium";v="134"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
          "x-requested-with": "XMLHttpRequest",
          cookie: cookies,
        },
        timeout: API_TIMEOUT,
      }
    );

    console.log("Resposta de todos os clientes da unidade recebida");

    // Adicionar informações da estrutura na resposta
    const responseData = {
      ...response.data,
      structureId,
      totalClients: response.data?.Data?.length || 0,
    };

    res.json(responseData);
  } catch (error) {
    console.error("Erro ao buscar todos os clientes da unidade:", error);
    if (axios.isAxiosError(error)) {
      console.error("Detalhes do erro:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    }
    res
      .status(500)
      .json({ error: "Erro ao buscar todos os clientes da unidade" });
  }
};

// Função para listar clientes simplificada
export const listClients = async (req: Request, res: Response) => {
  try {
    const authToken = req.headers.authorization?.split(" ")[1];
    if (!authToken) {
      res.status(401).json({ error: "Token não fornecido" });
      return;
    }

    const cookies = createCookieString(authToken);
    const url = `${API_BASE_URL}/admin/clientes/lista?draw=1&start=0&length=10000&columns[0][data]=0&columns[0][name]=&columns[0][searchable]=true&columns[0][orderable]=true&columns[0][search][value]=&columns[0][search][regex]=false&columns[1][data]=1&columns[1][name]=&columns[1][searchable]=true&columns[1][orderable]=true&columns[1][search][value]=&columns[1][search][regex]=false&columns[2][data]=2&columns[2][name]=&columns[2][searchable]=true&columns[2][orderable]=true&columns[2][search][value]=&columns[2][search][regex]=false&columns[3][data]=3&columns[3][name]=&columns[3][searchable]=true&columns[3][orderable]=true&columns[3][search][value]=&columns[3][search][regex]=false&columns[4][data]=4&columns[4][name]=&columns[4][searchable]=true&columns[4][orderable]=true&columns[4][search][value]=&columns[4][search][regex]=false&columns[5][data]=5&columns[5][name]=&columns[5][searchable]=true&columns[5][orderable]=false&columns[5][search][value]=&columns[5][search][regex]=false&order[0][column]=0&order[0][dir]=asc&search[value]=&search[regex]=false&_=${Date.now()}`;

    const response = await axios.get(url, {
      headers: {
        accept: "application/json, text/javascript, */*; q=0.01",
        "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        cookie: cookies,
        "x-requested-with": "XMLHttpRequest",
      },
      timeout: API_TIMEOUT,
    });

    // Extrair e simplificar dados
    const clientes = response.data.data?.map((row: any) => {
      const nome = row[0]?.replace(/<[^>]*>/g, '').split('\n')[1]?.trim() || '';
      const contato = row[1] || '';
      const aniversario = row[2] || '';
      
      // Extrair email
      const emailMatch = contato.match(/<b>E-mail: <\/b>([^<\s]+)/);
      const email = emailMatch ? emailMatch[1] : '';
      
      // Extrair telefone
      const telefoneMatch = contato.match(/data-ddi="55" class="should-format-phone-number">(\d+)</);
      const telefone = telefoneMatch ? telefoneMatch[1] : '';

      return {
        nome,
        email,
        telefone,
        aniversario
      };
    }) || [];

    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar clientes" });
  }
};
