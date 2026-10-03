import React, { useState, useEffect } from 'react';
import { backendDiagnostics, type DiagnosticsReport, RECOMMENDED_GRANT_SQL } from '@/services/backendDiagnostics';
import { Button } from '@/components/common/Button';
import { useToast } from '@/components/common/Toast';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldAlert,
  Server,
  Zap,
} from 'lucide-react';

export const BackendStatusCard: React.FC = () => {
  const toast = useToast();
  const [report, setReport] = useState<DiagnosticsReport | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const runCheck = async () => {
    setIsChecking(true);
    try {
      const res = await backendDiagnostics.runFullDiagnostics();
      setReport(res);
      if (res.allTablesOk) {
        toast.success('Backend connection verified! All tables accessible.');
      } else if (res.needsSqlGrant) {
        toast.warning('Backend connected, but SQL table grants are required.');
      }
    } catch {
      toast.error('Failed to run backend diagnostics');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    runCheck();
  }, []);

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(RECOMMENDED_GRANT_SQL);
      setCopied(true);
      toast.success('SQL Grant Script copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  return (
    <section className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-subtle flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-brand-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Backend Connection & Database</h3>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={runCheck}
          isLoading={isChecking}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />}
        >
          Check Now
        </Button>
      </div>

      {/* Main Connection Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              !report
                ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
                : report.allTablesOk
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
            }`}
          >
            {!report ? (
              <Server className="w-5 h-5 animate-pulse" />
            ) : report.allTablesOk ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                {!report
                  ? 'Testing connection...'
                  : report.allTablesOk
                  ? 'Supabase Cloud Connected & Ready'
                  : report.needsSqlGrant
                  ? 'Permission Setup Required (Postgres 42501)'
                  : 'Backend Partially Reachable'}
              </span>
              {report && report.pingMs > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] font-mono font-medium">
                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                  {report.pingMs}ms
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] truncate max-w-sm sm:max-w-md font-mono mt-0.5">
              {report?.supabaseUrl || 'https://rakpsmscsublxidtsoif.supabase.co'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] px-2.5 py-1 rounded-full font-medium inline-block bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
            Local Storage Fallback: <strong className="text-emerald-600 dark:text-emerald-400">Active (Safe)</strong>
          </span>
        </div>
      </div>

      {/* Table statuses overview */}
      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
          {Object.entries(report.tables).map(([table, status]) => (
            <div
              key={table}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center gap-1 transition-all ${
                status.ok
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-300'
              }`}
            >
              <div className="flex items-center gap-1">
                {status.ok ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span className="text-xs font-semibold capitalize">{table}</span>
              </div>
              <span className="text-[10px] opacity-75 font-mono">
                {status.ok ? 'Ready' : status.code || 'Denied'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* SQL Grant Instruction Banner if 42501 permission issue detected */}
      {report && report.needsSqlGrant && (
        <div className="mt-2 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">
                Action Required: Grant Postgres Table Privileges in Supabase
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-1 leading-relaxed">
                Supabase returned <code className="px-1 py-0.5 rounded bg-black/10 font-mono text-[11px]">42501 permission denied</code>. 
                Your tables exist, but Supabase API roles (<code className="font-mono">anon</code> & <code className="font-mono">authenticated</code>) need table permissions.
              </p>
            </div>
          </div>

          {/* Copyable SQL Box */}
          <div className="relative">
            <pre className="p-3 rounded-lg bg-zinc-950 text-zinc-100 font-mono text-[11px] overflow-x-auto max-h-36 leading-normal border border-zinc-800">
              {RECOMMENDED_GRANT_SQL}
            </pre>
            <button
              type="button"
              onClick={handleCopySql}
              className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-medium transition-all shadow-xs border border-zinc-700"
            >
              {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-1">
            <a
              href="https://supabase.com/dashboard/project/rakpsmscsublxidtsoif/sql/new"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Open Supabase SQL Editor</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <span className="text-[11px] text-[var(--text-muted)]">
              Paste the SQL & click <strong>Run</strong>, then click <strong>Check Now</strong> above.
            </span>
          </div>
        </div>
      )}
    </section>
  );
};
