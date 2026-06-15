import { useState, useMemo, useEffect } from "react";
import { supabase } from "./supabase";
import { LineChart, Line, BarChart, Bar, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";


const MESES = (() => {
  const meses = [];
  for (let i = -3; i <= 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return meses;
})();
const TABS = [
  { id: "pedidos", label: "Pedidos", icon: "🛍️" },
  { id: "financeiro", label: "Financeiro", icon: "💰" },
  { id: "estoque", label: "Estoque", icon: "🏪" },
  { id: "investimentos", label: "Invest.", icon: "📦" },
  { id: "relatorios", label: "Relatórios", icon: "📊" },
];

const fmt = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const hoje = () => new Date().toISOString().split("T")[0];
const nomeMes = (m) => {
  const [ano, mes] = m.split("-");
  return new Date(ano, mes - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #fdf0f5; }
  .crm { min-height: 100vh; background: linear-gradient(145deg, #fdf0f5 0%, #fff5f8 50%, #fde8f0 100%); }
  .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #c2185b 0%, #e91e8c 50%, #f06292 100%); padding: 20px; }
  .login-box { background: #fff; border-radius: 24px; padding: 36px 28px; width: 100%; max-width: 380px; box-shadow: 0 20px 60px rgba(194,24,91,0.3); }
  .login-title { font-family: 'Playfair Display', serif; font-size: 26px; color: #880e4f; text-align: center; margin-bottom: 6px; }
  .login-sub { text-align: center; color: #b0819a; font-size: 13px; margin-bottom: 28px; }
  .login-field { margin-bottom: 14px; }
  .login-field label { display: block; font-size: 11px; color: #b0819a; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 5px; font-weight: 500; }
  .login-field input { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1.5px solid #fce4ec; background: #fdf0f5; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #333; outline: none; }
  .login-field input:focus { border-color: #e91e8c; background: #fff; }
  .btn-login { width: 100%; padding: 14px; border: none; border-radius: 12px; background: linear-gradient(135deg, #c2185b, #e91e8c); color: #fff; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 6px; box-shadow: 0 4px 14px rgba(194,24,91,0.35); }
  .login-toggle { text-align: center; margin-top: 16px; font-size: 13px; color: #b0819a; }
  .login-toggle span { color: #c2185b; cursor: pointer; font-weight: 600; }
  .login-error { background: #fce4ec; color: #c2185b; padding: 10px 14px; border-radius: 10px; font-size: 13px; margin-bottom: 14px; text-align: center; }
  .header { background: linear-gradient(135deg, #c2185b 0%, #e91e8c 50%, #f06292 100%); padding: 20px 16px 16px; position: relative; overflow: hidden; }
  .header::before { content: ''; position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(255,255,255,0.08); border-radius: 50%; }
  .header-title { font-family: 'Playfair Display', serif; color: #fff; font-size: 22px; font-weight: 700; }
  .header-sub { color: rgba(255,255,255,0.75); font-size: 12px; margin-top: 2px; }
  .btn-sair { background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 20px; padding: 6px 12px; font-size: 11px; cursor: pointer; font-family: 'DM Sans', sans-serif; }
  .mes-select { background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 20px; padding: 6px 12px; font-size: 12px; font-family: 'DM Sans', sans-serif; cursor: pointer; }
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
  .search-input { flex: 1; padding: 10px 14px; border-radius: 12px; border: 1.5px solid #fce4ec; background: #fff; font-family: 'DM Sans', sans-serif; font-size: 13px; color: #333; outline: none; }
  .search-input:focus { border-color: #e91e8c; }
  .btn-novo { background: linear-gradient(135deg, #c2185b, #e91e8c); color: #fff; border: none; border-radius: 12px; padding: 10px 16px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; box-shadow: 0 4px 12px rgba(194,24,91,0.3); }
  .pedido-card { background: #fff; border-radius: 16px; padding: 14px; margin-bottom: 10px; box-shadow: 0 2px 10px rgba(194,24,91,0.06); border: 1px solid #fce4ec; }
  .pedido-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .pedido-nome { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 600; color: #880e4f; }
  .pedido-produto { font-size: 12px; color: #b0819a; margin-top: 1px; }
  .pedido-valor { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #c2185b; text-align: right; }
  .pedido-data { font-size: 10px; color: #c9a0b5; text-align: right; }
  .parcelas-row { display: flex; align-items: center; gap: 6px; margin: 8px 0; flex-wrap: wrap; }
  .parcela-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .parcela-dot.pago { background: #4caf50; }
  .parcela-dot.aberto { background: #fce4ec; border: 1.5px solid #f48fb1; }
  .parcelas-info { font-size: 11px; color: #b0819a; margin-left: 4px; }
  .status-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 3px 8px; border-radius: 20px; font-weight: 500; }
  .status-entregue { background: #e8f5e9; color: #2e7d32; }
  .status-pendente { background: #fff3e0; color: #e65100; }
  .status-quitado { background: #e8f5e9; color: #2e7d32; }
  .status-Débito { background: #fce4ec; color: #c2185b; }
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
  .modal-overlay { position: fixed; inset: 0; background: rgba(136,14,79,0.2); backdrop-filter: blur(4px); display: flex; align-items: flex-end; justify-content: center; z-index: 100; }
  .modal { background: #fff; border-radius: 24px 24px 0 0; padding: 24px 20px 32px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
  .modal-title { font-family: 'Playfair Display', serif; font-size: 20px; color: #880e4f; margin-bottom: 20px; font-weight: 700; }
  .field { margin-bottom: 14px; }
  .field label { display: block; font-size: 11px; color: #b0819a; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 5px; font-weight: 500; }
  .field input, .field select { width: 100%; padding: 11px 14px; border-radius: 12px; border: 1.5px solid #fce4ec; background: #fdf0f5; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #333; outline: none; }
  .field input:focus, .field select:focus { border-color: #e91e8c; background: #fff; }
  .modal-btns { display: flex; gap: 10px; margin-top: 6px; }
  .btn-cancelar { flex: 1; padding: 13px; border: 1.5px solid #fce4ec; border-radius: 12px; background: #fff; color: #c2185b; font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer; }
  .btn-salvar { flex: 2; padding: 13px; border: none; border-radius: 12px; background: linear-gradient(135deg, #c2185b, #e91e8c); color: #fff; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; }
  .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
  .section-label { font-size: 13px; color: #b0819a; }
  .loading { text-align: center; padding: 48px 20px; color: #c9a0b5; font-size: 14px; }
`;

// TELA DE LOGIN
function Login({ onLogin }) {
  const [modo, setModo] = useState("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setErro("");
    setLoading(true);
    if (modo === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) setErro("E-mail ou senha incorretos");
    } else {
      const { error } = await supabase.auth.signUp({ email, password: senha });
      if (error) setErro("Erro ao criar conta. Tente outro e-mail.");
      else setErro("✓ Conta criada! Verifique seu e-mail para confirmar.");
    }
    setLoading(false);
  };

  return (
    <>
      <style>{css}</style>
      <div className="login-wrap">
        <div className="login-box">
          <div className="login-title">✦ CRM Controle</div>
          <div className="login-sub">Sua revenda organizada com elegância</div>
          {erro && <div className="login-error">{erro}</div>}
          <div className="login-field">
            <label>E-mail</label>
            <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="login-field">
            <label>Senha</label>
            <input type="password" placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>
          <button className="btn-login" onClick={handleSubmit} disabled={loading}>
            {loading ? "Aguarde..." : modo === "login" ? "Entrar" : "Criar conta"}
          </button>
          <div className="login-toggle">
            {modo === "login" ? (
              <span>Não tem conta? <span onClick={() => setModo("cadastro")}>Criar conta</span></span>
            ) : (
              <span>Já tem conta? <span onClick={() => setModo("login")}>Entrar</span></span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// APP PRINCIPAL
export default function App() {
  const [session, setSession] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [tab, setTab] = useState("pedidos");
  const [pedidos, setPedidos] = useState([]);
  const [investimentos, setInvestimentos] = useState([]);
  const [mes, setMes] = useState(() => {
    const agora = new Date();
    return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
  });
  const [busca, setBusca] = useState("");
  const [margens, setMargens] = useState({});
  const [editandoMargem, setEditandoMargem] = useState(false);
  const [margemTemp, setMargemTemp] = useState(50);
  const [estoques, setEstoques] = useState({});
  const [editandoEstoque, setEditandoEstoque] = useState(false);
  const [estoqueTemp, setEstoqueTemp] = useState(0);
  const [modalPedido, setModalPedido] = useState(false);
  const [modalInv, setModalInv] = useState(false);
  const [form, setForm] = useState({ cliente: "", produto: "", valor: "", parcelas: "1", entrada: "0", data: hoje(), data_primeiro_pagamento: hoje(), mes: "", origem: "", estoque: false });
  const [invForm, setInvForm] = useState({ descricao: "", valor_catalogo: "", desconto: "", data: hoje(), mes: "" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCarregando(false);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (session) {
      carregarPedidos();
      carregarInvestimentos();
      carregarMargens();
      carregarEstoque();
    }
  }, [session]);

  const carregarPedidos = async () => {
    const { data } = await supabase.from("pedidos").select("*").order("created_at", { ascending: false });
    if (data) setPedidos(data);
  };

  const carregarInvestimentos = async () => {
    const { data } = await supabase.from("investimentos").select("*").order("created_at", { ascending: false });
    if (data) setInvestimentos(data);
  };

  const carregarMargens = async () => {
    const { data } = await supabase.from("margens").select("*");
    if (data) {
      const m = {};
      data.forEach(d => m[d.mes] = d.margem);
      setMargens(m);
    }
  };

  const carregarEstoque = async () => {
    const { data } = await supabase.from("estoque").select("*");
    if (data) {
      const e = {};
      data.forEach(d => e[d.mes] = d.estoque_inicial);
      setEstoques(e);
    }
  };

  const salvarEstoque = async (valor) => {
    const { error } = await supabase.from("estoque").upsert({
      user_id: session.user.id,
      mes,
      estoque_inicial: Number(valor)
    }, { onConflict: "user_id,mes" });
    if (error) {
      alert("Erro ao salvar: " + error.message);
    } else {
      setEstoques(e => ({ ...e, [mes]: Number(valor) }));
      setEditandoEstoque(false);
    }
  };



  const salvarMargem = async (valor) => {
    const { data, error } = await supabase.from("margens").upsert({
      user_id: session.user.id,
      mes,
      margem: Number(valor)
    }, { onConflict: "user_id,mes" });
    if (error) {
      alert("Erro ao salvar: " + error.message);
    } else {
      setMargens(m => ({ ...m, [mes]: Number(valor) }));
      setEditandoMargem(false);
    }
  };
  const pedidosMes = useMemo(() =>
    pedidos.filter(p => p.mes === mes && (
      p.cliente.toLowerCase().includes(busca.toLowerCase()) ||
      p.produto.toLowerCase().includes(busca.toLowerCase())
    )), [pedidos, mes, busca]);

  const invMes = useMemo(() => investimentos.filter(i => i.mes === mes), [investimentos, mes]);
  // PEDIDOS
  const totalVendido = pedidosMes.reduce((s, p) => s + Number(p.valor), 0);
  const totalRecebidoReal = pedidosMes.reduce((s, p) => {
    const entrada = Number(p.entrada) || 0;
    if (p.parcelas <= 1) {
      // À vista: só conta quando marcado como pago
      return s + (p.parcelas_pagas >= 1 ? Number(p.valor) : 0);
    }
    const restante = Number(p.valor) - entrada;
    const valParcela = p.parcelas > 0 ? restante / p.parcelas : 0;
    return s + entrada + (valParcela * p.parcelas_pagas);
  }, 0);
  const aReceber = totalVendido - totalRecebidoReal;

  // INVESTIMENTOS
  const totalCatalogo = invMes.reduce((s, i) => s + Number(i.valor_catalogo || 0), 0);
  const totalInv = invMes.reduce((s, i) => s + Number(i.valor_pago || i.valor || 0), 0);

  // ESTOQUE INICIAL
  const estoqueInicial = estoques[mes] || 0;
  const totalEstoque = pedidosMes.filter(p => p.estoque).reduce((s, p) => {
    if (p.parcelas <= 1) {
      return s + (p.parcelas_pagas >= 1 ? Number(p.valor) : 0);
    }
    const entrada = Number(p.entrada) || 0;
    const restante = Number(p.valor) - entrada;
    const valParcela = p.parcelas > 0 ? restante / p.parcelas : 0;
    return s + entrada + (valParcela * p.parcelas_pagas);
  }, 0);

  // LUCRO = recebido normal - investido + lucro do estoque (100%)
  const recebidoNormal = totalRecebidoReal - totalEstoque;
  const lucro = recebidoNormal - totalInv + totalEstoque;
  // PARCELAS FUTURAS - apenas lembrete, não conta no lucro
  const parcelasFuturas = pedidos.filter(p => p.mes && p.cliente && p.parcelas > 0).flatMap(p => {
    const entrada = Number(p.entrada) || 0;
    const restante = Number(p.valor) - entrada;
    const valParcela = p.parcelas > 0 ? restante / p.parcelas : 0;
    const parcelasPendentes = p.parcelas - p.parcelas_pagas;
    if (parcelasPendentes <= 0) return [];
    const dataBase = new Date(p.data_primeiro_pagamento || p.data);
    return Array.from({ length: parcelasPendentes }, (_, i) => {
      const dataVenc = new Date(dataBase);
      dataVenc.setMonth(dataVenc.getMonth() + p.parcelas_pagas + i);
      const mesVenc = `${dataVenc.getFullYear()}-${String(dataVenc.getMonth() + 1).padStart(2, "0")}`;
      return { cliente: p.cliente, produto: p.produto, valor: valParcela, mes: mesVenc, mesPedido: p.mes, pedidoId: p.id, parcelaAtual: p.parcelas_pagas, totalParcelas: p.parcelas };
    });
  });

  const dadosGrafico = useMemo(() => {
    return MESES.map(m => {
      const pedidosM = pedidos.filter(p => p.mes === m);
      const invM = investimentos.filter(i => i.mes === m);
      const vendido = pedidosM.reduce((s, p) => s + Number(p.valor), 0);
      const recebido = pedidosM.reduce((s, p) => s + (Number(p.valor) / p.parcelas) * p.parcelas_pagas, 0);
      const investido = invM.reduce((s, i) => s + Number(i.valor), 0);
      const recebidoM = pedidosM.reduce((s, p) => {
        const entrada = Number(p.entrada) || 0;
        if (p.parcelas <= 1) {
          return s + (p.parcelas_pagas >= 1 ? Number(p.valor) : 0);
        }
        const restante = Number(p.valor) - entrada;
        const valParcela = p.parcelas > 0 ? restante / p.parcelas : 0;
        return s + entrada + (valParcela * p.parcelas_pagas);
      }, 0);
      const lucroM = recebidoM - invM.reduce((s, i) => s + Number(i.valor_pago || i.valor || 0), 0);
      const margemM = margens[m] || 0;
      return {
        mes: m.slice(5),
        vendido: Number(vendido.toFixed(2)),
        recebido: Number(recebido.toFixed(2)),
        investido: Number(investido.toFixed(2)),
        lucro: Number(lucroM.toFixed(2)),
        meta: Number((lucroM * (margemM / 100)).toFixed(2)),
      };
    }).filter(d => d.vendido > 0 || d.recebido > 0 || d.investido > 0);
  }, [pedidos, investimentos, margens]);

  const melhorMes = useMemo(() => {
    if (dadosGrafico.length === 0) return null;
    return dadosGrafico.reduce((a, b) => a.vendido > b.vendido ? a : b);
  }, [dadosGrafico]);




  const clienteMap = useMemo(() => {
    const m = {};
    pedidosMes.forEach(p => {
      if (!m[p.cliente]) m[p.cliente] = { total: 0, Débito: 0, pedidos: 0 };
      m[p.cliente].total += Number(p.valor);
      m[p.cliente].Débito += (Number(p.valor) / p.parcelas) * (p.parcelas - p.parcelas_pagas);
      m[p.cliente].pedidos++;
    });
    return Object.entries(m).map(([nome, d]) => ({ nome, ...d }));
  }, [pedidosMes]);

  const marcarEntregue = async (id) => {
    await supabase.from("pedidos").update({ entregue: true }).eq("id", id);
    setPedidos(ps => ps.map(p => p.id === id ? { ...p, entregue: true } : p));
  };

  const pagarParcela = async (id, atual, total) => {
    if (atual >= total) return;
    await supabase.from("pedidos").update({ parcelas_pagas: atual + 1 }).eq("id", id);
    setPedidos(ps => ps.map(p => p.id === id ? { ...p, parcelas_pagas: atual + 1 } : p));
  };


  const voltarParcela = async (id, atual) => {
    if (atual <= 0) return;
    await supabase.from("pedidos").update({ parcelas_pagas: atual - 1 }).eq("id", id);
    setPedidos(ps => ps.map(p => p.id === id ? { ...p, parcelas_pagas: atual - 1 } : p));
  };


  const excluirPedido = async (id) => {
    if (!window.confirm("Tem certeza que quer excluir este pedido?")) return;
    await supabase.from("pedidos").delete().eq("id", id);
    setPedidos(ps => ps.filter(p => p.id !== id));
  };

  const excluirMargem = async () => {
    if (!window.confirm("Excluir a margem deste mês?")) return;
    await supabase.from("margens").delete().eq("user_id", session.user.id).eq("mes", mes);
    setMargens(m => { const n = { ...m }; delete n[mes]; return n; });
  };



  const excluirCliente = async (nome) => {
    if (!window.confirm(`Excluir todos os pedidos de ${nome}?`)) return;
    await supabase.from("pedidos").delete().eq("user_id", session.user.id).eq("cliente", nome);
    setPedidos(ps => ps.filter(p => p.cliente !== nome));
  };

  const excluirInv = async (id) => {
    if (!window.confirm("Excluir este gasto?")) return;
    await supabase.from("investimentos").delete().eq("id", id);
    setInvestimentos(is => is.filter(i => i.id !== id));
  };


  const transferirSobra = async () => {
    const proximoMes = MESES[MESES.indexOf(mes) + 1];
    if (!proximoMes) return alert("Não há próximo mês disponível!");
    const sobraCatalogo = totalCatalogo - totalVendido;
    const sobraValorPago = totalCatalogo > 0 ? (sobraCatalogo / totalCatalogo) * totalInv : 0;
    const descontoSobra = sobraCatalogo > 0 ? ((sobraCatalogo - sobraValorPago) / sobraCatalogo) * 100 : 0;
    if (sobraCatalogo <= 0) return alert("Não há sobra para transferir!");
    if (!window.confirm(`Transferir sobra de ${fmt(sobraCatalogo)} em produtos para ${nomeMes(proximoMes)}?`)) return;

    // Apaga investimentos do mês atual
    const invIds = invMes.map(i => i.id);
    for (const id of invIds) {
      await supabase.from("investimentos").delete().eq("id", id);
    }
    setInvestimentos(is => is.filter(i => !invIds.includes(i.id)));

    // Cria investimento no próximo mês com a sobra
    const { data } = await supabase.from("investimentos").insert([{
      descricao: `Sobra de ${nomeMes(mes)}`,
      valor: sobraValorPago,
      valor_catalogo: sobraCatalogo,
      desconto: descontoSobra,
      valor_pago: sobraValorPago,
      lucro_bruto: sobraCatalogo - sobraValorPago,
      data: hoje(),
      mes: proximoMes,
      user_id: session.user.id
    }]).select();
    if (data) {
      setInvestimentos(is => [...is, data[0]]);
      alert(`Sobra de ${fmt(sobraCatalogo)} em produtos transferida para ${nomeMes(proximoMes)}!`);
    }
  };

  const salvarPedido = async () => {
    if (!form.cliente || !form.produto || !form.valor) return;
    const entrada = Number(form.entrada) || 0;
    const valorTotal = Number(form.valor);
    const parcelas = Number(form.parcelas);
    const { data } = await supabase.from("pedidos").insert([{
      ...form,
      valor: valorTotal,
      entrada: entrada,
      parcelas: parcelas,
      parcelas_pagas: 0,
      entregue: false,
      user_id: session.user.id
    }]).select();
    if (data) setPedidos(ps => [data[0], ...ps]);
    setForm({ cliente: "", produto: "", valor: "", parcelas: "1", entrada: "0", data: hoje(), mes: "", origem: "", estoque: false });
    setModalPedido(false);
  };
  const salvarInv = async () => {
    if (!invForm.descricao || !invForm.valor_catalogo || !invForm.desconto) return;
    const valor_catalogo = Number(invForm.valor_catalogo);
    const desconto = Number(invForm.desconto);
    const valor_pago = valor_catalogo * (1 - desconto / 100);
    const lucro_bruto = valor_catalogo * (desconto / 100);
    const { data } = await supabase.from("investimentos").insert([{
      ...invForm,
      valor: valor_pago,
      valor_catalogo,
      desconto,
      valor_pago,
      lucro_bruto,
      user_id: session.user.id
    }]).select();
    if (data) setInvestimentos(is => [data[0], ...is]);
    setInvForm({ descricao: "", valor_catalogo: "", desconto: "", data: hoje(), mes });
    setModalInv(false);
  };

  const sair = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (carregando) return <><style>{css}</style><div className="loading">Carregando...</div></>;
  if (!session) return <Login />;

  return (
    <>
      <style>{css}</style>
      <div className="crm">
        <div className="header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, position: "relative", zIndex: 999 }}>
            <div>
              <div className="header-title">✦ CRM Controle</div>
              <div className="header-sub">Sua revenda organizada com elegância</div>
            </div>
            <button className="btn-sair" onClick={sair}>Sair</button>
          </div>
          <select className="mes-select" value={mes} onChange={e => setMes(e.target.value)}>
            {MESES.map(m => <option key={m} value={m}>{nomeMes(m)}</option>)}
          </select>
        </div>

        <div className="cards">
          <div className="card pink"><div className="card-label">Vendido</div><div className="card-value">{fmt(totalVendido)}</div></div>
          <div className="card green"><div className="card-label">Recebido</div><div className="card-value">{fmt(totalRecebidoReal)}</div></div>
          <div className="card red"><div className="card-label">A Receber</div><div className="card-value">{fmt(aReceber)}</div></div>
          <div className="card blue"><div className="card-label">Investido</div><div className="card-value">{fmt(totalInv)}</div></div>
          <div className={`card ${lucro >= 0 ? "gold" : "red"} card-lucro`}><div className="card-label">Lucro Líquido</div><div className="card-value">{fmt(lucro)}</div></div>
        </div>

        <div className="tabs">
          {TABS.map(t => (
            <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              <span className="tab-icon">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        <div className="content">
          {tab === "pedidos" && (
            <>
              <div className="search-row">
                <input className="search-input" placeholder="🔍 Buscar cliente ou produto..." value={busca} onChange={e => setBusca(e.target.value)} />
                <button className="btn-novo" onClick={() => setModalPedido(true)}>+ Novo</button>
              </div>
              {pedidosMes.length === 0 && <div className="empty"><div className="empty-icon">🛍️</div>Nenhum pedido neste mês</div>}
              {parcelasFuturas.filter(pf => pf.mes === mes).length > 0 && (
                <div style={{ background: "#e3f2fd", borderRadius: 14, padding: "12px 16px", marginBottom: 14 }}>
                  <div style={{ fontWeight: 600, color: "#1565c0", fontSize: 14, marginBottom: 8 }}>⏰ Parcelas a receber em {nomeMes(mes)}</div>
                  {parcelasFuturas.filter(pf => pf.mes === mes).map((pf, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #bbdefb" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#880e4f" }}>{pf.cliente}</div>
                        <div style={{ fontSize: 11, color: "#b0819a" }}>{pf.produto} · pedido de {nomeMes(pf.mesPedido)}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ fontSize: 13, color: "#1565c0", fontWeight: 700 }}>{fmt(pf.valor)}</div>
                        <button className="btn-pagar" onClick={() => pagarParcela(pf.pedidoId, pf.parcelaAtual, pf.totalParcelas)}>💰 Pago</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {pedidosMes.map(p => {
                const entrada = Number(p.entrada) || 0;
                const restante = Number(p.valor) - entrada;
                const valParcela = p.parcelas > 0 ? restante / p.parcelas : restante;
                const Débito = valParcela * (p.parcelas - p.parcelas_pagas);
                return (
                  <div key={p.id} className="pedido-card">
                    <div className="pedido-top">
                      <div className="pedido-produto">{p.produto}{p.origem ? ` · ${p.origem}` : ""}</div>
                      <div><div className="pedido-valor">{fmt(p.valor)}</div><div className="pedido-data">{p.data}</div></div>
                    </div>
                    <div className="parcelas-row">
  {Number(p.entrada) > 0 && Array.from({ length: p.parcelas }).map((_, i) => (
    <div key={i} className={`parcela-dot ${i < p.parcelas_pagas ? "pago" : "aberto"}`} />
  ))}
  <span className="parcelas-info">
                        {entrada > 0
                          ? `✓ Entrada ${fmt(entrada)} paga · ${p.parcelas} parcelas de ${fmt(valParcela)}`
                         : p.parcelas <= 1
  ? `À vista · ${fmt(p.valor)}`
  : `Parcelado em ${p.parcelas}x de ${fmt(valParcela)}`
                        }
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span className={`status-badge ${p.entregue ? "status-entregue" : "status-pendente"}`}>{p.entregue ? "✓ Entregue" : "⏳ Pendente"}</span>
                     {p.parcelas > 1 && Number(p.entrada) > 0 && (
  <span className={`status-badge ${Débito === 0 ? "status-quitado" : "status-Débito"}`}>{Débito === 0 ? "✓ Quitado" : `Débito ${fmt(Débito)}`}</span>
)}
                    </div>
                    <div className="btns-row">
                      {!p.entregue && <button className="btn-entregar" onClick={() => marcarEntregue(p.id)}>📦 Entreguei</button>}
                      {p.parcelas <= 1 &&
                        <button className={`btn-pagar`} onClick={() => pagarParcela(p.id, p.parcelas_pagas, 1)} style={{ opacity: p.parcelas_pagas >= 1 ? 0.5 : 1 }}>
                          {p.parcelas_pagas >= 1 ? "✓ Pago" : "💰 Marcar Pago"}
                        </button>
                      }
                      {p.parcelas_pagas > 0 && <button className="btn-entregar" onClick={() => voltarParcela(p.id, p.parcelas_pagas)}>↩ Voltar Parcela</button>}
                      <button style={{ background: "#fce4ec", color: "#c62828", border: "1.5px solid #ef9a9a", borderRadius: 10, padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }} onClick={() => excluirPedido(p.id)}>🗑 Excluir</button>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {tab === "clientes" && (
            <>
              <div className="section-label" style={{ marginBottom: 14 }}>Resumo por cliente em {nomeMes(mes)}</div>
              {clienteMap.length === 0 && <div className="empty"><div className="empty-icon">👥</div>Nenhuma cliente neste mês</div>}
              {clienteMap.map(c => (
                <div key={c.nome} className="cliente-card">
                  <div><div className="cliente-nome">{c.nome}</div><div className="cliente-sub">{c.pedidos} pedido{c.pedidos > 1 ? "s" : ""}</div></div>
                  <div className="cliente-nums">
                    <div className="cliente-total">{fmt(c.total)}</div>
                    <div className={`status-badge ${c.Débito > 0 ? "status-Débito" : "status-quitado"}`} style={{ marginTop: 4 }}>
                      {c.Débito > 0 ? `Débito ${fmt(c.Débito)}` : "✓ Em dia"}
                    </div>
                    <button style={{ background: "#fce4ec", color: "#c62828", border: "1.5px solid #ef9a9a", borderRadius: 10, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif", marginTop: 6 }} onClick={() => excluirCliente(c.nome)}>🗑 Excluir</button>
                  </div>
                </div>
              ))}
            </>
          )}




          {tab === "financeiro" && (
            <>


              <div className="fin-section">
                <div className="fin-title">Resumo de {nomeMes(mes)}</div>
                {[
                  { label: "Total vendido", val: fmt(totalVendido), cor: "#c2185b" },
                  { label: "Já recebido", val: fmt(totalRecebidoReal), cor: "#2e7d32" },
                  { label: "Ainda a receber", val: fmt(aReceber), cor: "#c62828" },
                  { label: "Total em produtos (catálogo)", val: fmt(totalCatalogo), cor: "#880e4f" },
                  { label: "Total pago (com desconto)", val: fmt(totalInv), cor: "#1565c0" },
                  { label: "Desconto obtido", val: fmt(totalCatalogo - totalInv), cor: "#2e7d32" },
                  { label: "Lucro do estoque inicial", val: fmt(totalEstoque), cor: "#2e7d32" },
                ].map(r => (
                  <div key={r.label} className="fin-row">
                    <span className="fin-label">{r.label}</span>
                    <span className="fin-val" style={{ color: r.cor }}>{r.val}</span>
                  </div>





                ))}





              </div>






              {totalCatalogo > 0 && totalVendido < totalCatalogo && (
                <div className="fin-section">
                  <div className="fin-title">📦 Sobra de Investimento</div>
                  {[
                    { label: "Total em produtos (catálogo)", val: fmt(totalCatalogo), cor: "#1565c0" },
                    { label: "Total vendido", val: fmt(totalVendido), cor: "#2e7d32" },
                    { label: "Sobra em produtos", val: fmt(totalCatalogo - totalVendido), cor: "#c62828" },
                  ].map(r => (
                    <div key={r.label} className="fin-row">
                      <span className="fin-label">{r.label}</span>
                      <span className="fin-val" style={{ color: r.cor }}>{r.val}</span>
                    </div>
                  ))}
                  <button className="btn-novo" style={{ width: "100%", marginTop: 12 }} onClick={transferirSobra}>
                    ➡️ Transferir sobra para o próximo mês
                  </button>
                </div>
              )}

            </>
          )}











          {tab === "relatorios" && (
            <>
              <div className="fin-section" style={{ marginBottom: 14 }}>
                <div className="fin-title">Evolução de Vendas</div>
                {melhorMes && (
                  <div style={{ background: "#fce4ec", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#880e4f" }}>
                    🏆 Melhor mês: <strong>{melhorMes.mes}</strong> com <strong>{fmt(melhorMes.vendido)}</strong> em vendas
                  </div>
                )}
                {dadosGrafico.length === 0 ? (
                  <div className="empty"><div className="empty-icon">📊</div>Nenhum dado ainda</div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={dadosGrafico} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fce4ec" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#b0819a" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#b0819a" }} tickFormatter={v => `R$${v}`} width={55} />
                      <Tooltip formatter={(v) => fmt(v)} labelFormatter={l => `Mês: ${l}`} contentStyle={{ borderRadius: 10, border: "1px solid #fce4ec", fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="vendido" name="Vendido" stroke="#c2185b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="recebido" name="Recebido" stroke="#2e7d32" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="investido" name="Investido" stroke="#1565c0" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="fin-section">
                <div className="fin-title">Lucro por Mês</div>
                {dadosGrafico.length === 0 ? (
                  <div className="empty"><div className="empty-icon">💰</div>Nenhum dado ainda</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={dadosGrafico} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fce4ec" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#b0819a" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#b0819a" }} tickFormatter={v => `R$${v}`} width={55} />
                      <Tooltip formatter={(v) => fmt(v)} labelFormatter={l => `Mês: ${l}`} contentStyle={{ borderRadius: 10, border: "1px solid #fce4ec", fontSize: 12 }} />
                      <Bar dataKey="lucro" name="Lucro Bruto" fill="#c2185b" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </>
          )}


          {tab === "estoque" && (
            <>
              <div className="fin-section">
                <div className="fin-title">🏪 Estoque Inicial — {nomeMes(mes)}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ fontSize: 13, color: "#6d4c61" }}>
                    Valor em estoque: <strong style={{ color: "#c2185b" }}>{fmt(estoques[mes] || 0)}</strong>
                  </span>
                  <button className="btn-novo" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => { setEstoqueTemp(estoques[mes] || 0); setEditandoEstoque(true); }}>
                    ✏️ Editar
                  </button>
                </div>
                {editandoEstoque && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
                    <input
                      type="number"
                      value={estoqueTemp}
                      onChange={e => setEstoqueTemp(e.target.value)}
                      style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1.5px solid #fce4ec", fontFamily: "DM Sans, sans-serif", fontSize: 14 }}
                      placeholder="Valor em R$"
                    />
                    <button className="btn-novo" style={{ padding: "8px 14px", fontSize: 12 }} onClick={() => salvarEstoque(estoqueTemp)}>Salvar</button>
                    <button className="btn-cancelar" style={{ padding: "8px 14px", fontSize: 12 }} onClick={() => setEditandoEstoque(false)}>Cancelar</button>
                  </div>
                )}
                <div style={{ background: "#fdf0f5", borderRadius: 10, padding: "12px 14px", marginTop: 8, fontSize: 13, color: "#6d4c61" }}>
                  💡 Coloque aqui o valor dos produtos que você já tinha antes de começar a usar o app. O lucro desses produtos será 100% do valor vendido.
                </div>
              </div>

              <div className="fin-section">
                <div className="fin-title">Resumo do Estoque</div>
                {[
                  { label: "Estoque inicial", val: fmt(estoques[mes] || 0), cor: "#1565c0" },
                  { label: "Vendas do estoque", val: fmt(totalEstoque), cor: "#2e7d32" },
                  { label: "Saldo restante", val: fmt((estoques[mes] || 0) - totalEstoque), cor: ((estoques[mes] || 0) - totalEstoque) >= 0 ? "#2e7d32" : "#c62828" },
                ].map(r => (
                  <div key={r.label} className="fin-row">
                    <span className="fin-label">{r.label}</span>
                    <span className="fin-val" style={{ color: r.cor }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </>
          )}



          {tab === "investimentos" && (
            <>
              <div className="section-header">
                <div className="section-label">Gastos em {nomeMes(mes)}</div>
                <button className="btn-novo" onClick={() => setModalInv(true)}>+ Registrar</button>
              </div>
              {invMes.length === 0 && <div className="empty"><div className="empty-icon">📦</div>Nenhum gasto registrado</div>}
              {invMes.map(i => (
                <div key={i.id} className="inv-card">
                  <div><div className="inv-desc">{i.descricao}</div><div className="inv-data">{i.data}</div></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="inv-val">{fmt(i.valor)}</div>
                    <button style={{ background: "#fce4ec", color: "#c62828", border: "1.5px solid #ef9a9a", borderRadius: 10, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }} onClick={() => excluirInv(i.id)}>🗑</button>
                  </div>
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

        {modalPedido && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalPedido(false)}>
            <div className="modal">
              <div className="modal-title">Novo Pedido ✦</div>
              {[["Cliente", "cliente", "text", "Nome da cliente"], ["Produto", "produto", "text", "Ex: Perfume Rose"], ["Valor Total (R$)", "valor", "number", "0,00"], ["Entrada (R$)", "entrada", "number", "0,00"], ["Parcelas restantes", "parcelas", "number", "1"], ["Data do Pedido", "data", "date", ""], ["Data do 1º Pagamento", "data_primeiro_pagamento", "date", ""]].map(([label, key, type, ph]) => (
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



              {form.valor && form.entrada && Number(form.entrada) > 0 && (
                <div style={{ background: "#fdf0f5", borderRadius: 10, padding: "12px 14px", marginBottom: 14, fontSize: 13 }}>
                  <div style={{ color: "#6d4c61", marginBottom: 4 }}>Restante após entrada: <strong style={{ color: "#c2185b" }}>{fmt(Number(form.valor) - Number(form.entrada))}</strong></div>
                  <div style={{ color: "#6d4c61" }}>Valor de cada parcela: <strong style={{ color: "#2e7d32" }}>{fmt((Number(form.valor) - Number(form.entrada)) / Number(form.parcelas))}</strong></div>
                </div>
              )}

              <div className="field">
                <label>Como conheceu</label>
                <select value={form.origem} onChange={e => setForm(f => ({ ...f, origem: e.target.value }))}>
                  <option value="">Selecione...</option>
                  <option value="Instagram">Instagram</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Indicação">Indicação</option>
                  <option value="Evento">Evento</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>




              <div className="field">
                <label>Produto do estoque inicial?</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, estoque: !f.estoque }))}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 10,
                      border: form.estoque ? "none" : "1.5px solid #fce4ec",
                      background: form.estoque ? "linear-gradient(135deg, #c2185b, #e91e8c)" : "#fff",
                      color: form.estoque ? "#fff" : "#b0819a",
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    {form.estoque ? "✓ Sim, do estoque inicial" : "Não"}
                  </button>
                </div>
                {form.estoque && (
                  <div style={{ fontSize: 12, color: "#2e7d32", marginTop: 6 }}>
                    ✓ Lucro = 100% do valor recebido
                  </div>
                )}
              </div>






              <div className="modal-btns">
                <button className="btn-cancelar" onClick={() => setModalPedido(false)}>Cancelar</button>
                <button className="btn-salvar" onClick={salvarPedido}>Salvar Pedido</button>
              </div>
            </div>
          </div>
        )}

        {modalInv && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalInv(false)}>
            <div className="modal">
              <div className="modal-title">Registrar Gasto 📦</div>
              {[["Descrição", "descricao", "text", "Ex: Compra de catálogo"], ["Valor do Catálogo (R$)", "valor_catalogo", "number", "0,00"], ["Desconto (%)", "desconto", "number", "0"], ["Data", "data", "date", ""]].map(([label, key, type, ph]) => (
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

              {invForm.valor_catalogo && invForm.desconto && (
                <div style={{ background: "#fdf0f5", borderRadius: 10, padding: "12px 14px", marginBottom: 14, fontSize: 13 }}>
                  <div style={{ color: "#6d4c61", marginBottom: 4 }}>Valor pago: <strong style={{ color: "#c2185b" }}>{fmt(invForm.valor_catalogo * (1 - invForm.desconto / 100))}</strong></div>
                  <div style={{ color: "#6d4c61" }}>Lucro bruto: <strong style={{ color: "#2e7d32" }}>{fmt(invForm.valor_catalogo * (invForm.desconto / 100))}</strong></div>
                </div>
              )}
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
