import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';

type ReportRow = {
  organization_id: string;
  clinica_nome: string;
  status: string;
  tipo: string;
  mes: string;
  quantidade: number;
};

function fmtMes(isoMonth: string) {
  const [y, m] = isoMonth.split('-');
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  return `${months[parseInt(m) - 1]} ${y}`;
}

const STATUS_COLORS: Record<string, string> = {
  'Concluído': 'bg-slate-100 text-slate-700',
  'Atendido': 'bg-slate-100 text-slate-700',
  'Em Atendimento': 'bg-teal-100 text-teal-700',
  'Em Observação': 'bg-yellow-100 text-yellow-700',
  'Cancelado': 'bg-red-100 text-red-700',
  'Faltou': 'bg-orange-100 text-orange-700',
  'Agendado': 'bg-sky-100 text-sky-700',
  'Confirmado': 'bg-emerald-100 text-emerald-700',
};

const ANOS = [2026, 2025];

export default function RelatoriosPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [anoSelecionado, setAnoSelecionado] = useState(2026);
  const [clinicaFiltro, setClinicaFiltro] = useState('todas');
  const [mesFiltro, setMesFiltro] = useState('todos');

  useEffect(() => {
    void carregarRelatorio();
  }, [anoSelecionado]);

  const carregarRelatorio = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vw_professional_attendance_report')
        .select('*')
        .gte('mes', `${anoSelecionado}-01-01`)
        .lte('mes', `${anoSelecionado}-12-31`)
        .order('mes', { ascending: false });

      if (error) throw error;
      setRows((data as ReportRow[]) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clinicas = useMemo(() => Array.from(new Set(rows.map(r => r.clinica_nome))).sort(), [rows]);
  const meses = useMemo(() => Array.from(new Set(rows.map(r => r.mes))).sort().reverse(), [rows]);

  const filtered = useMemo(() => rows.filter(r => {
    if (clinicaFiltro !== 'todas' && r.clinica_nome !== clinicaFiltro) return false;
    if (mesFiltro !== 'todos' && r.mes !== mesFiltro) return false;
    return true;
  }), [rows, clinicaFiltro, mesFiltro]);

  // Summary
  const totalRealizados = filtered
    .filter(r => ['Concluído', 'Atendido', 'Em Atendimento', 'Em Observação'].includes(r.status))
    .reduce((s, r) => s + Number(r.quantidade), 0);

  const totalCancelados = filtered
    .filter(r => ['Cancelado', 'Faltou', 'Desmarcado'].includes(r.status))
    .reduce((s, r) => s + Number(r.quantidade), 0);

  const totalGeral = filtered.reduce((s, r) => s + Number(r.quantidade), 0);
  const taxaRealizacao = totalGeral > 0 ? Math.round((totalRealizados / totalGeral) * 100) : 0;

  // Group by clinica → mes → status
  const porClinica = useMemo(() => {
    const map = new Map<string, Map<string, ReportRow[]>>();
    filtered.forEach(r => {
      if (!map.has(r.clinica_nome)) map.set(r.clinica_nome, new Map());
      const byMes = map.get(r.clinica_nome)!;
      if (!byMes.has(r.mes)) byMes.set(r.mes, []);
      byMes.get(r.mes)!.push(r);
    });
    return Array.from(map.entries()).map(([clinica, byMes]) => ({
      clinica,
      meses: Array.from(byMes.entries())
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([mes, statuses]) => ({
          mes,
          statuses: statuses.sort((a, b) => b.quantidade - a.quantidade),
          total: statuses.reduce((s, r) => s + Number(r.quantidade), 0),
        })),
    }));
  }, [filtered]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-28 pt-16 md:pb-10 md:pt-20">
        {/* Hero */}
        <div className="mb-6 rounded-[2rem] bg-teal-700 px-6 py-6 text-white shadow-lg">
          <h1 className="text-2xl font-bold">Relatórios de Atendimento</h1>
          <p className="mt-1 text-sm text-teal-100">Desempenho por clínica, mês e status</p>
        </div>

        {/* Summary */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Realizados', value: loading ? '—' : totalRealizados, icon: 'ri-checkbox-circle-line', color: 'bg-teal-100 text-teal-700' },
            { label: 'Cancelados / Faltou', value: loading ? '—' : totalCancelados, icon: 'ri-close-circle-line', color: 'bg-red-100 text-red-700' },
            { label: 'Taxa de realização', value: loading ? '—' : `${taxaRealizacao}%`, icon: 'ri-pie-chart-line', color: 'bg-sky-100 text-sky-700' },
          ].map(card => (
            <div key={card.label} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`mb-2 flex h-11 w-11 items-center justify-center rounded-2xl ${card.color}`}>
                <i className={`${card.icon} text-2xl`}></i>
              </div>
              <div className="text-sm text-slate-500">{card.label}</div>
              <div className="mt-1 text-3xl font-bold text-slate-900">{card.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-wrap gap-3">
          <select
            value={anoSelecionado}
            onChange={e => setAnoSelecionado(Number(e.target.value))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-teal-400"
          >
            {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
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
            value={mesFiltro}
            onChange={e => setMesFiltro(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-teal-400"
          >
            <option value="todos">Todos os meses</option>
            {meses.map(m => <option key={m} value={m}>{fmtMes(m)}</option>)}
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-40 animate-pulse rounded-[2rem] bg-slate-200" />)}
          </div>
        ) : porClinica.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-12 text-center shadow-sm">
            <i className="ri-bar-chart-line mb-3 text-5xl text-slate-300"></i>
            <p className="text-lg font-medium text-slate-700">Nenhum dado no período</p>
          </div>
        ) : (
          <div className="space-y-5">
            {porClinica.map(({ clinica, meses: mesList }) => (
              <div key={clinica} className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="text-lg font-bold text-slate-900">{clinica}</h2>
                </div>

                <div className="divide-y divide-slate-100">
                  {mesList.map(({ mes, statuses, total }) => (
                    <div key={mes} className="px-6 py-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">{fmtMes(mes)}</span>
                        <span className="text-sm text-slate-500">{total} total</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {statuses.map(s => (
                          <div key={s.status} className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[s.status] ?? 'bg-slate-100 text-slate-600'}`}>
                            <span>{s.status}</span>
                            <span className="font-bold">{s.quantidade}</span>
                          </div>
                        ))}
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
