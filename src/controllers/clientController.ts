import { Request, Response } from "express";
import axios from "axios";

const ELOS_URL = "https://botoclinic.elosclub.com.br";

// Função auxiliar para criar string de cookies
const createCookieString = (authToken: string) => {
  return [
    `tz=America%2FMaceio`,
    `slot-routing-url=-`,
    `current-organizational-structure=58`,
    `_ga=GA1.1.1853101631.1733855667`,
    `_ga_H3Z1Q956EV=GS1.1.1738295739.7.0.1738295739.0.0.0`,
    `Authentication=${authToken}`,
  ].join("; ");
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
      url: `${ELOS_URL}/Search/Get`,
      cookies: "cookie-string", // Não logar cookies completos
      searchTerm,
    });

    const url = `${ELOS_URL}/Search/Get?searchTerm=${encodeURIComponent(
      searchTerm
    )}&pageSize=${pageSize}&pageNum=${pageNum}&searchName=Client&extraCondition=&_=${timestamp}`;

    const response = await axios.get(url, {
      headers: {
        accept: "*/*",
        "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "cache-control": "no-cache",
        dnt: "1",
        origin: ELOS_URL,
        pragma: "no-cache",
        priority: "u=1, i",
        referer: `${ELOS_URL}/`,
        "sec-ch-ua": '"Not:A-Brand";v="24", "Chromium";v="134"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
        "x-requested-with": "XMLHttpRequest",
        cookie: cookies,
      },
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

    console.log("Enviando requisição de listagem filtrada de clientes:", {
      url: `${ELOS_URL}/Client/ListFilteredClients`,
      dados: {
        sort,
        page,
        pageSize,
        document,
        name,
        phone,
        email,
      },
    });

    const response = await axios.post(
      `${ELOS_URL}/Client/ListFilteredClients`,
      formData,
      {
        headers: {
          accept: "*/*",
          "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          "cache-control": "no-cache",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          dnt: "1",
          origin: ELOS_URL,
          pragma: "no-cache",
          priority: "u=1, i",
          referer: `${ELOS_URL}/`,
          "sec-ch-ua": '"Not:A-Brand";v="24", "Chromium";v="134"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
          "x-requested-with": "XMLHttpRequest",
          cookie: cookies,
        },
      }
    );

    console.log(
      "Resposta de listagem filtrada de clientes recebida:",
      response.data
    );

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

// Função para buscar aniversariantes do dia
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
    const structureId = (req.headers["x-organization-structure"] as string) || "58";

    if (!authToken) {
      res.status(401).json({ error: "Token não fornecido" });
      return;
    }

    // Obter parâmetros do corpo da requisição
    const { date } = req.body;

    // Validar parâmetros obrigatórios
    if (!date) {
      res.status(400).json({
        error: "Data não fornecida",
        required: ["date"],
      });
      return;
    }

    // Formatar a data para o formato brasileiro (DD/MM/YYYY)
    const parsedDate = new Date(date);
    const day = parsedDate.getDate().toString().padStart(2, "0");
    const month = (parsedDate.getMonth() + 1).toString().padStart(2, "0");
    const year = parsedDate.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    // Criar a string de cookies com o ID da organização fornecido
    const cookies = [
      `tz=America%2FMaceio`,
      `slot-routing-url=-`,
      `sidebar_closed=0`,
      `current-organizational-structure=${structureId}`,
      `_ga=GA1.1.1853101631.1733855667`,
      `_ga_H3Z1Q956EV=GS1.1.1738295739.7.0.1738295739.0.0.0`,
      `Authentication=${authToken}`,
    ].join("; ");

    console.log("Enviando requisição de aniversariantes do dia:", {
      url: `${ELOS_URL}/Report/Custom/List`,
      date: formattedDate,
      structureId,
    });

    // Criar os dados do formulário para a requisição
    const formData = new URLSearchParams({
      sort: "",
      group: "",
      filter: "",
      ReportId: "5",
      ReportDetailPeriodId: "2",
      "Filters[0].Field": "Field4268",
      "Filters[0].Placeholder": "[[DATA]]",
      "Filters[0].Type": "date",
      "Filters[0].Value1": formattedDate,
      "Filters[0].Value2": formattedDate,
    }).toString();

    const response = await axios.post(
      `${ELOS_URL}/Report/Custom/List`,
      formData,
      {
        headers: {
          accept: "*/*",
          "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          "cache-control": "no-cache",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          dnt: "1",
          origin: ELOS_URL,
          pragma: "no-cache",
          priority: "u=1, i",
          referer: `${ELOS_URL}/`,
          "sec-ch-ua": '"Chromium";v="135", "Not-A.Brand";v="8"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
          "x-requested-with": "XMLHttpRequest",
          cookie: cookies,
        },
      }
    );

    // Logs para depuração
    console.log("Resposta de aniversariantes recebida:", response.data);

    // Processar a resposta para retornar apenas os dados necessários
    if (response.data && response.data.Data) {
      const aniversariantes = response.data.Data.map(
        (item: BirthdayReportItem) => ({
          nome: item.NOME,
          dataAniversario: item.DATA_ANIVERSARIO,
          email: item.EMAIL,
          telefone: formatarTelefone(item.TELEFONE),
          endereco: {
            logradouro: item.ENDERECO,
            bairro: item.BAIRRO,
            numero: item.NUMERO,
            complemento: item.COMPLEMENTO,
            cep: item.CEP,
            cidade: item.CIDADE,
          },
          cpfCnpj: item.cpfcnpj,
          permissoes: {
            telefone: item.IsPhoneAllowed === "True",
            whatsapp: item.IsWhatsappAllowed === "True",
            email: item.IsEmailAllowed === "True",
          },
          inativo: item.INATIVO === "True",
        })
      );

      res.json({
        success: true,
        date: formattedDate,
        structureId,
        total: aniversariantes.length,
        aniversariantes,
      });
      return;
    }

    res.json(response.data);
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
