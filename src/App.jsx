
import { useState, useMemo } from "react";

const MESES = ["2026-03","2026-04","2026-05","2026-06","2026-07","2026-08","2026-09","2026-10","2026-11","2026-12"];
const TABS = [
  { id: "pedidos", label: "Pedidos", icon: "🛍️" },
  { id: "clientes", label: "Clientes", icon: "👥" },
  { id: "financeiro", label: "Financeiro", icon: "💰" },
  { id: "investimentos", label: "Invest.", icon: "📦" },
];

const fmt = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const hoje = () => new Date().toISOString().split("T")[0];

const PEDIDOS_INIT = [
  { id: 1, cliente: "Ana Paula", produto: "Perfume Rose", valor: 120, parcelas: 2, parcelasPagas: 1, data: "2026-05-01", entregue: true, mes: "2026-05" },
  { id: 2, cliente: "Carla Lima", produto: "Kit Skincare", valor: 250, parcelas: 3, parcelasPagas: 0, data: "2026-05-10", entregue: false, mes: "2026-05" },
  { id: 3, cliente: "Fernanda Souza", produto: "Body Splash", valor: 80, parcelas: 1, parcelasPagas: 0, data: "2026-05-14", entregue: true, mes: "2026-05" },
];
const INV_INIT = [
  { id: 1, descricao: "Catálogo maio", valor: 400, data: "2026-05-02", mes: "2026-05" },
];

const nomeMes = (m) => {
  const [ano, mes] = m.split("-");
  return new Date(ano, mes - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
};

export default function CRM() {
  const [tab, setTab] = useState("pedidos");
  const [pedidos, setPedidos] = useState(PEDIDOS_INIT);
  const [investimentos, setInvestimentos] = useState(INV_INIT);
  const [mes, setMes] = useState("2026-05");
  const [busca, setBusca] = useState("");
  const [modalPedido, setModalPedido] = useState(false);
  const [modalInv, setModalInv] = useState(false);
  const [form, setForm] = useState({ cliente: "", produto: "", valor: "", parcelas: "1", data: hoje(), mes: "2026-05" });
  const [invForm, setInvForm] = useState({ descricao: "", valor: "", data: hoje(), mes: "2026-05" });

  const pedidosMes = useMemo(() =>
    pedidos.filter(p => p.mes === mes && (
      p.cliente.toLowerCase().includes(busca.toLowerCase()) ||
      p.produto.toLowerCase().includes(busca.toLowerCase())
    )), [pedidos, mes, busca]);

  const invMes = useMemo(() => investimentos.filter(i => i.mes === mes), [investimentos, mes]);

  const totalVendido = pedidosMes.reduce((s, p) => s + p.valor, 0);
  const totalRecebido = pedidosMes.reduce((s, p) => s + (p.valor / p.parcelas) * p.parcelasPagas, 0);
  const aReceber = totalVendido - totalRecebido;
  const totalInv = invMes.reduce((s, i) => s + i.valor, 0);
  const lucro = totalRecebido - totalInv;

  const clienteMap = useMemo(() => {
    const m = {};
    pedidosMes.forEach(p => {
      if (!m[p.cliente]) m[p.cliente] = { total: 0, deve: 0, pedidos: 0 };
      m[p.cliente].total += p.valor;
      m[p.cliente].deve += (p.valor / p.parcelas) * (p.parcelas - p.parcelasPagas);
      m[p.cliente].pedidos++;
    });
    return Object.entries(m).map(([nome, d]) => ({ nome, ...d }));
  }, [pedidosMes]);

  const marcarEntregue = (id) => setPedidos(ps => ps.map(p => p.id === id ? { ...p, entregue: true } : p));
  const pagarParcela = (id) => setPedidos(ps => ps.map(p => p.id === id && p.parcelasPagas < p.parcelas ? { ...p, parcelasPagas: p.parcelasPagas + 1 } : p));

  const salvarPedido = () => {
    if (!form.cliente || !form.produto || !form.valor) return;
    setPedidos(ps => [...ps, { ...form, id: Date.now(), valor: +form.valor, parcelas: +form.parcelas, parcelasPagas: 0, entregue: false }]);
    setForm({ cliente: "", produto: "", valor: "", parcelas: "1", data: hoje(), mes });
    setModalPedido(false);
  };

  const salvarInv = () => {
    if (!invForm.descricao || !invForm.valor) return;
    setInvestimentos(is => [...is, { ...invForm, id: Date.now(), valor: +invForm.valor }]);
    setInvForm({ descricao: "", valor: "", data: hoje(), mes });
    setModalInv(false);
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', sans-serif; background: #fdf0f5; }
    .crm { min-height: 100vh; background: linear-gradient(145deg, #fdf0f5 0%, #fff5f8 50%, #fde8f0 100%); }
    .header { background: linear-gradient(135deg, #c2185b 0%, #e91e8c 50%, #f06292 100%); padding: 20px 16px 16px; position: relative; overflow: hidden; }
    .header::before { content: ''; position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(255,255,255,0.08); border-radius: 50%; }
    .header::after { content: ''; position: absolute; bottom: -20px; left: 40%; width: 80px; height: 80px; background: rgba(255,255,255,0.05); border-radius: 50%; }
    .header-title { font-family: 'Playfair Display', serif; color: #fff; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
    .header-sub { color: rgba(255,255,255,0.75); font-size: 12px; margin-top: 2px; font-weight: 300; }
    .mes-select { background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 20px; padding: 6px 12px; font-size: 12px; font-family: 'DM Sans', sans-serif; cursor: pointer; backdrop-filter: blur(4px); }
    .mes-select option { color: #333; background: #fff; }
    .cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 16px; }
    .card { background: #fff; border-radius: 16px; padding: 14px; box-shadow: 0 2px 12px rgba(194,24,91,0.08); border: 1px solid rgba(194,24,91,0.08); position: relative; overflow: hidden; }
    .card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 16px 16px 0 0; }
    .card.pink::before { background: linear-gradient(90deg, #e91e8c, #f48fb1); }
    .card.green::before { background: linear-gradient(90deg, #2e7d32, #66bb6a); }
    .card.red::before { background: linear-gradient(90deg, #c62828, #ef5350); }
    .card.blue::before { background: linear-gradient(90deg, #1565c0, #42a5f5); }
    .card.gold::before { background: linear-gradient(90deg, #f57f17, #ffca28); }
    .card-label { font-size: 10px; color: #b0819a; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 500; }
    .card-value { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; margin-top: 4px; }
    .card.pink .card-value { color: #c2185b; }
    .card.green .card-value { color: #2e7d32; }
    .card.red .card-value { color: #c62828; }
    .card.blue .card-value { color: #1565c0; }
    .card.gold .card-value { color: #e65100; }
    .card-lucro { grid-column: 1 / -1; }
    .tabs { display: flex; background: #fff; border-bottom: 1px solid #fce4ec; padding: 0 8px; position: sticky; top: 0; z-index: 10; box-shadow: 0 2px 8px rgba(194,24,91,0.06); }
    .tab-btn { flex: 1; padding: 12px 4px; border: none; background: transparent; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 11px; color: #c9a0b5; border-bottom: 2px solid transparent; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .tab-btn.active { color: #c2185b; border-bottom-color: #c2185b; font-weight: 600; }
    .tab-icon { font-size: 16px; }
    .content { padding: 16px; }
    .search-row { display: flex; gap: 8px; margin-bottom: 14px; }
    .search-input { flex: 1; padding: 10px 14px; border-radius: 12px; border: 1.5px solid #fce4ec; background: #fff; font-family: 'DM Sans', sans-serif; font-size: 13px; color: #333; outline: none; transition: border 0.2s; }
    .search-input:focus { border-color: #e91e8c; }
    .btn-novo { background: linear-gradient(135deg, #c2185b, #e91e8c); color: #fff; border: none; border-radius: 12px; padding: 10px 16px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; box-shadow: 0 4px 12px rgba(194,24,91,0.3); }
    .pedido-card { background: #fff; border-radius: 16px; padding: 14px; margin-bottom: 10px; box-shadow: 0 2px 10px rgba(194,24,91,0.06); border: 1px solid #fce4ec; }
    .pedido-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .pedido-nome { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 600; color: #880e4f; }
    .pedido-produto { font-size: 12px; color: #b0819a; margin-top: 1px; }
    .pedido-valor { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #c2185b; text-align: right; }
    .pedido-data { font-size: 10px; color: #c9a0b5; text-align: right; }
    .parcelas-row { display: flex; align-items: center; gap: 6px; margin: 8px 0; }
    .parcela-dot { width: 10px; height: 10px; border-radius: 50%; }
    .parcela-dot.pago { background: #4caf50; }
    .parcela-dot.aberto { background: #fce4ec; border: 1.5px solid #f48fb1; }
    .parcelas-info { font-size: 11px; color: #b0819a; margin-left: 4px; }
    .status-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 3px 8px; border-radius: 20px; font-weight: 500; }
    .status-entregue { background: #e8f5e9; color: #2e7d32; }
    .status-pendente { background: #fff3e0; color: #e65100; }
    .status-quitado { background: #e8f5e9; color: #2e7d32; }
    .status-deve { background: #fce4ec; color: #c2185b; }
    .btns-row { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
    .btn-entregar { background: #fff3e0; color: #e65100; border: 1.5px solid #ffcc80; border-radius: 10px; padding: 7px 12px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; }
    .btn-pagar { background: #e8f5e9; color: #2e7d32; border: 1.5px solid #a5d6a7; border-radius: 10px; padding: 7px 12px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; }
    .empty { text-align: center; padding: 48px 20px; color: #c9a0b5; font-size: 14px; }
    .empty-icon { font-size: 40px; margin-bottom: 10px; }
    .cliente-card { background: #fff; border-radius: 16px; padding: 14px 16px; margin-bottom: 10px; box-shadow: 0 2px 10px rgba(194,24,91,0.06); border: 1px solid #fce4ec; display: flex; justify-content: space-between; align-items: center; }
    .cliente-nome { font-family: 'Playfair Display', serif; font-size: 15px; color: #880e4f; font-weight: 600; }
    .cliente-sub { font-size: 11px; color: #b0819a; margin-top: 2px; }
    .cliente-nums { text-align: right; }
    .cliente-total { font-size: 13px; font-weight: 600; color: #c2185b; }
    .cliente-deve { font-size: 12px; margin-top: 3px; }
    .fin-section { background: #fff; border-radius: 16px; padding: 16px; margin-bottom: 14px; box-shadow: 0 2px 10px rgba(194,24,91,0.06); border: 1px solid #fce4ec; }
    .fin-title { font-family: 'Playfair Display', serif; font-size: 16px; color: #880e4f; margin-bottom: 14px; font-weight: 600; }
    .fin-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #fdf0f5; }
    .fin-row:last-child { border-bottom: none; }
    .fin-label { font-size: 13px; color: #6d4c61; }
    .fin-val { font-weight: 700; font-size: 15px; font-family: 'Playfair Display', serif; }
    .inv-card { background: #fff; border-radius: 14px; padding: 13px 16px; margin-bottom: 8px; box-shadow: 0 2px 8px rgba(194,24,91,0.06); border: 1px solid #fce4ec; display: flex; justify-content: space-between; align-items: center; }
    .inv-desc { font-size: 14px; font-weight: 500; color: #333; }
    .inv-data { font-size: 11px; color: #b0819a; margin-top: 2px; }
    .inv-val { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 700; color: #1565c0; }
    .inv-total { background: linear-gradient(135deg, #e3f2fd, #bbdefb); border-radius: 14px; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
    .inv-total-label { font-weight: 600; color: #1565c0; font-size: 14px; }
    .inv-total-val { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #1565c0; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(136,14,79,0.2); backdrop-filter: blur(4px); display: flex; align-items: flex-end; justify-content: center; z-index: 100; padding: 0; }
    .modal { background: #fff; border-radius: 24px 24px 0 0; padding: 24px 20px 32px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
    .modal-title { font-family: 'Playfair Display', serif; font-size: 20px; color: #880e4f; margin-bottom: 20px; font-weight: 700; }
    .field { margin-bottom: 14px; }
    .field label { display: block; font-size: 11px; color: #b0819a; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 5px; font-weight: 500; }
    .field input, .field select { width: 100%; padding: 11px 14px; border-radius: 12px; border: 1.5px solid #fce4ec; background: #fdf0f5; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #333; outline: none; transition: border 0.2s; }
    .field input:focus, .field select:focus { border-color: #e91e8c; background: #fff; }
    .modal-btns { display: flex; gap: 10px; margin-top: 6px; }
    .btn-cancelar { flex: 1; padding: 13px; border: 1.5px solid #fce4ec; border-radius: 12px; background: #fff; color: #c2185b; font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer; font-weight: 500; }
    .btn-salvar { flex: 2; padding: 13px; border: none; border-radius: 12px; background: linear-gradient(135deg, #c2185b, #e91e8c); color: #fff; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px rgba(194,24,91,0.35); }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
    .section-label { font-size: 13px; color: #b0819a; }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="crm">
        {/* HEADER */}
        <div className="header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="header-title">✦ CRM Controle</div>
              <div className="header-sub">Sua revenda organizada com elegância</div>
            </div>
            <select className="mes-select" value={mes} onChange={e => setMes(e.target.value)}>
              {MESES.map(m => <option key={m} value={m}>{nomeMes(m)}</option>)}
            </select>
          </div>
        </div>

        {/* CARDS */}
        <div className="cards">
          <div className="card pink">
            <div className="card-label">Vendido</div>
            <div className="card-value">{fmt(totalVendido)}</div>
          </div>
          <div className="card green">
            <div className="card-label">Recebido</div>
            <div className="card-value">{fmt(totalRecebido)}</div>
          </div>
          <div className="card red">
            <div className="card-label">A Receber</div>
            <div className="card-value">{fmt(aReceber)}</div>
          </div>
          <div className="card blue">
            <div className="card-label">Investido</div>
            <div className="card-value">{fmt(totalInv)}</div>
          </div>
          <div className={`card ${lucro >= 0 ? "gold" : "red"} card-lucro`}>
            <div className="card-label">Lucro Líquido</div>
            <div className="card-value">{fmt(lucro)}</div>
          </div>
        </div>

        {/* TABS */}
        <div className="tabs">
          {TABS.map(t => (
            <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              <span className="tab-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* CONTEÚDO */}
        <div className="content">

          {/* PEDIDOS */}
          {tab === "pedidos" && (
            <>
              <div className="search-row">
                <input className="search-input" placeholder="🔍 Buscar cliente ou produto..." value={busca} onChange={e => setBusca(e.target.value)} />
                <button className="btn-novo" onClick={() => setModalPedido(true)}>+ Novo</button>
              </div>
              {pedidosMes.length === 0 && (
                <div className="empty">
                  <div className="empty-icon">🛍️</div>
                  Nenhum pedido neste mês
                </div>
              )}
              {pedidosMes.map(p => {
                const valParcela = p.valor / p.parcelas;
                const deve = valParcela * (p.parcelas - p.parcelasPagas);
                return (
                  <div key={p.id} className="pedido-card">
                    <div className="pedido-top">
                      <div>
                        <div className="pedido-nome">{p.cliente}</div>
                        <div className="pedido-produto">{p.produto}</div>
                      </div>
                      <div>
                        <div className="pedido-valor">{fmt(p.valor)}</div>
                        <div className="pedido-data">{p.data}</div>
                      </div>
                    </div>

                    <div className="parcelas-row">
                      {Array.from({ length: p.parcelas }).map((_, i) => (
                        <div key={i} className={`parcela-dot ${i < p.parcelasPagas ? "pago" : "aberto"}`} />
                      ))}
                      <span className="parcelas-info">{p.parcelasPagas}/{p.parcelas} parcelas · {fmt(valParcela)} cada</span>
                    </div>

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span className={`status-badge ${p.entregue ? "status-entregue" : "status-pendente"}`}>
                        {p.entregue ? "✓ Entregue" : "⏳ Pendente"}
                      </span>
                      <span className={`status-badge ${deve === 0 ? "status-quitado" : "status-deve"}`}>
                        {deve === 0 ? "✓ Quitado" : `Deve ${fmt(deve)}`}
                      </span>
                    </div>

                    <div className="btns-row">
                      {!p.entregue && (
                        <button className="btn-entregar" onClick={() => marcarEntregue(p.id)}>📦 Entreguei</button>
                      )}
                      {p.parcelasPagas < p.parcelas && (
                        <button className="btn-pagar" onClick={() => pagarParcela(p.id)}>💰 Parcela Paga</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* CLIENTES */}
          {tab === "clientes" && (
            <>
              <div className="section-label" style={{ marginBottom: 14 }}>Resumo por cliente em {nomeMes(mes)}</div>
              {clienteMap.length === 0 && (
                <div className="empty">
                  <div className="empty-icon">👥</div>
                  Nenhuma cliente neste mês
                </div>
              )}
              {clienteMap.map(c => (
                <div key={c.nome} className="cliente-card">
                  <div>
                    <div className="cliente-nome">{c.nome}</div>
                    <div className="cliente-sub">{c.pedidos} pedido{c.pedidos > 1 ? "s" : ""}</div>
                  </div>
                  <div className="cliente-nums">
                    <div className="cliente-total">{fmt(c.total)}</div>
                    <div className={`cliente-deve ${c.deve > 0 ? "status-deve" : "status-quitado"} status-badge`} style={{ marginTop: 4 }}>
                      {c.deve > 0 ? `Deve ${fmt(c.deve)}` : "✓ Em dia"}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* FINANCEIRO */}
          {tab === "financeiro" && (
            <>
              <div className="fin-section">
                <div className="fin-title">Resumo de {nomeMes(mes)}</div>
                {[
                  { label: "Total de vendas", val: fmt(totalVendido), cor: "#c2185b" },
                  { label: "Já recebido das clientes", val: fmt(totalRecebido), cor: "#2e7d32" },
                  { label: "Ainda a receber", val: fmt(aReceber), cor: "#c62828" },
                  { label: "Investido em produtos", val: fmt(totalInv), cor: "#1565c0" },
                  { label: "Lucro líquido", val: fmt(lucro), cor: lucro >= 0 ? "#2e7d32" : "#c62828" },
                ].map(r => (
                  <div key={r.label} className="fin-row">
                    <span className="fin-label">{r.label}</span>
                    <span className="fin-val" style={{ color: r.cor }}>{r.val}</span>
                  </div>
                ))}
              </div>

              <div className="fin-section">
                <div className="fin-title">Parcelas em aberto</div>
                {pedidosMes.filter(p => p.parcelasPagas < p.parcelas).length === 0 ? (
                  <div style={{ color: "#2e7d32", fontSize: 13 }}>✓ Todas as clientes estão em dia!</div>
                ) : pedidosMes.filter(p => p.parcelasPagas < p.parcelas).map(p => (
                  <div key={p.id} className="fin-row">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#880e4f" }}>{p.cliente}</div>
                      <div style={{ fontSize: 11, color: "#b0819a" }}>{p.produto}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, color: "#c2185b", fontWeight: 600 }}>{p.parcelas - p.parcelasPagas}x parcela</div>
                      <div style={{ fontSize: 12, color: "#c62828", fontWeight: 700 }}>{fmt((p.valor / p.parcelas) * (p.parcelas - p.parcelasPagas))}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* INVESTIMENTOS */}
          {tab === "investimentos" && (
            <>
              <div className="section-header">
                <div className="section-label">Gastos em {nomeMes(mes)}</div>
                <button className="btn-novo" onClick={() => setModalInv(true)}>+ Registrar</button>
              </div>
              {invMes.length === 0 && (
                <div className="empty">
                  <div className="empty-icon">📦</div>
                  Nenhum gasto registrado
                </div>
              )}
              {invMes.map(i => (
                <div key={i.id} className="inv-card">
                  <div>
                    <div className="inv-desc">{i.descricao}</div>
                    <div className="inv-data">{i.data}</div>
                  </div>
                  <div className="inv-val">{fmt(i.valor)}</div>
                </div>
              ))}
              {invMes.length > 0 && (
                <div className="inv-total">
                  <span className="inv-total-label">Total investido</span>
                  <span className="inv-total-val">{fmt(totalInv)}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* MODAL NOVO PEDIDO */}
        {modalPedido && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalPedido(false)}>
            <div className="modal">
              <div className="modal-title">Novo Pedido ✦</div>
              {[
                ["Cliente", "cliente", "text", "Nome da cliente"],
                ["Produto", "produto", "text", "Ex: Perfume Rose"],
                ["Valor Total (R$)", "valor", "number", "0,00"],
                ["Parcelas", "parcelas", "number", "1"],
                ["Data do Pedido", "data", "date", ""],
              ].map(([label, key, type, ph]) => (
                <div className="field" key={key}>
                  <label>{label}</label>
                  <input type={type} placeholder={ph} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div className="field">
                <label>Mês de Referência</label>
                <select value={form.mes} onChange={e => setForm(f => ({ ...f, mes: e.target.value }))}>
                  {MESES.map(m => <option key={m} value={m}>{nomeMes(m)}</option>)}
                </select>
              </div>
              <div className="modal-btns">
                <button className="btn-cancelar" onClick={() => setModalPedido(false)}>Cancelar</button>
                <button className="btn-salvar" onClick={salvarPedido}>Salvar Pedido</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL INVESTIMENTO */}
        {modalInv && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalInv(false)}>
            <div className="modal">
              <div className="modal-title">Registrar Gasto 📦</div>
              {[
                ["Descrição", "descricao", "text", "Ex: Compra de catálogo"],
                ["Valor (R$)", "valor", "number", "0,00"],
                ["Data", "data", "date", ""],
              ].map(([label, key, type, ph]) => (
                <div className="field" key={key}>
                  <label>{label}</label>
                  <input type={type} placeholder={ph} value={invForm[key]} onChange={e => setInvForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div className="field">
                <label>Mês de Referência</label>
                <select value={invForm.mes} onChange={e => setInvForm(f => ({ ...f, mes: e.target.value }))}>
                  {MESES.map(m => <option key={m} value={m}>{nomeMes(m)}</option>)}
                </select>
              </div>
              <div className="modal-btns">
                <button className="btn-cancelar" onClick={() => setModalInv(false)}>Cancelar</button>
                <button className="btn-salvar" onClick={salvarInv}>Salvar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
