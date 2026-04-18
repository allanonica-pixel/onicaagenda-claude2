import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';

type BillingRow = {
  organization_id: string;
  clinica_nome: string;
  convenio_nome: string | null;
  mes: string;
  total_agendamentos: number;
  atendimentos_realizados: number;
  valor_estimado: number;
};

function fmtCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function fmtMes(isoMonth: string) {
  const [y, m] = isoMonth.split('-');
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${months[parseInt(m) - 1]}/${y}`;
}

const ANOS = [2026, 2025];

export default function FaturamentoPage() {
  const [rows, setRows] = useState<BillingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [anoSelecionado, setAnoSelecionado] = useState(2026);
  const [clinicaFiltro, setClinicaFiltro] = useState('todas');

  useEffect(() => {
    void carregarFaturamento();
  }, [anoSelecionado]);

  const carregarFaturamento = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vw_professional_billing_estimate')
        .select('*')
        .gte('mes', `${anoSelecionado}-01-01`)
        .lte('mes', `${anoSelecionado}-12-31`)
        .order('mes', { ascending: false });

      if (error) throw error;
      setRows((data as BillingRow[]) || []);
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

  const filtered = useMemo(() => {
    if (clinicaFiltro === 'todas') return rows;
    return rows.filter(r => r.clinica_nome === clinicaFiltro);
  }, [rows, clinicaFiltro]);

  // Summary cards
  const totalEstimado = filtered.reduce((s, r) => s + Number(r.valor_estimado), 0);
  const totalAtendimentos = filtered.reduce((s, r) => s + Number(r.atendimentos_realizados), 0);

  // Group by clinica
  const porClinica = useMemo(() => {
    const map = new Map<string, { clinica: string; total: number; atendimentos: number; meses: BillingRow[] }>();
    filtered.forEach(r => {
      const entry = map.get(r.clinica_nome) ?? { clinica: r.clinica_nome, total: 0, atendimentos: 0, meses: [] };
      entry.total += Number(r.valor_estimado);
      entry.atendimentos += Number(r.atendimentos_realizados);
      entry.meses.push(r);
      map.set(r.clinica_nome, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filtered]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-28 pt-16 md:pb-10 md:pt-20">
        {/* Hero */}
        <div className="mb-6 rounded-[2rem] bg-teal-700 px-6 py-6 text-white shadow-lg">
          <h1 className="text-2xl font-bold">Estimativa de Faturamento</h1>
          <p className="mt-1 text-sm text-teal-100">
            Baseado nos procedimentos realizados e tabelas de valores cadastradas
          </p>
        </div>

        {/* Summary cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
              <i className="ri-money-dollar-circle-line text-2xl"></i>
            </div>
            <div className="text-sm text-slate-500">Total estimado no período</div>
            <div className="mt-1 text-3xl font-bold text-slate-900">
              {loading ? '—' : fmtCurrency(totalEstimado)}
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
              <i className="ri-stethoscope-line text-2xl"></i>
            </div>
            <div className="text-sm text-slate-500">Atendimentos realizados</div>
            <div className="mt-1 text-3xl font-bold text-slate-900">
              {loading ? '—' : totalAtendimentos}
            </div>
          </div>
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
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-32 animate-pulse rounded-[2rem] bg-slate-200" />)}
          </div>
        ) : porClinica.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-12 text-center shadow-sm">
            <i className="ri-money-dollar-circle-line mb-3 text-5xl text-slate-300"></i>
            <p className="text-lg font-medium text-slate-700">Nenhum dado de faturamento</p>
            <p className="mt-1 text-sm text-slate-500">
              Para aparecer aqui, os procedimentos precisam ter valores cadastrados nas tabelas de valores de cada clínica.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {porClinica.map(clinica => (
              <div key={clinica.clinica} className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{clinica.clinica}</h2>
                    <p className="text-sm text-slate-500">{clinica.atendimentos} atendimentos realizados</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Total estimado</div>
                    <div className="text-xl font-bold text-teal-700">{fmtCurrency(clinica.total)}</div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                          <th className="pb-2 pr-4">Mês</th>
                          <th className="pb-2 pr-4">Convênio</th>
                          <th className="pb-2 pr-4 text-right">Agendamentos</th>
                          <th className="pb-2 pr-4 text-right">Realizados</th>
                          <th className="pb-2 text-right">Estimativa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {clinica.meses.map((row, i) => (
                          <tr key={i} className="text-slate-700">
                            <td className="py-2.5 pr-4 font-medium">{fmtMes(row.mes)}</td>
                            <td className="py-2.5 pr-4 text-slate-500">{row.convenio_nome || 'Particular'}</td>
                            <td className="py-2.5 pr-4 text-right">{row.total_agendamentos}</td>
                            <td className="py-2.5 pr-4 text-right">{row.atendimentos_realizados}</td>
                            <td className="py-2.5 text-right font-semibold text-teal-700">
                              {fmtCurrency(Number(row.valor_estimado))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          * Estimativa baseada nos valores da tabela cadastrada. Valores reais podem variar conforme glosas, ajustes e descontos.
        </p>
      </main>
    </div>
  );
}
