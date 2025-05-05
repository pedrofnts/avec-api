import { Request, Response } from "express";
import axios from "axios";
import { format, parseISO } from 'date-fns';
import { toZonedTime, format as formatTz, formatInTimeZone } from 'date-fns-tz';

const ELOS_URL = "https://botoclinic.elosclub.com.br";
const TIME_ZONE = 'America/Sao_Paulo';

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
  try {
    // Verifica se a data está no formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-');
      return `${day}/${month}/${year}`;
    }
    
    // Se não estiver no formato esperado, tenta criar um objeto Date válido
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new Error('Data inválida');
    }
    
    // Formata para DD/MM/YYYY
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    
    console.log(`[formatDateToBrazilian] Convertendo data: ${date} para ${day}/${month}/${year}`);
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error(`[formatDateToBrazilian] Erro ao converter data ${date}:`, error);
    // Em caso de erro, retorna a data atual
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    console.log(`[formatDateToBrazilian] Usando data atual: ${day}/${month}/${year}`);
    return `${day}/${month}/${year}`;
  }
};

// Função auxiliar para converter o formato de data do Elos
const formatElosDate = (elosDate: string): string => {
  if (!elosDate) return '';
  const timestamp = parseInt(elosDate.replace('/Date(', '').replace(')/', ''));
  if (isNaN(timestamp)) return '';

  const date = new Date(timestamp);

  const zonedDate = toZonedTime(date, TIME_ZONE);

  try {
    return formatTz(zonedDate, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", { timeZone: TIME_ZONE });
  } catch(e) {
    console.error("Error formatting Elos Date with date-fns-tz:", e, " Date:", zonedDate, " Timestamp:", timestamp);
    return new Date(timestamp).toISOString();
  }
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

// Interface para procedimentos processados
interface ProcessedProcedure {
  id: number;
  clientId: number;
  client: string;
  clientPhone: string;
  procedureId: number;
  procedure: string;
  localityId: number;
  locality: string;
  startTime: string;
  endTime: string;
  status: number;
  statusDescription: string;
}

// Interface para itens de procedimento da lista completa
interface ServiceItem {
  MaxDiscount: number;
  id: number;
  text: string;
  CustomHtmlFormat: string | null;
  Inactive: boolean;
  Block: boolean;
  AccessLimitNumber: number | null;
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
    const { date, procedureName, statusName } = req.body;

    console.log(`[getDailyProcedures] Parâmetros recebidos:`, { date, procedureName, statusName });

    if (!date) {
      res.status(400).json({
        error: "Data não fornecida",
        required: ["date"],
      });
      return;
    }

    // Validar formato da data (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({
        error: "Data inválida",
        required: ["date no formato YYYY-MM-DD"],
      });
      return;
    }
    
    // Formato exato igual ao que a API Elos espera
    const startDate = `${date}T03:00:00.000Z`;
    const endDate = `${date}T03:00:00.000Z`;
    
    console.log(`[getDailyProcedures] Intervalo de data para o Elos:`, {
      dataOriginal: date,
      startDate, 
      endDate
    });

    // Criar a string de cookies
    const cookies = createCookieString(authToken, structureId);

    // Criar os dados do formulário - baseado exatamente no CURL bem-sucedido
    const formData = new URLSearchParams({
      sort: "",
      page: "1",
      group: "",
      filter: "",
      establishment: "",
      locality: "",
      start: startDate,
      end: endDate,
    }).toString();

    console.log("Enviando requisição de procedimentos diários:", {
      url: `${ELOS_URL}/Scheduler/Read`,
      dados: { startDate, endDate, structureId }
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
        "sec-ch-ua": '"Chromium";v="135", "Not-A.Brand";v="8"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36",
        "x-requested-with": "XMLHttpRequest",
        cookie: cookies,
      },
      validateStatus: function (status) {
        return status >= 200 && status < 500; // Aceita códigos 2xx, 3xx e 4xx para processar erros manualmente
      },
    });

    // Verificar se houve erro de autenticação
    if (response.status === 401 || response.status === 403) {
      console.error("Erro de autenticação na API Elos:", {
        status: response.status,
        data: response.data
      });
      res.status(401).json({ error: "Token inválido ou expirado" });
      return;
    }

    // Verificar se a resposta é um HTML (provavelmente página de login)
    if (typeof response.data === 'string' && 
        (response.data.includes('<html') || 
         response.data.includes('<!DOCTYPE html'))) {
      console.error("Recebida página HTML em vez de JSON - possível erro de autenticação:", {
        status: response.status,
        data: response.data.substring(0, 200) + '...' // Exibir apenas os primeiros 200 caracteres
      });
      res.status(401).json({ error: "Token inválido ou expirado" });
      return;
    }

    // Verificar se a resposta contém dados válidos em formato JSON
    if (!response.data || typeof response.data !== 'object' || !response.data.Data) {
      console.error("Resposta inválida da API Elos:", {
        status: response.status,
        data: response.data
      });
      res.status(500).json({ error: "Erro ao processar resposta da API" });
      return;
    }

    // Extrair e mapear os procedimentos da resposta
    const allProcedures = response.data.Data
      ? response.data.Data.map((item: ScheduleItem) => {
          const startTimeISO = formatElosDate(item.Start);
          const endTimeISO = formatElosDate(item.End);

          let appointmentDate = '';
          let appointmentHour = '';

          try {
              if (startTimeISO) {
                  const parsedDate = parseISO(startTimeISO);
                  appointmentDate = formatInTimeZone(parsedDate, TIME_ZONE, 'dd/MM/yyyy');
                  appointmentHour = formatInTimeZone(parsedDate, TIME_ZONE, 'HH:mm');
              }
          } catch (e) {
              console.error(`Error parsing or formatting date ${startTimeISO}:`, e);
              try {
                if (startTimeISO) {
                    const parsedDate = new Date(startTimeISO);
                    appointmentDate = format(parsedDate, 'dd/MM/yyyy');
                    appointmentHour = format(parsedDate, 'HH:mm');
                }
              } catch (fallbackError) {
                 console.error(`Fallback date formatting also failed for ${startTimeISO}:`, fallbackError);
              }
          }

          // Retornar a interface ProcessedProcedure completa
          return {
            id: item.Id,
            clientId: item.Client_Id,
            client: item.Client_Name,
            clientPhone: item.Client_FlattenedPhones,
            procedureId: item.Item_Id,
            procedure: item.Item_Name, // Manter o nome original aqui
            localityId: item.Locality_Id,
            locality: item.Locality_Name,
            startTime: startTimeISO,
            endTime: endTimeISO,
            status: item.Status,
            statusDescription: item.StatusDescription,
            appointmentDate: appointmentDate,
            appointmentHour: appointmentHour,
          };
        })
      : [];

    // FILTRAGEM CRÍTICA: Filtrar somente os procedimentos da data solicitada
    let filteredProcedures = allProcedures.filter((proc: any) => { // Usar 'any' temporariamente ou definir a interface ProcessedProcedure com appointmentDate/Hour
      const procDate = proc.startTime.split('T')[0];
      return procDate === date;
    });

    console.log(`[getDailyProcedures] Total após filtro de data (${date}): ${filteredProcedures.length}`);

    // FILTRAGEM ADICIONAL: Filtrar por procedureName, se fornecido
    if (procedureName && typeof procedureName === 'string' && procedureName.trim() !== '') {
      const searchTerm = procedureName.trim().toLowerCase();
      filteredProcedures = filteredProcedures.filter((proc: any) => {
          return proc.procedure && typeof proc.procedure === 'string' && 
                 proc.procedure.toLowerCase().includes(searchTerm);
      });
      console.log(`[getDailyProcedures] Filtrando por procedureName: '${procedureName}'. Total após filtro: ${filteredProcedures.length}`);
    }

    // FILTRAGEM ADICIONAL: Filtrar por statusName, se fornecido
    if (statusName && typeof statusName === 'string' && statusName.trim() !== '') {
      const searchTerm = statusName.trim().toLowerCase();
      filteredProcedures = filteredProcedures.filter((proc: any) => {
        // Verificar se proc.statusDescription existe e é string antes de chamar toLowerCase()
        return proc.statusDescription && typeof proc.statusDescription === 'string' &&
               proc.statusDescription.toLowerCase().includes(searchTerm);
      });
      console.log(`[getDailyProcedures] Filtrando por statusName: '${statusName}'. Total após filtro: ${filteredProcedures.length}`);
    }


    console.log("Resposta final de procedimentos diários:", {
      dataFiltrada: date,
      filtroNome: procedureName || 'N/A',
      filtroStatus: statusName || 'N/A', // Adicionar log do filtro de status
      totalFinal: filteredProcedures.length
    });

    res.json({
      success: true,
      date: date,
      total: filteredProcedures.length,
      procedures: filteredProcedures,
    });
  } catch (error) {
    console.error("Erro ao buscar procedimentos diários:", error);
    if (axios.isAxiosError(error)) {
      console.error("Detalhes do erro:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
      
      // Verificar se é um erro de autenticação
      if (error.response?.status === 401 || error.response?.status === 403 ||
          (error.response?.data && typeof error.response.data === 'string' && 
           (error.response.data.includes('<html') || 
            error.response.data.includes('<!DOCTYPE html')))) {
        res.status(401).json({ error: "Token inválido ou expirado" });
        return;
      }
    }
    res.status(500).json({ error: "Erro ao buscar procedimentos diários" });
  }
};

// Função para listar todos os procedimentos
export const getAllProcedures = async (req: Request, res: Response) => {
  try {
    console.log("[getAllProcedures] Recebendo requisição:", {
      method: req.method,
      path: req.path,
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

    // Obter parâmetros opcionais de consulta
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 200;
    const pageNum = req.query.pageNum ? parseInt(req.query.pageNum as string) : 1;
    const searchTerm = req.query.searchTerm || "";

    // Criar a string de cookies
    const cookies = createCookieString(authToken, structureId);

    const timestamp = new Date().getTime();
    const url = `${ELOS_URL}/Search/Get?searchTerm=${searchTerm}&pageSize=${pageSize}&pageNum=${pageNum}&searchName=ServiceItem&extraCondition=&_=${timestamp}`;

    console.log("Enviando requisição para listar procedimentos:", {
      url,
    });

    const response = await axios.get(url, {
      headers: {
        accept: "application/json, text/javascript, */*; q=0.01",
        "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "cache-control": "no-cache",
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
    });

    // Transformar a resposta para o formato desejado
    const transformedResponse = {
      success: true,
      total: response.data.Total || 0,
      procedures: response.data.Results
        ? response.data.Results.map((item: ServiceItem) => ({
            id: item.id,
            nome: item.text,
            desconto_maximo: item.MaxDiscount,
            inativo: item.Inactive,
            bloqueado: item.Block,
            limite_acesso: item.AccessLimitNumber,
          }))
        : [],
    };

    console.log("Resposta transformada de procedimentos:", {
      total: transformedResponse.total,
    });

    res.json(transformedResponse);
  } catch (error) {
    console.error("Erro ao listar procedimentos:", error);
    if (axios.isAxiosError(error)) {
      console.error("Detalhes do erro:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    }
    res.status(500).json({ error: "Erro ao listar procedimentos" });
  }
};
