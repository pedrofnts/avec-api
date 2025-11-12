import { Request, Response } from "express";
import axios from "axios";
import { formatAgendamentoComStatus, getAllStatus } from "../utils/statusMapper";

// Configurações que podem ser definidas via variáveis de ambiente
const API_BASE_URL = process.env.API_BASE_URL || "https://admin.avec.beauty";
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT || "30000");

// Mapeamento de IDs de profissionais por unidade
const PROFESSIONAL_IDS_BY_UNIT: { [key: string]: Array<{ id: string }> } = {
  villa: [
    {"id":"616612"},
    {"id":"702155"},
    {"id":"646886"},
    {"id":"782110"},
    {"id":"780924"},
    {"id":"780689"}
  ],
  aquarius: [
    {"id":"616612"},
    {"id":"702155"},
    {"id":"646886"},
    {"id":"782110"},
    {"id":"780924"},
    {"id":"780689"}
  ],
  uberaba: [
    {"id":"187141"},
    {"id":"187189"},
    {"id":"1031004"},
    {"id":"187581"},
    {"id":"945103"}
  ]
};

// Função auxiliar para criar string de cookies para avec.beauty
const createCookieString = (authToken: string, structureId: string = "1") => {
  return `ci3_session=${authToken}`;
};

// Função para buscar agendamentos
export const getSchedules = async (req: Request, res: Response) => {
  try {
    console.log("[getSchedules] Recebendo requisição:", {
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

    // Obter parâmetros do corpo da requisição
    const {
      sort = "",
      page = 1,
      pageSize = 100,
      group = "",
      filter = "",
      establishment = "",
      locality = "",
      start,
      end,
      data,
      profissionalIdArr,
      unidade = "villa", // Unidade padrão
    } = req.body;

    // Validar parâmetros obrigatórios
    if (!start && !data) {
      res.status(400).json({
        error: "Parâmetros de data não fornecidos",
        required: ["start e end", "ou", "data"],
      });
      return;
    }

    // Criar a string de cookies
    const cookies = createCookieString(authToken, structureId);

    let endpoint = "/admin/agenda/carregarAgenda";
    let requestData = "";
    let contentType = "application/x-www-form-urlencoded; charset=UTF-8";

    // Verificar se é formato avec.beauty ou formato genérico
    if (data) {
      // Formato avec.beauty - usar profissionais baseado na unidade
      const defaultProfissionais = PROFESSIONAL_IDS_BY_UNIT[unidade.toLowerCase()] || PROFESSIONAL_IDS_BY_UNIT.villa;

      let formattedProfissionais;
      if (profissionalIdArr) {
        // Converter IDs fornecidos para formato esperado
        formattedProfissionais = Array.isArray(profissionalIdArr)
          ? profissionalIdArr.map((id: any) => typeof id === 'object' && id.id ? id : { id: id.toString() })
          : [{ id: profissionalIdArr.toString() }];
      } else {
        // Usar profissionais padrão da unidade
        formattedProfissionais = defaultProfissionais;
      }

      requestData = `dados=${JSON.stringify({ data, profissionalIdArr: formattedProfissionais })}`;
    } else {
      // Formato genérico
      const formData = new URLSearchParams({
        sort: sort.toString(),
        page: page.toString(),
        pageSize: pageSize.toString(),
        group: group.toString(),
        filter: filter.toString(),
        establishment: establishment.toString(),
        locality: locality.toString(),
        start: start?.toString() || "",
        end: end?.toString() || "",
      });
      requestData = formData.toString();
      endpoint = "/scheduler/read";
    }

    console.log("Enviando requisição de agendamentos:", {
      url: `${API_BASE_URL}${endpoint}`,
      dados: data ? { data, profissionalIdArr: profissionalIdArr || "usando_padrão" } : { start, end, structureId },
      cookies,
      requestData: requestData.substring(0, 200) + (requestData.length > 200 ? '...' : '')
    });

    const response = await axios.post(`${API_BASE_URL}${endpoint}`, requestData, {
      headers: {
        accept: "application/json, text/javascript, */*; q=0.01",
        "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": contentType,
        dnt: "1",
        origin: API_BASE_URL,
        referer: `${API_BASE_URL}/admin/agenda`,
        "sec-ch-ua": '"Not)A;Brand";v="8", "Chromium";v="138"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
        "x-requested-with": "XMLHttpRequest",
        cookie: cookies,
      },
      timeout: API_TIMEOUT,
    });

        console.log("Resposta de agendamentos recebida");

    // Formatar agendamentos em lista simples e buscar detalhes
    const responseData = response.data;
    const agendamentos = [];

    if (responseData && responseData.dados && Array.isArray(responseData.dados)) {
      
      // Buscar detalhes de todos os agendamentos
      for (const profissional of responseData.dados) {
        if (profissional.reservas && Array.isArray(profissional.reservas)) {
          
          // Para cada agendamento, buscar os detalhes
          for (const agendamento of profissional.reservas) {
            
            try {
              // Buscar detalhes do agendamento
              const detalhesResponse = await axios.post(
                `${API_BASE_URL}/admin/agenda/viewAgendaInfo`,
                `id=${agendamento.id}`,
                {
                  headers: {
                    accept: "*/*",
                    "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
                    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                    dnt: "1",
                    origin: API_BASE_URL,
                    priority: "u=1, i",
                    referer: `${API_BASE_URL}/admin/agenda`,
                    "sec-ch-ua": '"Not)A;Brand";v="8", "Chromium";v="138"',
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": '"macOS"',
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
                    "x-requested-with": "XMLHttpRequest",
                    cookie: cookies,
                  },
                  timeout: API_TIMEOUT,
                }
              );

              // Extrair dados do cliente do HTML retornado
              const htmlResponse = detalhesResponse.data;
              const clienteMatch = htmlResponse.match(/Reserva\.dados\.cliente\s*=\s*({[^}]+});/);
              let clienteData = null;
              
              if (clienteMatch) {
                try {
                  clienteData = JSON.parse(clienteMatch[1]);
                } catch (e) {
                  console.warn("Erro ao fazer parse dos dados do cliente:", e);
                }
              }

              // Converter minutos para horário HH:MM
              const minutosParaHorario = (minutos: number): string => {
                const horas = Math.floor(minutos / 60);
                const mins = minutos % 60;
                return `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
              };

              // Calcular tempo de duração
              const tempoMinutos = parseInt(agendamento.hora_fim) - parseInt(agendamento.hora_inicio);
              const tempoHoras = Math.floor(tempoMinutos / 60);
              const tempoRestante = tempoMinutos % 60;
              const tempoDuracao = tempoHoras > 0 
                ? `${tempoHoras}h${tempoRestante > 0 ? ` ${tempoRestante}min` : ''}`
                : `${tempoRestante}min`;

              // Formatar agendamento com informações limpas para produção
              const statusInfo = formatAgendamentoComStatus(agendamento).statusInfo;
               
              agendamentos.push({
                id: agendamento.id,
                data: agendamento.data,
                horaInicio: minutosParaHorario(parseInt(agendamento.hora_inicio)),
                horaFim: minutosParaHorario(parseInt(agendamento.hora_fim)),
                duracao: tempoDuracao,
                nomeCliente: clienteData?.nome || agendamento.cliente_nome,
                telefoneCliente: clienteData?.celular || agendamento.cliente_tel,
                servico: agendamento.servico,
                profissional: agendamento.profissional,
                status: statusInfo.nome,
                observacoes: agendamento.obs || "",
                valor: null
              });

              console.log(`Detalhes obtidos para agendamento ${agendamento.id.substring(0, 20)}...`);

            } catch (error) {
              console.warn(`Erro ao buscar detalhes do agendamento ${agendamento.id.substring(0, 20)}...:`, error);
              
              // Se der erro, manter pelo menos as informações básicas
              const statusInfo = formatAgendamentoComStatus(agendamento).statusInfo;
              const tempoMinutos = parseInt(agendamento.hora_fim) - parseInt(agendamento.hora_inicio);
              const tempoHoras = Math.floor(tempoMinutos / 60);
              const tempoRestante = tempoMinutos % 60;
              const tempoDuracao = tempoHoras > 0 
                ? `${tempoHoras}h${tempoRestante > 0 ? ` ${tempoRestante}min` : ''}`
                : `${tempoRestante}min`;

              agendamentos.push({
                id: agendamento.id,
                data: agendamento.data,
                horaInicio: `${Math.floor(parseInt(agendamento.hora_inicio) / 60).toString().padStart(2, '0')}:${(parseInt(agendamento.hora_inicio) % 60).toString().padStart(2, '0')}`,
                horaFim: `${Math.floor(parseInt(agendamento.hora_fim) / 60).toString().padStart(2, '0')}:${(parseInt(agendamento.hora_fim) % 60).toString().padStart(2, '0')}`,
                duracao: tempoDuracao,
                nomeCliente: agendamento.cliente_nome,
                telefoneCliente: agendamento.cliente_tel,
                servico: agendamento.servico,
                profissional: agendamento.profissional,
                status: statusInfo.nome,
                observacoes: agendamento.obs || "",
                valor: null
              });
            }
          }
        }
      }
    }

    // Ordenar agendamentos por horário
    agendamentos.sort((a, b) => {
      const horaA = a.horaInicio.replace(':', '');
      const horaB = b.horaInicio.replace(':', '');
      return parseInt(horaA) - parseInt(horaB);
    });

    res.json({
      sucesso: true,
      total: agendamentos.length,
      data: data || null,
      agendamentos
    });
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    if (axios.isAxiosError(error)) {
      console.error("Detalhes do erro:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    }
    res.status(500).json({ error: "Erro ao buscar agendamentos" });
  }
};

// Função para buscar detalhes de um agendamento (viewAgendaInfo)
export const getScheduleDetails = async (req: Request, res: Response) => {
  try {
    console.log("[getScheduleDetails] Recebendo requisição:", {
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

    const { id } = req.body;

    if (!id) {
      res.status(400).json({
        error: "ID do agendamento não fornecido",
        required: ["id"],
      });
      return;
    }

    // Criar a string de cookies
    const cookies = createCookieString(authToken);

    console.log("Enviando requisição de detalhes do agendamento:", {
      url: `${API_BASE_URL}/admin/agenda/viewAgendaInfo`,
      id: id.substring(0, 50) + "...",
      cookies,
    });

    const response = await axios.post(
      `${API_BASE_URL}/admin/agenda/viewAgendaInfo`,
      `id=${id}`,
      {
        headers: {
          accept: "*/*",
          "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          dnt: "1",
          origin: API_BASE_URL,
          priority: "u=1, i",
          referer: `${API_BASE_URL}/admin/agenda`,
          "sec-ch-ua": '"Not)A;Brand";v="8", "Chromium";v="138"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
          "x-requested-with": "XMLHttpRequest",
          cookie: cookies,
        },
        timeout: API_TIMEOUT,
      }
    );

    console.log("Resposta de detalhes do agendamento recebida");

    // A resposta vem como HTML com JavaScript, vamos extrair os dados do cliente
    const htmlResponse = response.data;
    
    // Extrair dados do JavaScript Reserva.dados.cliente
    const clienteMatch = htmlResponse.match(/Reserva\.dados\.cliente\s*=\s*({[^}]+});/);
    let clienteData = null;
    
    if (clienteMatch) {
      try {
        clienteData = JSON.parse(clienteMatch[1]);
      } catch (e) {
        console.warn("Erro ao fazer parse dos dados do cliente:", e);
      }
    }

    // Retornar tanto o HTML original quanto os dados extraídos
    res.json({
      success: true,
      htmlResponse,
      clienteData,
      message: "Detalhes do agendamento obtidos com sucesso"
    });

  } catch (error) {
    console.error("Erro ao buscar detalhes do agendamento:", error);
    if (axios.isAxiosError(error)) {
      console.error("Detalhes do erro:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    }
    res.status(500).json({ error: "Erro ao buscar detalhes do agendamento" });
  }
};

// Função para obter todos os status disponíveis
export const getAvailableStatus = async (req: Request, res: Response) => {
  try {
    console.log("[getAvailableStatus] Recebendo requisição de status disponíveis");

    const statusList = getAllStatus();

    res.json({
      success: true,
      data: statusList,
      message: "Status disponíveis obtidos com sucesso"
    });

  } catch (error) {
    console.error("Erro ao buscar status disponíveis:", error);
    res.status(500).json({ error: "Erro ao buscar status disponíveis" });
  }
};
