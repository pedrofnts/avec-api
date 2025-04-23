import { Request, Response } from "express";
import axios from "axios";

const ELOS_URL = "https://botoclinic.elosclub.com.br";

// Função auxiliar para criar string de cookies
const createCookieString = (authToken: string, structureId: string = "58") => {
  return [
    `tz=America%2FMaceio`,
    `slot-routing-url=-`,
    `current-organizational-structure=${structureId}`,
    `_ga=GA1.1.1853101631.1733855667`,
    `_ga_H3Z1Q956EV=GS1.1.1738295739.7.0.1738295739.0.0.0`,
    `Authentication=${authToken}`,
  ].join("; ");
};

// Função auxiliar para converter a duração de string para minutos
const parseDuration = (durationStr: string): number => {
  if (!durationStr) return 0;

  const parts = durationStr.split(":");
  if (parts.length === 2) {
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  }
  return 0;
};

// Função auxiliar para formatar data no padrão brasileiro
const formatDateToBrazilian = (date: string): string => {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
};

// Função auxiliar para converter o formato de data do Elos
const formatElosDate = (elosDate: string): string => {
  if (!elosDate) return '';
  const timestamp = parseInt(elosDate.replace('/Date(', '').replace(')/', ''));
  const date = new Date(timestamp);
  return date.toISOString();
};

// Interface para itens de procedimento da API
interface ProcedureItem {
  Id: number;
  Text: string;
  CustomHtmlFormat: string | null;
  Inactive: string;
  Block: string;
  AccessLimitNumber: number | null;
}

// Interface para procedimentos disponíveis da API
interface AvailableProcedureItem {
  Item_Id: number;
  Item_Name: string;
  Duration: string;
  Description: string;
  HasBlock: boolean;
}

// Interface para agendamentos da API
interface ScheduleItem {
  Id: number;
  Client_Id: number;
  Client_Name: string;
  Client_FlattenedPhones: string;
  Item_Id: number;
  Item_Name: string;
  Start: string;
  End: string;
  Status: number;
  StatusDescription: string;
  Locality_Id: number;
  Locality_Name: string;
}

// Função para buscar tipos de procedimento
export const getProcedureTypes = async (req: Request, res: Response) => {
  try {
    console.log("[getProcedureTypes] Recebendo requisição:", {
      method: req.method,
      path: req.path,
      headers: req.headers.authorization
        ? "Com Authorization"
        : "Sem Authorization",
    });

    const authToken = req.headers.authorization?.split(" ")[1];
    const structureId =
      (req.headers["x-organization-structure"] as string) || "58";

    if (!authToken) {
      res.status(401).json({ error: "Token não fornecido" });
      return;
    }

    // Criar a string de cookies
    const cookies = createCookieString(authToken, structureId);

    const timestamp = new Date().getTime();
    const url = `${ELOS_URL}/Search/Get?searchTerm=&pageSize=100&pageNum=1&searchName=ItemClassifier&extraCondition=&_=${timestamp}`;

    console.log("Enviando requisição de tipos de procedimento:", {
      url,
    });

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

    // Transformar a resposta para o formato esperado
    const transformedResponse = {
      Results: response.data.Results
        ? response.data.Results.map((item: ProcedureItem) => ({
            id: item.Id,
            text: item.Text,
            CustomHtmlFormat: item.CustomHtmlFormat,
            Inactive: item.Inactive === "True",
            Block: item.Block === "True",
            AccessLimitNumber: item.AccessLimitNumber,
          }))
        : [],
      Total: response.data.Total || 0,
    };

    console.log("Resposta transformada de tipos de procedimento:", {
      total: transformedResponse.Results.length,
    });

    res.json(transformedResponse);
  } catch (error) {
    console.error("Erro ao buscar tipos de procedimento:", error);
    if (axios.isAxiosError(error)) {
      console.error("Detalhes do erro:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    }
    res.status(500).json({ error: "Erro ao buscar tipos de procedimento" });
  }
};

// Função para buscar procedimentos disponíveis
export const getAvailableProcedures = async (req: Request, res: Response) => {
  try {
    console.log("[getAvailableProcedures] Recebendo requisição:", {
      method: req.method,
      path: req.path,
      body: req.body,
      headers: req.headers.authorization
        ? "Com Authorization"
        : "Sem Authorization",
    });

    const authToken = req.headers.authorization?.split(" ")[1];
    const structureId =
      (req.headers["x-organization-structure"] as string) || "58";

    if (!authToken) {
      res.status(401).json({ error: "Token não fornecido" });
      return;
    }

    // Obter parâmetros do corpo da requisição
    const {
      Client_Id,
      ItemClassifier_Id,
      InitDate,
      EndDate,
      InitTime,
      EndTime,
      AllowDocking = false,
      Locality_Id = "",
      SchedulingBySystem = false,
    } = req.body;

    // Validar parâmetros obrigatórios
    if (!Client_Id || !ItemClassifier_Id || !InitDate || !EndDate) {
      res.status(400).json({
        error: "Parâmetros obrigatórios não fornecidos",
        required: [
          "Client_Id",
          "ItemClassifier_Id",
          "InitDate",
          "EndDate",
          "InitTime",
          "EndTime",
        ],
      });
      return;
    }

    // Criar a string de cookies
    const cookies = createCookieString(authToken, structureId);

    // Criar os dados do formulário
    const formData = new URLSearchParams();
    formData.append("Client_Id", Client_Id.toString());
    formData.append("ItemClassifier_Id", ItemClassifier_Id.toString());
    formData.append("InitDate", InitDate);
    formData.append("EndDate", EndDate);
    formData.append("InitTime", InitTime);
    formData.append("EndTime", EndTime);
    formData.append("AllowDocking", AllowDocking.toString());
    formData.append("Locality_Id", Locality_Id.toString() || "");
    formData.append("SchedulingBySystem", SchedulingBySystem.toString());

    console.log("Enviando requisição de procedimentos disponíveis:", {
      url: `${ELOS_URL}/Scheduler/AvailabilityProcedures`,
      dados: req.body,
    });

    const response = await axios.post(
      `${ELOS_URL}/Scheduler/AvailabilityProcedures`,
      formData,
      {
        headers: {
          accept: "application/json, text/javascript, */*; q=0.01",
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

    // Transformar a resposta para o formato que o cliente espera
    const transformedData = {
      Success: true,
      Items: Array.isArray(response.data)
        ? response.data.map((item: AvailableProcedureItem) => ({
            Id: item.Item_Id || 0,
            Name: item.Item_Name || "",
            Duration: parseDuration(item.Duration || "0:00"),
            Description: item.Description || "",
            Value: 0, // Este campo não vem na resposta, mas é esperado pelo cliente
            SpecialistItem_Id: 0,
            Item_Id: item.Item_Id || 0,
            Docking: item.HasBlock || false,
            PrepareTime: 0,
            FinishTime: 0,
            ItemGroup: null,
          }))
        : [],
    };

    console.log("Resposta transformada de procedimentos disponíveis:", {
      success: transformedData.Success,
      total: transformedData.Items.length,
    });

    res.json(transformedData);
  } catch (error) {
    console.error("Erro ao buscar procedimentos disponíveis:", error);
    if (axios.isAxiosError(error)) {
      console.error("Detalhes do erro:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    }
    res.status(500).json({ error: "Erro ao buscar procedimentos disponíveis" });
  }
};

// Função para buscar procedimentos de um dia específico
export const getDailyProcedures = async (req: Request, res: Response) => {
  try {
    console.log("[getDailyProcedures] Recebendo requisição:", {
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

    if (!date) {
      res.status(400).json({
        error: "Data não fornecida",
        required: ["date"],
      });
      return;
    }

    // Formatar a data para o padrão brasileiro
    const formattedDate = formatDateToBrazilian(date);

    // Criar as datas de início e fim do dia
    const startDate = `${formattedDate} 00:00:00`;
    const endDate = `${formattedDate} 23:59:59`;

    // Criar a string de cookies
    const cookies = createCookieString(authToken, structureId);

    // Criar os dados do formulário
    const formData = new URLSearchParams({
      sort: "",
      page: "1",
      pageSize: "100",
      group: "",
      filter: "",
      establishment: "",
      locality: "",
      start: startDate,
      end: endDate,
    }).toString();

    console.log("Enviando requisição de procedimentos diários:", {
      url: `${ELOS_URL}/Scheduler/Read`,
      dados: { startDate, endDate, structureId },
    });

    const response = await axios.post(`${ELOS_URL}/Scheduler/Read`, formData, {
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
    });

    // A resposta será a lista de agendamentos, vamos extrair os procedimentos
    const procedures = response.data.Data
      ? response.data.Data.map((item: ScheduleItem) => ({
          id: item.Id,
          clientId: item.Client_Id,
          client: item.Client_Name,
          clientPhone: item.Client_FlattenedPhones,
          procedureId: item.Item_Id,
          procedure: item.Item_Name,
          localityId: item.Locality_Id,
          locality: item.Locality_Name,
          startTime: formatElosDate(item.Start),
          endTime: formatElosDate(item.End),
          status: item.Status,
          statusDescription: item.StatusDescription
        }))
      : [];

    console.log("Resposta de procedimentos diários:", {
      total: procedures.length,
    });

    res.json({
      success: true,
      date: date,
      total: procedures.length,
      procedures,
    });
  } catch (error) {
    console.error("Erro ao buscar procedimentos diários:", error);
    if (axios.isAxiosError(error)) {
      console.error("Detalhes do erro:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    }
    res.status(500).json({ error: "Erro ao buscar procedimentos diários" });
  }
};
