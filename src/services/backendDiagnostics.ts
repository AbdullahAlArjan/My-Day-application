import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';

export interface DiagnosticsReport {
  isConfigured: boolean;
  supabaseUrl: string;
  pingMs: number;
  tables: Record<
    string,
    {
      ok: boolean;
      status: number;
      error?: string;
      code?: string;
      hint?: string;
    }
  >;
  allTablesOk: boolean;
  needsSqlGrant: boolean;
  authOk: boolean;
  authMessage?: string;
  recommendedSql: string;
}

export const RECOMMENDED_GRANT_SQL = `-- Run this in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- 1. Grant usage on public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Grant all permissions on all existing tables in public schema
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. Grant all permissions on all sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Grant execute permissions on functions
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 5. Automatically grant permissions for future tables and sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
`;

export const backendDiagnostics = {
  async runFullDiagnostics(): Promise<DiagnosticsReport> {
    const isConfigured = isSupabaseConfigured();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'Not configured';

    if (!isConfigured) {
      return {
        isConfigured: false,
        supabaseUrl,
        pingMs: 0,
        tables: {},
        allTablesOk: false,
        needsSqlGrant: false,
        authOk: false,
        authMessage: 'Supabase URL or Key not set in environment.',
        recommendedSql: RECOMMENDED_GRANT_SQL,
      };
    }

    const t0 = performance.now();
    let pingMs = 0;
    let authOk = true;
    let authMessage: string | undefined = undefined;

    try {
      const authRes = await supabase.auth.getSession();
      pingMs = Math.round(performance.now() - t0);
      if (authRes.error) {
        authOk = false;
        authMessage = authRes.error.message;
      }
    } catch (e: any) {
      authOk = false;
      authMessage = e?.message || 'Failed to reach Supabase Auth';
      pingMs = Math.round(performance.now() - t0);
    }

    const targetTables = ['tasks', 'categories', 'subtasks', 'profiles', 'user_settings'];
    const tables: DiagnosticsReport['tables'] = {};
    let allTablesOk = true;
    let needsSqlGrant = false;

    for (const tableName of targetTables) {
      try {
        const { error, status } = await supabase.from(tableName).select('*').limit(1);
        if (error) {
          allTablesOk = false;
          if (error.code === '42501' || error.message?.includes('permission denied')) {
            needsSqlGrant = true;
          }
          tables[tableName] = {
            ok: false,
            status,
            error: error.message,
            code: error.code,
            hint: (error as any).hint,
          };
        } else {
          tables[tableName] = {
            ok: true,
            status: status || 200,
          };
        }
      } catch (err: any) {
        allTablesOk = false;
        tables[tableName] = {
          ok: false,
          status: 500,
          error: err.message || 'Unknown network error',
        };
      }
    }

    return {
      isConfigured: true,
      supabaseUrl,
      pingMs,
      tables,
      allTablesOk,
      needsSqlGrant,
      authOk,
      authMessage,
      recommendedSql: RECOMMENDED_GRANT_SQL,
    };
  },
};
