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
      (req.headers["x-organization-structure"] as string) || "58";

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
    } = req.body;

    // Validar parâmetros obrigatórios
    if (!start || !end) {
      res.status(400).json({
        error: "Parâmetros de data não fornecidos",
        required: ["start", "end"],
      });
      return;
    }

    // Criar a string de cookies
    const cookies = createCookieString(authToken, structureId);

    // Criar os dados do formulário
    const formData = new URLSearchParams({
      sort: sort.toString(),
      page: page.toString(),
      pageSize: pageSize.toString(),
      group: group.toString(),
      filter: filter.toString(),
      establishment: establishment.toString(),
      locality: locality.toString(),
      start: start.toString(),
      end: end.toString(),
    }).toString();

    console.log("Enviando requisição de agendamentos:", {
      url: `${ELOS_URL}/Scheduler/Read`,
      dados: { start, end, structureId },
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

    console.log("Resposta de agendamentos recebida");

    res.json(response.data);
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

// Função para buscar períodos de disponibilidade
export const getAvailabilityPeriods = async (req: Request, res: Response) => {
  try {
    console.log("[getAvailabilityPeriods] Recebendo requisição:", {
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
      SelectedSessions,
      InitDate,
      EndDate,
      InitTime,
      EndTime,
      AllowDocking,
      Locality_Id,
      OrganizationStructureSelected_Id,
      NumberOfNearbyEstablishments,
      Rescheduler_Id,
    } = req.body;

    // Validar parâmetros obrigatórios
    if (!Client_Id || !ItemClassifier_Id || !InitDate || !EndDate) {
      res.status(400).json({
        error: "Parâmetros obrigatórios não fornecidos",
        required: ["Client_Id", "ItemClassifier_Id", "InitDate", "EndDate"],
      });
      return;
    }

    // Criar a string de cookies
    const cookies = createCookieString(authToken, structureId);

    // Criar os dados do formulário
    const formData = new URLSearchParams();

    // Adicionar cada parâmetro, verificando se não é undefined
    if (Client_Id) formData.append("Client_Id", Client_Id.toString());
    if (ItemClassifier_Id)
      formData.append("ItemClassifier_Id", ItemClassifier_Id.toString());
    if (SelectedSessions)
      formData.append("SelectedSessions", SelectedSessions.toString());
    if (InitDate) formData.append("InitDate", InitDate);
    if (EndDate) formData.append("EndDate", EndDate);
    if (InitTime) formData.append("InitTime", InitTime);
    if (EndTime) formData.append("EndTime", EndTime);
    if (AllowDocking !== undefined)
      formData.append("AllowDocking", AllowDocking.toString());
    if (Locality_Id) formData.append("Locality_Id", Locality_Id.toString());
    if (OrganizationStructureSelected_Id)
      formData.append(
        "OrganizationStructureSelected_Id",
        OrganizationStructureSelected_Id.toString()
      );
    if (NumberOfNearbyEstablishments)
      formData.append(
        "NumberOfNearbyEstablishments",
        NumberOfNearbyEstablishments.toString()
      );
    if (Rescheduler_Id)
      formData.append("Rescheduler_Id", Rescheduler_Id.toString());

    console.log("Enviando requisição de períodos de disponibilidade:", {
      url: `${ELOS_URL}/Scheduler/AvailabilityPeriods`,
      dados: req.body,
    });

    const response = await axios.post(
      `${ELOS_URL}/Scheduler/AvailabilityPeriods`,
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

    console.log("Resposta de períodos de disponibilidade recebida");

    res.json(response.data);
  } catch (error) {
    console.error("Erro ao buscar períodos de disponibilidade:", error);
    if (axios.isAxiosError(error)) {
      console.error("Detalhes do erro:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    }
    res
      .status(500)
      .json({ error: "Erro ao buscar períodos de disponibilidade" });
  }
};

// Função para submeter disponibilidade (agendar)
export const submitAvailability = async (req: Request, res: Response) => {
  try {
    console.log("[submitAvailability] Recebendo requisição:", {
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

    // Extrair os parâmetros do corpo da requisição
    const { model, selected } = req.body;

    // Validar parâmetros obrigatórios
    if (!model || !selected) {
      res.status(400).json({
        error: "Parâmetros não fornecidos",
        required: ["model", "selected"],
      });
      return;
    }

    // Criar a string de cookies
    const cookies = createCookieString(authToken, structureId);

    // Formatar os dados exatamente conforme esperado pela API
    const formData = new URLSearchParams();

    // Adicionar os parâmetros do modelo conforme o formato esperado
    formData.append("model[Client_Id]", model.Client_Id.toString());
    formData.append(
      "model[ItemClassifier_Id]",
      model.ItemClassifier_Id.toString()
    );
    formData.append("model[SelectedSessions]", model.SelectedSessions || "");
    if (model.Rescheduler_Id)
      formData.append("model[Rescheduler_Id]", model.Rescheduler_Id.toString());
    if (model.ChangeAllEventLink !== undefined)
      formData.append(
        "model[ChangeAllEventLink]",
        model.ChangeAllEventLink ? "True" : "False"
      );
    if (model.IgnoreParallelValidation !== undefined)
      formData.append(
        "model[IgnoreParallelValidation]",
        model.IgnoreParallelValidation ? "true" : "false"
      );

    // Adicionar os parâmetros selecionados
    formData.append("selected[InitDate]", selected.InitDate);
    formData.append("selected[EndDate]", selected.EndDate);
    formData.append("selected[Locality_Id]", selected.Locality_Id.toString());
    formData.append(
      "selected[OwnerOrgStruct_Id]",
      selected.OwnerOrgStruct_Id.toString()
    );

    console.log("Enviando requisição de agendamento:", {
      url: `${ELOS_URL}/Scheduler/SubmitAvailability`,
      dados: { model, selected },
    });

    const response = await axios.post(
      `${ELOS_URL}/Scheduler/SubmitAvailability`,
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

    console.log("Resposta de agendamento recebida:", response.data);

    res.json(response.data);
  } catch (error) {
    console.error("Erro ao submeter disponibilidade:", error);
    if (axios.isAxiosError(error)) {
      console.error("Detalhes do erro:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    }
    res.status(500).json({ error: "Erro ao submeter disponibilidade" });
  }
};

// Função para atualizar status de um agendamento
export const updateStatus = async (req: Request, res: Response) => {
  try {
    console.log("[updateStatus] Recebendo requisição:", {
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
    const { id, status, ignoreReleaseValidation, observations } = req.body;

    // Validar parâmetros obrigatórios
    if (!id || status === undefined) {
      res.status(400).json({
        error: "Parâmetros não fornecidos",
        required: ["id", "status"],
      });
      return;
    }

    // Criar a string de cookies
    const cookies = createCookieString(authToken, structureId);

    // Criar os dados do formulário
    const formData = new URLSearchParams({
      id: id.toString(),
      status: status.toString(),
      ignoreReleaseValidation: ignoreReleaseValidation ? "true" : "false",
      observations: observations || "",
    }).toString();

    console.log("Enviando requisição de atualização de status:", {
      url: `${ELOS_URL}/Scheduler/UpdateStatus`,
      dados: { id, status, ignoreReleaseValidation, observations },
    });

    const response = await axios.post(
      `${ELOS_URL}/Scheduler/UpdateStatus`,
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

    console.log("Resposta de atualização de status recebida:", response.data);

    res.json(response.data);
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    if (axios.isAxiosError(error)) {
      console.error("Detalhes do erro:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    }
    res.status(500).json({ error: "Erro ao atualizar status" });
  }
};

// Função para buscar detalhes de um agendamento por ID
export const getScheduleById = async (req: Request, res: Response) => {
  try {
    console.log("[getScheduleById] Recebendo requisição:", {
      method: req.method,
      path: req.path,
      params: req.params,
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

    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: "ID do agendamento não fornecido",
        required: ["id"],
      });
      return;
    }

    // Criar a string de cookies
    const cookies = createCookieString(authToken, structureId);

    console.log("Enviando requisição de detalhes do agendamento:", {
      url: `${ELOS_URL}/Scheduler/Form/${id}`,
      dados: { id },
    });

    const response = await axios.post(
      `${ELOS_URL}/Scheduler/Form/${id}`,
      null,
      {
        headers: {
          accept: "text/html, */*; q=0.01",
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

    // Extrair informações relevantes do HTML usando regex
    const data = response.data;
    
    // Extrair ID do agendamento
    const idMatch = data.match(/value="(\d+)"\s*\/>\s*<input\s+id="SerializedOldValue"/);
    const schedulerId = idMatch ? idMatch[1] : null;

    // Extrair ID do cliente
    const clientIdMatch = data.match(/value="(\d+)"\s*\/>\s*<input\s+data-val="true"/);
    const clientId = clientIdMatch ? clientIdMatch[1] : null;

    // Extrair nome do cliente
    const clientNameMatch = data.match(/value="([^"]+)"\s*\/><span\s+class="help-block field-validation-valid"\s+data-valmsg-for="Client_Id"/);
    const clientName = clientNameMatch ? clientNameMatch[1] : null;

    // Extrair nome do procedimento
    const procedureMatch = data.match(/value="([^"]+)"\s*\/><span\s+class="help-block field-validation-valid"\s+data-valmsg-for="Item_Name"/);
    const procedure = procedureMatch ? procedureMatch[1] : null;

    // Extrair origem
    const originMatch = data.match(/value="([^"]+)"\s*\/><span\s+class="help-block field-validation-valid"\s+data-valmsg-for="Origin_Description"/);
    const origin = originMatch ? originMatch[1] : null;

    // Extrair status
    const statusMatch = data.match(/value="([^"]+)"\s*\/><span\s+class="help-block field-validation-valid"\s+data-valmsg-for="Status"/);
    const status = statusMatch ? statusMatch[1] : null;

    // Extrair data inicial
    const initDateMatch = data.match(/value="([^"]+)"\s*\/><span\s+class="help-block field-validation-valid"\s+data-valmsg-for="InitDate"/);
    const initDate = initDateMatch ? initDateMatch[1] : null;

    // Extrair data final
    const endDateMatch = data.match(/value="([^"]+)"\s*\/><span\s+class="help-block field-validation-valid"\s+data-valmsg-for="EndDate"/);
    const endDate = endDateMatch ? endDateMatch[1] : null;

    // Extrair usuário de criação
    const createUserMatch = data.match(/value="([^"]+)"\s*\/><\/div>/);
    const createUser = createUserMatch ? createUserMatch[1] : null;

    // Extrair estabelecimento
    const establishmentMatch = data.match(/value="([^"]+)"\s*\/><span\s+class="help-block field-validation-valid"\s+data-valmsg-for="OwnerOrgStruct_Description"/);
    const establishment = establishmentMatch ? establishmentMatch[1] : null;

    // Extrair localidade
    const localityMatch = data.match(/value="([^"]+)"\s*\/><span\s+class="help-block field-validation-valid"\s+data-valmsg-for="Locality_Name"/);
    const locality = localityMatch ? localityMatch[1] : null;

    // Extrair status da pesquisa de satisfação
    const surveyMatch = data.match(/value="([^"]+)"\s*\/><span\s+class="help-block field-validation-valid"\s+data-valmsg-for="PendingSurvey"/);
    const pendingSurvey = surveyMatch ? surveyMatch[1] : null;

    const appointmentDetails = {
      id: schedulerId,
      clientId,
      clientName,
      procedure,
      origin,
      status,
      initDate,
      endDate,
      createUser,
      establishment,
      locality,
      pendingSurvey,
    };

    console.log("Detalhes do agendamento extraídos com sucesso");

    res.json({
      success: true,
      data: appointmentDetails,
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
