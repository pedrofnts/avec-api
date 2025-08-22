// Interface para representar um status de agendamento
export interface AgendamentoStatus {
  id: string;
  nome: string;
  cor: string;
  valor: string;
}

// Mapa de status dos agendamentos
export const STATUS_AGENDAMENTO: Record<string, AgendamentoStatus> = {
  "0": {
    id: "cancelado",
    nome: "Cancelado",
    cor: "#bbb",
    valor: "0"
  },
  "0.6": {
    id: "faltou", 
    nome: "Faltou",
    cor: "#bbb",
    valor: "0.6"
  },
  "1": {
    id: "agendado",
    nome: "Agendado", 
    cor: "#087",
    valor: "1"
  },
  "1.5": {
    id: "confirmado",
    nome: "Confirmado",
    cor: "#01A4C6", 
    valor: "1.5"
  },
  "2": {
    id: "aguardando",
    nome: "Aguardando",
    cor: "#da0",
    valor: "2"
  },
  "2.0": {
    id: "aguardando",
    nome: "Aguardando",
    cor: "#da0",
    valor: "2"
  },
  "3": {
    id: "atendimento",
    nome: "Em Atendimento",
    cor: "#0a0",
    valor: "3"
  },
  "3.5": {
    id: "finalizado",
    nome: "Finalizado",
    cor: "#4035C6",
    valor: "3.5"
  },
  "4": {
    id: "pago",
    nome: "Pago",
    cor: "#e86b6f",
    valor: "4"
  }
};

// Função para obter status por valor
export const getStatusByValue = (valor: string): AgendamentoStatus | null => {
  // Primeiro tenta busca direta
  if (STATUS_AGENDAMENTO[valor]) {
    return STATUS_AGENDAMENTO[valor];
  }
  
  // Se não encontrou, tenta normalizar o valor (remover ou adicionar .0)
  const normalizedValor = valor.includes('.') ? valor.split('.')[0] : valor + '.0';
  
  return STATUS_AGENDAMENTO[normalizedValor] || null;
};

// Função para obter status por ID
export const getStatusById = (id: string): AgendamentoStatus | null => {
  return Object.values(STATUS_AGENDAMENTO).find(status => status.id === id) || null;
};

// Função para obter todos os status
export const getAllStatus = (): AgendamentoStatus[] => {
  return Object.values(STATUS_AGENDAMENTO);
};

// Função para verificar se um status é válido
export const isValidStatus = (valor: string): boolean => {
  // Primeiro verifica busca direta
  if (valor in STATUS_AGENDAMENTO) {
    return true;
  }
  
  // Se não encontrou, tenta normalizar o valor (remover ou adicionar .0)
  const normalizedValor = valor.includes('.') ? valor.split('.')[0] : valor + '.0';
  
  return normalizedValor in STATUS_AGENDAMENTO;
};

// Função para formatar um agendamento com informações de status
export const formatAgendamentoComStatus = (agendamento: any) => {
  const status = getStatusByValue(agendamento.status);
  
  return {
    ...agendamento,
    statusInfo: status ? {
      id: status.id,
      nome: status.nome,
      cor: status.cor,
      valor: status.valor
    } : {
      id: "desconhecido",
      nome: "Status Desconhecido",
      cor: "#999",
      valor: agendamento.status
    }
  };
};

// Função para agrupar agendamentos por status
export const agruparAgendamentosPorStatus = (agendamentos: any[]) => {
  const grupos: Record<string, any[]> = {};
  
  agendamentos.forEach(agendamento => {
    const status = getStatusByValue(agendamento.status);
    const statusId = status ? status.id : "desconhecido";
    
    if (!grupos[statusId]) {
      grupos[statusId] = [];
    }
    
    grupos[statusId].push(formatAgendamentoComStatus(agendamento));
  });
  
  return grupos;
}; 