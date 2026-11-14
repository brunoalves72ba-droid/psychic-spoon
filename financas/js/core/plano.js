// Plano de contas: grupos, contas sugeridas e reconhecimento automático de lançamentos.
// Tudo puro (sem tela, sem armazenamento) — testado em tests/plano.test.mjs.
import { mesDe, somarMeses, hoje as hojeStr, mesAtual } from './datas.js';

export const GRUPOS = [
  { id: 'receitas', nome: 'Receitas', tipo: 'receita' },
  { id: 'moradia', nome: 'Moradia', tipo: 'despesa' },
  { id: 'alimentacao', nome: 'Alimentação', tipo: 'despesa' },
  { id: 'transporte', nome: 'Transporte', tipo: 'despesa' },
  { id: 'saude', nome: 'Saúde e bem-estar', tipo: 'despesa' },
  { id: 'educacao', nome: 'Educação', tipo: 'despesa' },
  { id: 'lazer', nome: 'Lazer', tipo: 'despesa' },
  { id: 'pessoal', nome: 'Pessoal e compras', tipo: 'despesa' },
  { id: 'servicos', nome: 'Assinaturas e serviços', tipo: 'despesa' },
  { id: 'financeiro', nome: 'Financeiro e impostos', tipo: 'despesa' },
  { id: 'outros', nome: 'Outros', tipo: 'despesa' },
];
export const nomeGrupo = (id) => GRUPOS.find((g) => g.id === id)?.nome || 'Outros';

/** Grupo de cada categoria que vem no app. */
export const GRUPO_PADRAO = {
  mercado: 'alimentacao', restaurante: 'alimentacao', casa: 'moradia', contas: 'moradia', transporte: 'transporte',
  saude: 'saude', educacao: 'educacao', lazer: 'lazer', compras: 'pessoal', assinaturas: 'servicos', outros: 'outros',
  salario: 'receitas', extra: 'receitas', 'outras-receitas': 'receitas',
};

/**
 * Contas do plano. As que têm `padrao` já vêm no app; as outras são SUGERIDAS quando
 * aparecem nos seus lançamentos. `pai` é a conta padrão que recebe o lançamento enquanto
 * a conta mais específica não for criada. `kw` reconhece a descrição (sem acentos, minúsculas).
 */
export const CONTAS = [
  // receitas
  { id: 'salario', nome: 'Salário', grupo: 'receitas', tipo: 'receita', padrao: true, kw: /salario|folha|proventos|vencimentos|pagamento de salario|holerite/ },
  { id: 'rendimentos', nome: 'Rendimentos', grupo: 'receitas', tipo: 'receita', pai: 'extra', kw: /rendimento|dividendo|\bjcp\b|juros sobre capital|remuneracao (da )?conta|rend pago/ },
  { id: 'reembolsos', nome: 'Reembolsos e cashback', grupo: 'receitas', tipo: 'receita', pai: 'outras-receitas', kw: /reembolso|cashback|estorno|devolucao/ },
  { id: 'vendas', nome: 'Vendas', grupo: 'receitas', tipo: 'receita', pai: 'extra', kw: /venda|mercado ?pago.*recebid|olx|enjoei/ },
  { id: 'extra', nome: 'Renda extra', grupo: 'receitas', tipo: 'receita', padrao: true, kw: /freela|bico|comissao|honorario/ },
  { id: 'outras-receitas', nome: 'Outras entradas', grupo: 'receitas', tipo: 'receita', padrao: true },
  // moradia
  { id: 'casa', nome: 'Moradia', grupo: 'moradia', tipo: 'despesa', padrao: true, kw: /aluguel|imobiliaria|quinto ?andar|financiamento (imob|habit)/ },
  { id: 'condominio', nome: 'Condomínio', grupo: 'moradia', tipo: 'despesa', pai: 'casa', kw: /condominio|\bcond\b/ },
  { id: 'energia', nome: 'Energia', grupo: 'moradia', tipo: 'despesa', pai: 'contas', kw: /enel|\blight\b|cemig|copel|celesc|coelba|neoenergia|energisa|equatorial|cpfl|elektro|conta de luz|energia/ },
  { id: 'agua', nome: 'Água', grupo: 'moradia', tipo: 'despesa', pai: 'contas', kw: /sabesp|cedae|copasa|sanepar|embasa|compesa|caesb|cagece|saneago|conta de agua|aguas de/ },
  { id: 'gas', nome: 'Gás', grupo: 'moradia', tipo: 'despesa', pai: 'contas', kw: /comgas|naturgy|ultragaz|liquigas|supergasbras|copagaz|botijao|\bgas\b/ },
  { id: 'internet', nome: 'Internet e celular', grupo: 'moradia', tipo: 'despesa', pai: 'contas', kw: /\bclaro\b|\bvivo\b|\btim\b|\boi\b|\bnet\b|\bsky\b|internet|telefon|recarga celular|desktop|brisanet|algar/ },
  { id: 'contas', nome: 'Contas (luz, água, internet)', grupo: 'moradia', tipo: 'despesa', padrao: true },
  { id: 'manutencao-casa', nome: 'Manutenção da casa', grupo: 'moradia', tipo: 'despesa', pai: 'casa', kw: /leroy|telhanorte|c&c|material de constru|eletricista|encanador|dedetiz|tok ?stok|camicado|mobly|madeira ?madeira/ },
  // alimentação
  { id: 'mercado', nome: 'Mercado', grupo: 'alimentacao', tipo: 'despesa', padrao: true, kw: /supermerc|mercado(?! ?(livre|pago))|atacad|assai|carrefour|pao de acucar|\bextra\b|\bbig\b|zaffari|condor|savegnago|guanabara|st marche|oba hortifruti|mambo|sonda/ },
  { id: 'feira', nome: 'Feira e hortifrúti', grupo: 'alimentacao', tipo: 'despesa', pai: 'mercado', kw: /hortifruti|sacolao|(?<!-)\bfeira\b|quitanda|acougue|peixaria/ },
  { id: 'padaria', nome: 'Padaria e café', grupo: 'alimentacao', tipo: 'despesa', pai: 'restaurante', kw: /padaria|panificadora|\bcafe\b|cafeteria|starbucks|confeitaria/ },
  { id: 'delivery', nome: 'Delivery', grupo: 'alimentacao', tipo: 'despesa', pai: 'restaurante', kw: /ifood|rappi|ze delivery|aiqfome|delivery|uber ?eats/ },
  { id: 'restaurante', nome: 'Restaurante e delivery', grupo: 'alimentacao', tipo: 'despesa', padrao: true, kw: /restaurante|lanchonete|pizza|burger|mcdonald|\bbk\b|subway|churrasc|sushi|outback|lanche|almoco|jantar|marmita/ },
  // transporte
  { id: 'combustivel', nome: 'Combustível', grupo: 'transporte', tipo: 'despesa', pai: 'transporte', kw: /posto|combust|gasolina|etanol|\bshell\b|ipiranga|petrobras|br mania|abasteci/ },
  { id: 'app-transporte', nome: 'Uber e táxi', grupo: 'transporte', tipo: 'despesa', pai: 'transporte', kw: /\buber\b(?! ?eats)|\b99\b|99 ?(app|pop|taxi)|cabify|indrive|taxi/ },
  { id: 'estacionamento', nome: 'Estacionamento e pedágio', grupo: 'transporte', tipo: 'despesa', pai: 'transporte', kw: /estacion|zona azul|pedagio|sem parar|conectcar|veloe|move mais|taggy/ },
  { id: 'transporte-publico', nome: 'Transporte público', grupo: 'transporte', tipo: 'despesa', pai: 'transporte', kw: /\bmetro\b|onibus|bilhete unico|sptrans|riocard|top recarga|cartao transporte|\btrem\b|\bbrt\b/ },
  { id: 'carro', nome: 'Carro (manutenção, IPVA, seguro)', grupo: 'transporte', tipo: 'despesa', pai: 'transporte', kw: /oficina|mecanic|pneu|auto ?pecas|lava ?rapido|ipva|licenciamento|detran|seguro auto|funilaria/ },
  { id: 'transporte', nome: 'Transporte', grupo: 'transporte', tipo: 'despesa', padrao: true },
  // saúde
  { id: 'farmacia', nome: 'Farmácia', grupo: 'saude', tipo: 'despesa', pai: 'saude', kw: /farmac|drogaria|droga ?raia|drogasil|pague menos|panvel|nissei|drogao/ },
  { id: 'plano-saude', nome: 'Plano de saúde', grupo: 'saude', tipo: 'despesa', pai: 'saude', kw: /unimed|amil|hapvida|sulamerica|bradesco saude|notredame|porto saude|plano de saude|prevent senior/ },
  { id: 'academia', nome: 'Academia e esporte', grupo: 'saude', tipo: 'despesa', pai: 'saude', kw: /academia|smart ?fit|bluefit|bodytech|selfit|gympass|wellhub|totalpass|crossfit|pilates|natacao/ },
  { id: 'consultas', nome: 'Consultas e exames', grupo: 'saude', tipo: 'despesa', pai: 'saude', kw: /clinica|consulta|medic|odonto|dentist|laborat|exame|psicolog|fisioterap|hospital|fleury|dasa|lavoisier/ },
  { id: 'saude', nome: 'Saúde', grupo: 'saude', tipo: 'despesa', padrao: true },
  // educação
  { id: 'cursos', nome: 'Cursos', grupo: 'educacao', tipo: 'despesa', pai: 'educacao', kw: /udemy|alura|curso|hotmart|coursera|duolingo|rocketseat/ },
  { id: 'livros', nome: 'Livros', grupo: 'educacao', tipo: 'despesa', pai: 'educacao', kw: /livraria|kindle|livro|saraiva|leitura|estante virtual/ },
  { id: 'educacao', nome: 'Educação', grupo: 'educacao', tipo: 'despesa', padrao: true, kw: /escola|faculdade|universidade|mensalidade|colegio|material escolar/ },
  // lazer
  { id: 'viagem', nome: 'Viagens', grupo: 'lazer', tipo: 'despesa', pai: 'lazer', kw: /hotel|airbnb|booking|decolar|\blatam\b|\bgol\b|\bazul\b|passagem|pousada|hostel|123 ?milhas|maxmilhas|cvc/ },
  { id: 'cinema-shows', nome: 'Cinema e shows', grupo: 'lazer', tipo: 'despesa', pai: 'lazer', kw: /cinema|cinemark|kinoplex|ingresso|sympla|eventim|\bshow\b|teatro/ },
  { id: 'jogos', nome: 'Jogos', grupo: 'lazer', tipo: 'despesa', pai: 'lazer', kw: /steam|playstation|\bpsn\b|xbox|nintendo|epic games|riot|garena/ },
  { id: 'bares', nome: 'Bares e saídas', grupo: 'lazer', tipo: 'despesa', pai: 'lazer', kw: /\bbar\b|boteco|cervejaria|\bpub\b|balada|adega/ },
  { id: 'lazer', nome: 'Lazer', grupo: 'lazer', tipo: 'despesa', padrao: true },
  // pessoal
  { id: 'vestuario', nome: 'Roupas e calçados', grupo: 'pessoal', tipo: 'despesa', pai: 'compras', kw: /renner|riachuelo|c&a|\bcea\b|zara|shein|hering|centauro|netshoes|calcad|marisa|youcom|dafiti|nike|adidas/ },
  { id: 'beleza', nome: 'Beleza e cuidados', grupo: 'pessoal', tipo: 'despesa', pai: 'compras', kw: /salao|barbearia|cabeleir|manicure|boticario|natura|sephora|avon|eudora|estetica/ },
  { id: 'pets', nome: 'Pets', grupo: 'pessoal', tipo: 'despesa', pai: 'compras', kw: /petz|cobasi|pet ?shop|veterin|racao|petlove/ },
  { id: 'eletronicos', nome: 'Eletrônicos', grupo: 'pessoal', tipo: 'despesa', pai: 'compras', kw: /kabum|fast ?shop|apple store|samsung|pichau|terabyte|xiaomi/ },
  { id: 'compras', nome: 'Compras', grupo: 'pessoal', tipo: 'despesa', padrao: true, kw: /amazon(?! prime)|mercado ?livre|mercadolivre|magalu|magazine|shopee|aliexpress|americanas|casas bahia|temu|loja/ },
  // serviços
  { id: 'streaming', nome: 'Streaming', grupo: 'servicos', tipo: 'despesa', pai: 'assinaturas', kw: /netflix|spotify|amazon prime|prime video|disney|hbo|globoplay|youtube premium|deezer|paramount|crunchyroll|apple tv|apple music|max\.com/ },
  { id: 'apps', nome: 'Apps e nuvem', grupo: 'servicos', tipo: 'despesa', pai: 'assinaturas', kw: /apple\.com|icloud|google (one|storage|play)|microsoft|office 365|dropbox|chatgpt|openai|anthropic|claude\.ai|canva|adobe/ },
  { id: 'assinaturas', nome: 'Assinaturas', grupo: 'servicos', tipo: 'despesa', padrao: true, kw: /assinatura|mensalidade app/ },
  // financeiro
  { id: 'tarifas', nome: 'Tarifas bancárias', grupo: 'financeiro', tipo: 'despesa', pai: 'outros', kw: /tarifa|anuidade|cesta de servicos|pacote de servicos|manutencao de conta/ },
  { id: 'juros', nome: 'Juros e multas', grupo: 'financeiro', tipo: 'despesa', pai: 'outros', kw: /juros|\biof\b|multa|encargo|\bmora\b|rotativo/ },
  { id: 'impostos', nome: 'Impostos', grupo: 'financeiro', tipo: 'despesa', pai: 'outros', kw: /iptu|darf|imposto|irpf|\bdas\b|\bgps\b|inss|receita federal/ },
  { id: 'emprestimos', nome: 'Empréstimos e parcelas', grupo: 'financeiro', tipo: 'despesa', pai: 'outros', kw: /emprestimo|financiamento|consignado|parcela credito|credito pessoal/ },
  { id: 'doacoes', nome: 'Doações', grupo: 'financeiro', tipo: 'despesa', pai: 'outros', kw: /doacao|dizimo|oferta|vakinha/ },
  { id: 'outros', nome: 'Outros gastos', grupo: 'outros', tipo: 'despesa', padrao: true },
];

export const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const chaveDescricao = (s) => semAcento(s).replace(/\d+/g, '').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();

const contaPorId = Object.fromEntries(CONTAS.map((c) => [c.id, c]));
export const grupoDaCategoria = (cat) => cat?.grupo || GRUPO_PADRAO[cat?.id] || contaPorId[cat?.id]?.grupo || (cat?.tipo === 'receita' ? 'receitas' : 'outros');

/**
 * Reconhece a conta de um lançamento pela descrição.
 * Ordem: o que você já ensinou ao app → o que você já usou para a mesma descrição →
 * palavras conhecidas → conta padrão. Devolve { categoria, fonte, palavra?, sugerida? }:
 * `sugerida` é a conta mais específica do plano que ainda não existe no seu app.
 */
export function reconhecer(descricao, tipo, estado) {
  const existe = (id) => estado.categorias.some((c) => c.id === id && c.tipo === tipo);
  const padrao = () => (tipo === 'despesa' ? 'outros' : 'outras-receitas');
  const chave = chaveDescricao(descricao);
  if (chave) {
    const ensinada = estado.regras?.[tipo + ':' + chave];
    if (ensinada && existe(ensinada)) return { categoria: ensinada, fonte: 'regra' };
    for (let i = estado.lancamentos.length - 1; i >= 0; i--) {
      const l = estado.lancamentos[i];
      if (l.tipo === tipo && l.descricao && chaveDescricao(l.descricao) === chave && existe(l.categoria)) return { categoria: l.categoria, fonte: 'historico' };
    }
    // contas criadas por você com o mesmo nome que aparece na descrição ("Academia", "Fulano")
    for (const c of estado.categorias) {
      if (c.tipo !== tipo || contaPorId[c.id]) continue;
      const n = chaveDescricao(c.nome);
      if (n.length >= 4 && (' ' + chave + ' ').includes(' ' + n + ' ')) return { categoria: c.id, fonte: 'nome', palavra: c.nome };
    }
  }
  const d = ' ' + semAcento(descricao) + ' ';
  for (const conta of CONTAS) {
    if (conta.tipo !== tipo || !conta.kw) continue;
    const m = d.match(conta.kw);
    if (!m) continue;
    if (existe(conta.id)) return { categoria: conta.id, fonte: 'palavra', palavra: m[0].trim() };
    const destino = conta.pai && existe(conta.pai) ? conta.pai : existe(padrao()) ? padrao() : null;
    if (destino) return { categoria: destino, fonte: 'palavra', palavra: m[0].trim(), sugerida: conta.id };
  }
  const cat = existe(padrao()) ? padrao() : estado.categorias.find((c) => c.tipo === tipo)?.id || '';
  return { categoria: cat, fonte: 'padrao' };
}

// ---------- lançamento rápido: "uber 23,50 ontem no pix" ----------
const SEMANA = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
const PAGS = [[/\bpix\b/, 'Pix'], [/\bdebito\b/, 'Débito'], [/\b(credito|cartao)\b/, 'Crédito'], [/\b(dinheiro|especie)\b/, 'Dinheiro'], [/\bboleto\b/, 'Boleto'], [/\b(transferencia|ted|doc)\b/, 'Transferência']];
const VERBOS_RECEITA = /\b(recebi|ganhei|entrou|entrada|caiu|salario|reembolso|rendimento|vendi)\b/;
const VAZIAS = /\b(gastei|paguei|comprei|recebi|ganhei|entrou|caiu|vendi|com|no|na|nos|nas|de|do|da|em|pelo|pela|para|pra|por|um|uma|o|a|e|reais|real|conto|contos|pila|r\$|hoje|ontem|anteontem|dia|via|cartao|pix|debito|credito|dinheiro|boleto|transferencia|ted|doc|especie|passado|passada)\b/g;

function dataDe(t, hoje) {
  const [a, m, d] = hoje.split('-').map(Number);
  const base = new Date(a, m - 1, d);
  const fmt = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  if (/\banteontem\b/.test(t)) return fmt(new Date(a, m - 1, d - 2));
  if (/\bontem\b/.test(t)) return fmt(new Date(a, m - 1, d - 1));
  let x = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (x) {
    const ano = x[3] ? (x[3].length === 2 ? 2000 + +x[3] : +x[3]) : a;
    let dt = new Date(ano, +x[2] - 1, +x[1]);
    if (!x[3] && dt > base) dt = new Date(ano - 1, +x[2] - 1, +x[1]);
    return fmt(dt);
  }
  x = t.match(/\bdia (\d{1,2})\b/);
  if (x) { let dt = new Date(a, m - 1, +x[1]); if (dt > base) dt = new Date(a, m - 2, +x[1]); return fmt(dt); }
  for (let i = 0; i < 7; i++) {
    if (new RegExp(`\\b${SEMANA[i]}(-feira)?\\b`).test(t)) {
      const diff = ((base.getDay() - i + 7) % 7) || 7;
      return fmt(new Date(a, m - 1, d - diff));
    }
  }
  return null;
}

/**
 * Entende uma frase curta e devolve os campos reconhecidos (só os que achou).
 * Ex.: "gastei 45,90 no mercado ontem no débito" →
 *      { tipo: 'despesa', valor: 4590, descricao: 'Mercado', data: <ontem>, pagamento: 'Débito' }
 */
export function interpretarFrase(texto, hoje = hojeStr()) {
  const t = semAcento(texto).replace(/\s+/g, ' ').trim();
  if (!t) return {};
  const r = {};
  r.tipo = VERBOS_RECEITA.test(t) ? 'receita' : 'despesa';
  const data = dataDe(t, hoje);
  if (data && data !== hoje) r.data = data;
  for (const [re, p] of PAGS) if (re.test(t)) { r.pagamento = p; break; }
  // valor: o último número que não faz parte de data ("dia 5", "05/11")
  const semDatas = t.replace(/\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/g, ' ').replace(/\bdia \d{1,2}\b/g, ' ');
  const nums = [...semDatas.matchAll(/(?:r\$ ?)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)(?:\s?(?:reais|real|conto|contos|pila|k|mil)\b)?/g)];
  if (nums.length) {
    const bruto = nums[nums.length - 1];
    let s = bruto[1];
    s = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : /^\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, '') : s;
    let v = Math.round(parseFloat(s) * 100);
    if (/\b(k|mil)\b/.test(bruto[0])) v *= 1000;
    if (v > 0) r.valor = v;
  }
  // descrição: o que sobra tirando número, data, forma de pagamento e palavras de ligação
  const original = String(texto).replace(/\s+/g, ' ').trim();
  const palavras = original.split(' ').filter((p) => {
    const n = semAcento(p).replace(/[.,;:!?]+$/, '');
    if (!n) return false;
    if (/^(r\$)?\d+([.,]\d+)*(k|mil)?$/.test(n) || /^\d{1,2}\/\d{1,2}(\/\d{2,4})?$/.test(n)) return false;
    if (SEMANA.some((s) => n === s || n === s + '-feira')) return false;
    if (n === 'mil' || n === 'k') return false;
    if (n === 'r$') return false;
    return n.replace(VAZIAS, '').trim() !== '';
  });
  const desc = palavras.join(' ').replace(/\s+/g, ' ').trim();
  if (desc) r.descricao = desc.charAt(0).toUpperCase() + desc.slice(1);
  return r;
}

// ---------- sugestões para o plano de contas ----------
/**
 * Olha os seus lançamentos e sugere como completar o plano de contas:
 *  - criar: contas mais específicas que já aparecem várias vezes (ex.: "Academia", "Combustível");
 *  - classificar: descrições repetidas que estão em "Outros" e o app não reconheceu;
 *  - fixas: gastos que se repetem todo mês com o mesmo valor e ainda não são conta fixa.
 */
export function sugestoesPlano(estado, hoje = hojeStr()) {
  const existe = (id) => estado.categorias.some((c) => c.id === id);
  const genericas = new Set(['outros', 'outras-receitas', 'compras', 'extra']);
  const desde = somarMeses(mesDe(hoje), -5);
  const recentes = estado.lancamentos.filter((l) => mesDe(l.data) >= desde);

  // 1) contas para criar
  const criar = new Map();
  for (const l of recentes) {
    const r = reconhecer(l.descricao || '', l.tipo, { ...estado, lancamentos: [], regras: {} });
    if (!r.sugerida || existe(r.sugerida)) continue;
    const conta = contaPorId[r.sugerida];
    // só sugere se o lançamento está na conta "mãe" ou numa genérica (não mexe no que você escolheu de propósito)
    if (l.categoria !== conta.pai && !genericas.has(l.categoria)) continue;
    const s = criar.get(conta.id) || { conta, lancamentos: [], total: 0, exemplos: new Set() };
    s.lancamentos.push(l.id); s.total += l.valor; s.exemplos.add(l.descricao);
    criar.set(conta.id, s);
  }
  const contasCriar = [...criar.values()]
    .filter((s) => s.lancamentos.length >= 2)
    .sort((a, b) => b.total - a.total)
    .map((s) => ({ ...s, exemplos: [...s.exemplos].slice(0, 3) }));

  // 2) descrições repetidas sem conta definida
  const soltas = new Map();
  for (const l of recentes) {
    if (!['outros', 'outras-receitas'].includes(l.categoria)) continue;
    const k = l.tipo + ':' + chaveDescricao(l.descricao);
    if (k.endsWith(':') || estado.regras?.[k]) continue;
    const r = reconhecer(l.descricao, l.tipo, { ...estado, lancamentos: [], regras: {} });
    if (r.fonte !== 'padrao') continue;
    const s = soltas.get(k) || { chave: k, tipo: l.tipo, descricao: l.descricao, lancamentos: [], total: 0 };
    s.lancamentos.push(l.id); s.total += l.valor;
    soltas.set(k, s);
  }
  const classificar = [...soltas.values()].filter((s) => s.lancamentos.length >= 2).sort((a, b) => b.total - a.total);

  // 3) gastos que parecem conta fixa
  const porChave = new Map();
  for (const l of recentes) {
    if (l.tipo !== 'despesa' || l.recorrente || !l.descricao) continue;
    const k = chaveDescricao(l.descricao);
    if (!k) continue;
    (porChave.get(k) || porChave.set(k, []).get(k)).push(l);
  }
  const jaFixas = new Set(estado.recorrentes.filter((r) => !r.fim).map((r) => chaveDescricao(r.descricao)));
  const fixas = [];
  const mesHoje = mesDe(hoje);
  for (const [k, ls] of porChave) {
    if (jaFixas.has(k)) continue;
    const porMes = new Map();
    for (const l of ls) if (!porMes.has(mesDe(l.data))) porMes.set(mesDe(l.data), l);
    const meses = [...porMes.keys()].sort();
    if (meses.length < 3) continue;
    // três meses seguidos terminando no mês passado ou neste
    const ult = meses[meses.length - 1];
    if (ult < somarMeses(mesHoje, -1)) continue;
    const seguidos = [ult, somarMeses(ult, -1), somarMeses(ult, -2)].every((m) => porMes.has(m));
    if (!seguidos) continue;
    const valores = meses.slice(-3).map((m) => porMes.get(m).valor);
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    if (valores.some((v) => Math.abs(v - media) > media * 0.1)) continue; // valor muda demais: não é fixa
    const ultimo = porMes.get(ult);
    fixas.push({ chave: k, descricao: ultimo.descricao, valor: ultimo.valor, dia: +ultimo.data.slice(8, 10), categoria: ultimo.categoria, pagamento: ultimo.pagamento || '', meses: meses.length, temNesteMes: porMes.has(mesHoje) });
  }
  fixas.sort((a, b) => b.valor - a.valor);

  const fora = new Set(estado.dispensadas || []);
  const c1 = contasCriar.filter((x) => !fora.has('criar:' + x.conta.id));
  const c2 = classificar.filter((x) => !fora.has('classificar:' + x.chave));
  const c3 = fixas.filter((x) => !fora.has('fixa:' + x.chave));
  return { criar: c1, classificar: c2, fixas: c3, total: c1.length + c2.length + c3.length };
}

/** Contas do plano que ainda não existem no app, por grupo (para criar à mão). */
export function contasDisponiveis(estado) {
  return CONTAS.filter((c) => !estado.categorias.some((x) => x.id === c.id));
}

export { mesAtual };
