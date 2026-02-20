/**
 * Payment Service - Serviço de Pagamentos por Referência Multicaixa
 * 
 * Este ficheiro serve como a "ponte" entre o frontend e a futura API de pagamentos
 * (ProxyPay, Gisicash ou outro gateway). 
 * 
 * ATUALMENTE: Todas as funções são SIMULADAS (mock).
 * FUTURO: Substituir os mocks pelas chamadas reais à API.
 */

import { supabase } from "@/integrations/supabase/client";

export interface PaymentReference {
  entity_code: string;
  reference_number: string;
  amount: number;
  transactionId: string;
}

export interface PaymentVerificationResult {
  verified: boolean;
  status: "completed" | "pending" | "failed";
}

/**
 * Gera uma referência de pagamento Multicaixa.
 * 
 * @param amount - Valor do pagamento em Kz
 * @param technicianId - ID do técnico (da tabela technicians)
 * @returns Dados da referência gerada (entidade, referência, montante)
 * 
 * --- INTEGRAÇÃO FUTURA ---
 * Para integrar com ProxyPay/Gisicash:
 * 
 * 1. Substituir a entidade fixa e referência aleatória por uma chamada à API:
 *    
 *    const response = await fetch('https://api.proxypay.co.ao/v2/references', {
 *      method: 'POST',
 *      headers: {
 *        'Authorization': `Bearer ${PROXYPAY_API_KEY}`,
 *        'Content-Type': 'application/json',
 *      },
 *      body: JSON.stringify({
 *        amount: amount,
 *        end_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h validade
 *        custom_fields: { technician_id: technicianId },
 *      }),
 *    });
 *    const data = await response.json();
 *    // data.entity, data.reference, data.amount
 * 
 * 2. Guardar a referência real devolvida pela API na tabela wallet_transactions.
 * 
 * 3. Configurar Webhook em Edge Function para receber confirmação de pagamento:
 *    - Criar ficheiro: supabase/functions/payment-webhook/index.ts
 *    - Endpoint: POST /payment-webhook
 *    - O webhook da ProxyPay/Gisicash chamará este endpoint quando o pagamento for confirmado
 *    - No webhook: atualizar status para 'completed' e somar saldo ao técnico
 * ---
 */
export async function generateReference(
  amount: number,
  professionalId: string,
  professionalType: "technician" | "vendor" | "delivery" = "technician"
): Promise<PaymentReference> {
  const entity_code = "00123";
  const reference_number = generateRandomReference();

  const insertData: Record<string, any> = {
    type: "deposit",
    amount,
    balance_after: 0,
    description: `Recarga via Referência Multicaixa`,
    status: "pending",
    reference_number,
    entity_code,
    payment_type: "referencia",
  };

  if (professionalType === "technician") insertData.technician_id = professionalId;
  else if (professionalType === "vendor") insertData.vendor_id = professionalId;
  else if (professionalType === "delivery") insertData.delivery_person_id = professionalId;

  const { data, error } = await supabase
    .from("wallet_transactions")
    .insert(insertData as any)
    .select("id")
    .single();

  if (error) throw new Error(`Erro ao gerar referência: ${error.message}`);

  return {
    entity_code,
    reference_number,
    amount,
    transactionId: data.id,
  };
}

/**
 * Verifica o estado de um pagamento por referência.
 * 
 * @param referenceNumber - Número da referência a verificar
 * @returns Estado atual do pagamento
 * 
 * --- INTEGRAÇÃO FUTURA ---
 * Para integrar com ProxyPay/Gisicash:
 * 
 * 1. Substituir a consulta local pela chamada à API:
 *    
 *    const response = await fetch(
 *      `https://api.proxypay.co.ao/v2/references/${referenceNumber}`,
 *      {
 *        headers: { 'Authorization': `Bearer ${PROXYPAY_API_KEY}` },
 *      }
 *    );
 *    const data = await response.json();
 *    // Verificar data.status === 'paid'
 * 
 * 2. Se o pagamento estiver confirmado pela API, atualizar localmente:
 *    - Mudar status para 'completed'
 *    - Somar o valor ao saldo do técnico
 *    - Registar o balance_after correto
 * 
 * 3. NOTA: Com Webhooks configurados, esta função torna-se secundária
 *    (o webhook já terá atualizado o estado automaticamente).
 *    Usar apenas como fallback/verificação manual.
 * ---
 */
export async function verifyPayment(
  referenceNumber: string
): Promise<PaymentVerificationResult> {
  // === MOCK: Apenas consulta o estado local na base de dados ===
  // FUTURO: Consultar API do gateway antes de devolver o estado

  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("status")
    .eq("reference_number", referenceNumber)
    .single();

  if (error || !data) {
    return { verified: false, status: "failed" };
  }

  return {
    verified: data.status === "completed",
    status: data.status as "completed" | "pending" | "failed",
  };
}

/**
 * Confirma um pagamento pendente (usado pelo admin para simulação).
 * No futuro, esta lógica estará no Webhook.
 * 
 * --- INTEGRAÇÃO FUTURA ---
 * Esta função será movida para o Webhook (Edge Function):
 * 
 * supabase/functions/payment-webhook/index.ts:
 * 
 *   Deno.serve(async (req) => {
 *     const payload = await req.json();
 *     // Validar assinatura do webhook (HMAC)
 *     // const signature = req.headers.get('X-Signature');
 *     // if (!verifySignature(signature, payload)) return new Response('Unauthorized', { status: 401 });
 *     
 *     const { reference_id, status, amount } = payload;
 *     
 *     if (status === 'paid') {
 *       // 1. Buscar transação pela referência
 *       // 2. Atualizar status para 'completed'
 *       // 3. Somar saldo ao técnico
 *       // 4. Registar balance_after
 *     }
 *     
 *     return new Response(JSON.stringify({ success: true }));
 *   });
 * ---
 */
export async function confirmPayment(transactionId: string): Promise<boolean> {
  const { data: transaction, error: fetchError } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("id", transactionId)
    .eq("status", "pending")
    .single();

  if (fetchError || !transaction) {
    throw new Error("Transação não encontrada ou já processada.");
  }

  // Determine which professional type
  let tableName: string;
  let idColumn: string;
  let professionalId: string;

  if (transaction.technician_id) {
    tableName = "technicians";
    idColumn = "id";
    professionalId = transaction.technician_id;
  } else if (transaction.vendor_id) {
    tableName = "vendors";
    idColumn = "id";
    professionalId = transaction.vendor_id;
  } else if (transaction.delivery_person_id) {
    tableName = "delivery_persons";
    idColumn = "id";
    professionalId = transaction.delivery_person_id;
  } else {
    throw new Error("Transação sem profissional associado.");
  }

  const { data: professional, error: profError } = await supabase
    .from(tableName as any)
    .select("wallet_balance")
    .eq(idColumn, professionalId)
    .single();

  if (profError || !professional) {
    throw new Error("Profissional não encontrado.");
  }

  const newBalance = ((professional as any).wallet_balance || 0) + transaction.amount;

  const { error: updateError } = await supabase
    .from(tableName as any)
    .update({ wallet_balance: newBalance })
    .eq(idColumn, professionalId);

  if (updateError) throw new Error(`Erro ao atualizar saldo: ${updateError.message}`);

  const { error: txError } = await supabase
    .from("wallet_transactions")
    .update({
      status: "completed",
      balance_after: newBalance,
    })
    .eq("id", transactionId);

  if (txError) throw new Error(`Erro ao atualizar transação: ${txError.message}`);

  return true;
}

// === Utilitários ===

/**
 * Gera um número de referência aleatório de 9 dígitos.
 * FUTURO: Esta função será removida quando a API gerar a referência.
 */
function generateRandomReference(): string {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
}
