import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';

type AgendaRow = {
  id: string;
  data_agendamento: string;
  hora_inicio: string;
  hora_fim: string;
  status: string;
  tipo: string;
  organization_id: string;
  clinica_nome: string;
  unidade_nome: string | null;
  convenio_nome: string | null;
  procedimento_nome: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  'Agendado': 'bg-sky-100 text-sky-700',
  'Confirmado': 'bg-emerald-100 text-emerald-700',
  'Recepcionado': 'bg-blue-100 text-blue-700',
  'Triagem': 'bg-violet-100 text-violet-700',
  'Em Atendimento': 'bg-teal-100 text-teal-700',
  'Em Observação': 'bg-yellow-100 text-yellow-700',
  'Concluído': 'bg-slate-100 text-slate-600',
  'Atendido': 'bg-slate-100 text-slate-600',
  'Cancelado': 'bg-red-100 text-red-600',
  'Faltou': 'bg-orange-100 text-orange-600',
};

const PERIODO_OPTIONS = [
  { label: 'Hoje', days: 0 },
  { label: 'Próximos 7 dias', days: 7 },
  { label: 'Próximos 30 dias', days: 30 },
  { label: 'Últimos 7 dias', days: -7 },
  { label: 'Últimos 30 dias', days: -30 },
];

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function buildRange(days: number): { start: string; end: string } {
  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);
  if (days >= 0) {
    end.setDate(today.getDate() + days);
  } else {
    start.setDate(today.getDate() + days);
  }
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { start: fmt(start), end: fmt(end) };
}

export default function AgendaPage() {
  const [rows, setRows] = useState<AgendaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodoIdx, setPeriodoIdx] = useState(0);
  const [clinicaFiltro, setClinicaFiltro] = useState('todas');
  const [statusFiltro, setStatusFiltro] = useState('todos');

  useEffect(() => {
    void carregarAgenda();
  }, [periodoIdx]);

  const carregarAgenda = async () => {
    setLoading(true);
    try {
      const { days } = PERIODO_OPTIONS[periodoIdx];
      const { start, end } = buildRange(days);

      const query = supabase
        .from('vw_professional_schedule')
        .select('*')
        .gte('data_agendamento', start)
        .lte('data_agendamento', end)
        .order('data_agendamento')
        .order('hora_inicio');

      const { data, error } = await query;
      if (error) throw error;
      setRows((data as AgendaRow[]) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clinicas = useMemo(() => {
    const set = new Set(rows.map(r => r.clinica_nome));
    return Array.from(set).sort();
  }, [rows]);

  const statuses = useMemo(() => {
    const set = new Set(rows.map(r => r.status).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (clinicaFiltro !== 'todas' && r.clinica_nome !== clinicaFiltro) return false;
      if (statusFiltro !== 'todos' && r.status !== statusFiltro) return false;
      return true;
    });
  }, [rows, clinicaFiltro, statusFiltro]);

  // Group by date
  const byDate = useMemo(() => {
    const map = new Map<string, AgendaRow[]>();
    filtered.forEach(r => {
      const list = map.get(r.data_agendamento) ?? [];
      list.push(r);
      map.set(r.data_agendamento, list);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const totalAtivos = rows.filter(r =>
    !['Cancelado', 'Faltou', 'Desmarcado', 'Remarcado', 'Transferido'].includes(r.status)
  ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-10 pt-24 sm:pt-20">
        {/* Hero */}
        <div className="mb-6 rounded-[2rem] bg-teal-700 px-6 py-6 text-white shadow-lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Consultar Agenda</h1>
              <p className="mt-1 text-sm text-teal-100">
                Todas as clínicas · {totalAtivos} agendamentos ativos no período
              </p>
            </div>
            <button
              onClick={() => void carregarAgenda()}
              className="self-start rounded-2xl bg-white/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/25 sm:self-auto"
            >
              <i className="ri-refresh-line mr-1.5"></i>Atualizar
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-wrap gap-3">
          <select
            value={periodoIdx}
            onChange={e => setPeriodoIdx(Number(e.target.value))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-teal-400"
          >
            {PERIODO_OPTIONS.map((o, i) => (
              <option key={i} value={i}>{o.label}</option>
            ))}
          </select>

          <select
            value={clinicaFiltro}
            onChange={e => setClinicaFiltro(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-teal-400"
          >
            <option value="todas">Todas as clínicas</option>
            {clinicas.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={statusFiltro}
            onChange={e => setStatusFiltro(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-teal-400"
          >
            <option value="todos">Todos os status</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-[2rem] bg-slate-200" />)}
          </div>
        ) : byDate.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-12 text-center shadow-sm">
            <i className="ri-calendar-2-line mb-3 text-5xl text-slate-300"></i>
            <p className="text-lg font-medium text-slate-700">Nenhum agendamento no período</p>
            <p className="mt-1 text-sm text-slate-500">Tente selecionar um intervalo de datas diferente.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {byDate.map(([date, items]) => (
              <div key={date}>
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-2xl bg-teal-700 px-3 py-1 text-sm font-bold text-white">
                    {fmtDate(date)}
                  </div>
                  <span className="text-sm text-slate-500">{items.length} agendamento(s)</span>
                </div>

                <div className="space-y-2">
                  {items.map(row => (
                    <div
                      key={row.id}
                      className="flex flex-col gap-3 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-700">
                          {row.hora_inicio?.slice(0, 5)}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-900">{row.clinica_nome}</span>
                            {row.unidade_nome && (
                              <span className="text-sm text-slate-500">· {row.unidade_nome}</span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                            {row.convenio_nome && <span>{row.convenio_nome}</span>}
                            {row.procedimento_nome && (
                              <><span>·</span><span>{row.procedimento_nome}</span></>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[row.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {row.status}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500 capitalize">
                          {row.tipo}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
