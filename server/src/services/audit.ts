import { supabaseAdmin } from '../lib/supabase';

interface CreateAuditLogParams {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, any>;
}

export async function createAuditLog({
  userId,
  action,
  entity,
  entityId,
  metadata
}: CreateAuditLogParams) {
  const { error } = await supabaseAdmin
    .from('audit_logs')
    .insert({
      user_id: userId,
      action,
      entity,
      entity_id: entityId,
      metadata: metadata || {}
    });

  if (error) throw error;
  return true;
}

export async function getAuditLogs(
  userId: string,
  entity?: string,
  entityId?: string,
  limit: number = 100,
  page: number = 0
) {
  let query = supabaseAdmin
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  if (entity) {
    query = query.eq('entity', entity);
  }

  if (entityId) {
    query = query.eq('entity_id', entityId);
  }

  const { data: logs, error } = await query;

  if (error) throw error;
  return logs;
}

export async function getAuditLog(logId: string) {
  const { data: log, error } = await supabaseAdmin
    .from('audit_logs')
    .select('*')
    .eq('id', logId)
    .single();

  if (error) throw error;
  return log;
} 