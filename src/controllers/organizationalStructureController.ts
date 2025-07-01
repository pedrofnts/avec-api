import { Request, Response } from "express";
import axios from "axios";

// Configurações que podem ser definidas via variáveis de ambiente
const API_BASE_URL = process.env.API_BASE_URL || "https://admin.avec.beauty";
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT || "30000");

// Função auxiliar para criar string de cookies genérica
const createCookieString = (authToken: string, structureId: string = "1") => {
  return [
    `session=${authToken}`,
    `current-structure=${structureId}`,
    `tz=America%2FSao_Paulo`,
  ].join("; ");
};

// Função para listar estruturas organizacionais
export const listOrganizationalStructures = async (
  req: Request,
  res: Response
) => {
  try {
    console.log("[listOrganizationalStructures] Recebendo requisição:", {
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
    const cookies = createCookieString(authToken, structureId);

    // Criar os dados do formulário
    const formData = new URLSearchParams({
      sort: "",
      group: "",
      filter: "",
    }).toString();

    console.log("Enviando requisição de estruturas organizacionais:", {
      url: `${API_BASE_URL}/organizational-structures/list`,
      structureId,
    });

    const response = await axios.post(
      `${API_BASE_URL}/organizational-structures/list`,
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

    console.log(
      "Resposta recebida (estruturas organizacionais):",
      response.data && response.data.Data
        ? `${response.data.Data.length} estruturas`
        : "Sem dados"
    );

    res.json(response.data);
  } catch (error) {
    console.error("Erro ao listar estruturas organizacionais:", error);
    if (axios.isAxiosError(error)) {
      console.error("Detalhes do erro:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    }
    res
      .status(500)
      .json({ error: "Erro ao listar estruturas organizacionais" });
  }
};

// Função para definir a estrutura organizacional atual
export const setCurrentOrganizationalStructure = async (
  req: Request,
  res: Response
) => {
  try {
    console.log("[setCurrentOrganizationalStructure] Recebendo requisição:", {
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

    // Obter o ID da estrutura do corpo da requisição
    const { structureId } = req.body;

    if (!structureId) {
      res.status(400).json({
        error: "ID da estrutura organizacional não fornecido",
        required: ["structureId"],
      });
      return;
    }

    // Criar a string de cookies com a nova estrutura
    const cookies = createCookieString(authToken, structureId);

    console.log(
      "Enviando requisição de definição de estrutura organizacional atual:",
      {
        url: `${API_BASE_URL}/organizational-structures/set-current`,
        structureId,
      }
    );

    // Esta requisição é feita para obter os detalhes da estrutura selecionada
    // Equivalente ao que acontece na interface web ao selecionar uma nova unidade
    const response = await axios.get(
      `${API_BASE_URL}/organizational-structures/set-current?id=${structureId}`,
      {
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
      }
    );

    console.log(
      "Resposta recebida (estrutura organizacional atual):",
      response.data || "Sem dados"
    );

    // Além de retornar os dados da estrutura, vamos incluir um cabeçalho Set-Cookie
    // para que o cliente atualize seu cookie com a nova estrutura
    res.setHeader(
      "Set-Cookie",
      `current-structure=${structureId}; Path=/; HttpOnly; SameSite=Strict`
    );

    res.json({
      success: true,
      structureId: structureId,
      data: response.data,
      message: "Estrutura organizacional definida com sucesso",
    });
  } catch (error) {
    console.error("Erro ao definir estrutura organizacional atual:", error);
    if (axios.isAxiosError(error)) {
      console.error("Detalhes do erro:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    }
    res
      .status(500)
      .json({ error: "Erro ao definir estrutura organizacional atual" });
  }
};
