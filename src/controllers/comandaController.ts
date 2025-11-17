import { Request, Response } from "express";
import axios from "axios";

// Configurações que podem ser definidas via variáveis de ambiente
const API_BASE_URL = process.env.API_BASE_URL || "https://admin.avec.beauty";
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT || "30000");

// Função auxiliar para criar string de cookies para avec.beauty
const createCookieString = (authToken: string) => {
  return `ci3_session=${authToken}`;
};

// Função auxiliar para extrair ID da comanda do HTML
const extractComandaIdFromHTML = (htmlString: string): string | null => {
  const regex = /onclick="financeiroComanda\.abrirComanda\('([^']+)'/;
  const match = htmlString.match(regex);
  return match ? match[1] : null;
};

// Função para parsear dados básicos da comanda
const parseComandaBasica = (comanda: any[]) => {
  return {
    comandaId: extractComandaIdFromHTML(comanda[5]),
  };
};

// Função para extrair valor de um input pelo name
const extractInputValue = (html: string, name: string, context = ""): string | null => {
  const searchHtml = context || html;
  const regex = new RegExp(`name="${name}"[^>]*value="([^"]*)"`, "i");
  const match = searchHtml.match(regex);
  return match ? match[1] : null;
};

// Função para extrair data-selected-id de um select
const extractSelectedId = (html: string, className: string, context = ""): string | null => {
  const searchHtml = context || html;
  const regex = new RegExp(`class="[^"]*${className}[^"]*"[^>]*data-selected-id="([^"]*)"`, "i");
  const match = searchHtml.match(regex);
  return match ? match[1] : null;
};

// Função para extrair serviços da tabela HTML
const extractServicosFromHTML = (htmlDados: string): any[] => {
  const servicos: any[] = [];

  try {
    // Encontrar todas as linhas da tabela de itens
    // Cada item começa com <tr id='linha{N}' class='itemComanda'>
    const linhaRegex = /<tr[^>]*class=['"]itemComanda['"][^>]*>([\s\S]*?)(?=<tr[^>]*class=['"]itemComanda['"]|<\/tbody>)/gi;
    let match;

    while ((match = linhaRegex.exec(htmlDados)) !== null) {
      const linhaHtml = match[0];

      // Extrair dados do item
      const item = extractInputValue(linhaHtml, "item\\[\\]") || "";
      const itemTipo = extractInputValue(linhaHtml, "itemTipo\\[\\]") || "";
      const comandaItemId = extractInputValue(linhaHtml, "comandaItemId\\[\\]") || "";
      const quantidade = extractInputValue(linhaHtml, "itemQtde\\[\\]") || "1";
      const valor = extractInputValue(linhaHtml, "itemValor\\[\\]") || "0";
      const desconto = extractInputValue(linhaHtml, "itemDesconto\\[\\]") || "0";
      const total = extractInputValue(linhaHtml, "itemTotal\\[\\]") || "0";
      const comissao = extractInputValue(linhaHtml, "comissao\\[\\]") || "0";
      const custo = extractInputValue(linhaHtml, "custo\\[\\]") || "0";
      const reservaId = extractInputValue(linhaHtml, "reservaId\\[\\]") || "";
      const promocaoId = extractInputValue(linhaHtml, "promocaoId\\[\\]") || "0";

      // Extrair IDs selecionados
      const servicoId = extractSelectedId(linhaHtml, "sltServico");
      const profissionalId = extractSelectedId(linhaHtml, "sltProf");

      servicos.push({
        item,
        servicoId,
        profissionalId,
        quantidade: parseFloat(quantidade),
        valorUnitario: parseFloat(valor),
        desconto: parseFloat(desconto),
        valorTotal: parseFloat(total),
      });
    }
  } catch (error) {
    console.error("Erro ao extrair serviços do HTML:", error);
  }

  return servicos;
};

// Função para extrair informações do cliente do HTML da comanda
const extractClienteInfoFromComanda = (htmlDados: string): any => {
  try {
    const clienteId = extractInputValue(htmlDados, "cliente");
    const nomeClienteMatch = htmlDados.match(/id="nomeCliente"[^>]*value="([^"]*)"/);
    const nomeCliente = nomeClienteMatch ? nomeClienteMatch[1] : null;

    return {
      clienteId,
      nome: nomeCliente,
    };
  } catch (error) {
    console.error("Erro ao extrair info do cliente:", error);
    return null;
  }
};

// Função para buscar telefone e email do cliente
const fetchClienteDetalhes = async (
  clienteId: string,
  cookies: string
): Promise<{ telefone: string | null; email: string | null }> => {
  try {
    const formData = new URLSearchParams({
      id: clienteId,
      nome: "",
      tel: "",
      idr: "",
    });

    const response = await axios.post(
      `${API_BASE_URL}/admin/clientes/form`,
      formData.toString(),
      {
        headers: {
          accept: "*/*",
          "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          dnt: "1",
          origin: API_BASE_URL,
          priority: "u=1, i",
          referer: `${API_BASE_URL}/admin/financeiro/comanda/historico`,
          "sec-ch-ua": '"Not_A Brand";v="99", "Chromium";v="142"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
          "x-requested-with": "XMLHttpRequest",
          cookie: cookies,
        },
        timeout: API_TIMEOUT,
      }
    );

    // Extrair telefone
    let telefone = null;
    const celularMatch = response.data.match(/id="celular"[^>]*value="([^"]*)"/);
    if (celularMatch && celularMatch[1]) {
      telefone = celularMatch[1];
    } else {
      const celularRawMatch = response.data.match(/name="celularRaw"[^>]*value="([^"]*)"/);
      if (celularRawMatch && celularRawMatch[1]) {
        telefone = celularRawMatch[1];
      }
    }

    // Extrair email
    let email = null;
    const emailMatch = response.data.match(/name="email"[^>]*value="([^"]*)"/);
    if (emailMatch && emailMatch[1]) {
      email = emailMatch[1];
    }

    return { telefone, email };
  } catch (error) {
    console.error("Erro ao buscar detalhes do cliente:", error);
    return { telefone: null, email: null };
  }
};

// Função para extrair data da comanda
const extractDataComanda = (htmlDados: string): string | null => {
  try {
    const dataMatch = htmlDados.match(/id="dataComanda"[^>]*value="([^"]*)"/);
    return dataMatch ? dataMatch[1] : null;
  } catch (error) {
    console.error("Erro ao extrair data da comanda:", error);
    return null;
  }
};

// Função para extrair número da comanda
const extractNumeroComanda = (htmlDados: string): string | null => {
  try {
    const numeroMatch = htmlDados.match(/id="numeroDaComanda"[^>]*value="([^"]*)"/);
    return numeroMatch ? numeroMatch[1] : null;
  } catch (error) {
    console.error("Erro ao extrair número da comanda:", error);
    return null;
  }
};

// Função para extrair dados estruturados do HTML de detalhes
const parseComandaDetalhes = (
  detalhesResponse: any,
  clienteDetalhes: { telefone: string | null; email: string | null } | null = null
) => {
  if (!detalhesResponse || !detalhesResponse.sucesso) {
    return null;
  }

  const htmlDados = detalhesResponse.dados || "";

  // Extrair serviços da tabela HTML
  const servicos = extractServicosFromHTML(htmlDados);

  // Extrair informações básicas do cliente da comanda
  const clienteBasico = extractClienteInfoFromComanda(htmlDados);

  // Combinar nome da comanda com telefone/email buscados
  const cliente = {
    clienteId: clienteBasico?.clienteId || null,
    nome: clienteBasico?.nome || null,
    telefone: clienteDetalhes?.telefone || null,
    email: clienteDetalhes?.email || null,
  };

  // Extrair data e número da comanda
  const dataComanda = extractDataComanda(htmlDados);
  const numeroComanda = extractNumeroComanda(htmlDados);

  return {
    numeroComanda,
    dataComanda,
    cliente,
    servicos,
    totalServicos: servicos.length,
    valorTotalServicos: servicos.reduce((acc, s) => acc + s.valorTotal, 0),
  };
};

// Função para converter data de yyyy-MM-dd para dd/MM/yyyy
const convertDateFormat = (dateString: string): string => {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

// Função para listar comandas por data com detalhes completos
export const listComandas = async (req: Request, res: Response) => {
  try {
    console.log("[listComandas] Recebendo requisição:", {
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
    const {
      status = "2",
      parTipoComanda = "1",
      data,
      draw = "1",
      start = "0",
      length = "10",
    } = req.query;

    if (!data) {
      res.status(400).json({
        error: "Data é obrigatória",
        required: ["data"],
        format: "yyyy-MM-dd",
      });
      return;
    }

    // Converter data de yyyy-MM-dd para dd/MM/yyyy
    let parDataIni: string;
    let parDataFim: string;
    try {
      parDataIni = convertDateFormat(data as string);
      parDataFim = convertDateFormat(data as string);
    } catch (error) {
      res.status(400).json({
        error: "Formato de data inválido",
        required: ["data"],
        format: "yyyy-MM-dd",
      });
      return;
    }

    // Criar a string de cookies
    const cookies = createCookieString(authToken);

    // Construir os parâmetros de colunas do DataTables
    const columns = [
      { data: "0", name: "", searchable: "true", orderable: "true" },
      { data: "1", name: "", searchable: "true", orderable: "true" },
      { data: "2", name: "", searchable: "true", orderable: "true" },
      { data: "3", name: "", searchable: "true", orderable: "true" },
      { data: "4", name: "", searchable: "true", orderable: "true" },
      { data: "5", name: "", searchable: "true", orderable: "false" },
    ];

    // Construir query string com todos os parâmetros
    const params = new URLSearchParams({
      status: status as string,
      parTipoComanda: parTipoComanda as string,
      parDataIni: parDataIni as string,
      parDataFim: parDataFim as string,
      draw: draw as string,
      start: start as string,
      length: length as string,
      "order[0][column]": "0",
      "order[0][dir]": "asc",
      "search[value]": "",
      "search[regex]": "false",
      _: Date.now().toString(),
    });

    // Adicionar parâmetros de colunas
    columns.forEach((col, index) => {
      params.append(`columns[${index}][data]`, col.data);
      params.append(`columns[${index}][name]`, col.name);
      params.append(`columns[${index}][searchable]`, col.searchable);
      params.append(`columns[${index}][orderable]`, col.orderable);
      params.append(`columns[${index}][search][value]`, "");
      params.append(`columns[${index}][search][regex]`, "false");
    });

    const url = `${API_BASE_URL}/admin/financeiro/comanda/lista?${params.toString()}`;

    console.log("Enviando requisição de comandas:", {
      url,
      parDataIni,
      parDataFim,
      status,
      parTipoComanda,
    });

    // Buscar lista de comandas
    const listResponse = await axios.get(url, {
      headers: {
        accept: "application/json, text/javascript, */*; q=0.01",
        "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        dnt: "1",
        priority: "u=1, i",
        referer: `${API_BASE_URL}/admin/financeiro/comanda/historico`,
        "sec-ch-ua": '"Not_A Brand";v="99", "Chromium";v="142"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
        "x-requested-with": "XMLHttpRequest",
        cookie: cookies,
      },
      timeout: API_TIMEOUT,
    });

    const comandasData = listResponse.data;
    console.log("Lista de comandas recebida:", {
      recordsTotal: comandasData.recordsTotal,
      recordsFiltered: comandasData.recordsFiltered,
      totalItems: comandasData.aaData?.length || 0,
    });

    // Para cada comanda, buscar os detalhes e formatar
    const comandasFormatadas = await Promise.all(
      comandasData.aaData.map(async (comanda: any) => {
        try {
          // Parsear dados básicos
          const dadosBasicos = parseComandaBasica(comanda);

          if (!dadosBasicos.comandaId) {
            console.warn("Não foi possível extrair ID da comanda:", comanda);
            return null;
          }

          // Buscar detalhes da comanda
          const formData = new URLSearchParams({
            id: dadosBasicos.comandaId,
            origem: "comanda",
            dataReserva: "undefined",
          });

          const detalhesResponse = await axios.post(
            `${API_BASE_URL}/admin/financeiro/comanda/abrir`,
            formData.toString(),
            {
              headers: {
                accept: "application/json, text/javascript, */*; q=0.01",
                "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
                "content-type":
                  "application/x-www-form-urlencoded; charset=UTF-8",
                dnt: "1",
                origin: API_BASE_URL,
                priority: "u=1, i",
                referer: `${API_BASE_URL}/admin/financeiro/comanda/historico`,
                "sec-ch-ua": '"Not_A Brand";v="99", "Chromium";v="142"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"macOS"',
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "user-agent":
                  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
                "x-requested-with": "XMLHttpRequest",
                cookie: cookies,
              },
              timeout: API_TIMEOUT,
            }
          );

          // Extrair ID do cliente para buscar telefone/email
          const clienteBasico = extractClienteInfoFromComanda(
            detalhesResponse.data?.dados || ""
          );

          // Buscar telefone e email do cliente
          let clienteDetalhes = null;
          if (clienteBasico?.clienteId) {
            clienteDetalhes = await fetchClienteDetalhes(
              clienteBasico.clienteId,
              cookies
            );
          }

          // Parsear detalhes da comanda com dados do cliente
          const detalhes = parseComandaDetalhes(
            detalhesResponse.data,
            clienteDetalhes
          );

          return {
            id: dadosBasicos.comandaId,
            ...detalhes,
          };
        } catch (error) {
          console.error("Erro ao buscar detalhes de comanda individual:", error);
          const dadosBasicos = parseComandaBasica(comanda);
          return {
            id: dadosBasicos.comandaId,
            error: "Erro ao buscar detalhes",
          };
        }
      })
    );

    // Filtrar comandas que não puderam ser processadas (nulls)
    const comandasValidas = comandasFormatadas.filter((c) => c !== null);

    res.json(comandasValidas);
  } catch (error) {
    console.error("Erro ao listar comandas:", error);
    if (axios.isAxiosError(error)) {
      console.error("Detalhes do erro:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    }
    res.status(500).json({ error: "Erro ao listar comandas" });
  }
};
