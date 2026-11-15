// Plano de contas: grupos, contas sugeridas e reconhecimento automático de lançamentos.
// Tudo puro (sem tela, sem armazenamento) — testado em tests/plano.test.mjs.
import { mesDe, somarMeses, hoje as hojeStr, mesAtual } from './datas.js';

export const GRUPOS = [
  { id: 'receitas', nome: 'Receitas', tipo: 'receita' },
  { id: 'moradia', nome: 'Moradia', tipo: 'despesa' },
  { id: 'reforma', nome: 'Reforma', tipo: 'despesa' },
  { id: 'alimentacao', nome: 'Alimentação', tipo: 'despesa' },
  { id: 'transporte', nome: 'Transporte e veículo', tipo: 'despesa' },
  { id: 'saude', nome: 'Saúde e bem-estar', tipo: 'despesa' },
  { id: 'educacao', nome: 'Educação', tipo: 'despesa' },
  { id: 'lazer', nome: 'Lazer', tipo: 'despesa' },
  { id: 'pessoal', nome: 'Pessoal e compras', tipo: 'despesa' },
  { id: 'servicos', nome: 'Serviços e assinaturas', tipo: 'despesa' },
  { id: 'domesticos', nome: 'Empregados domésticos', tipo: 'despesa' },
  { id: 'impostos', nome: 'Impostos e taxas', tipo: 'despesa' },
  { id: 'financeiro', nome: 'Financeiro e seguros', tipo: 'despesa' },
  { id: 'patrimonio', nome: 'Investimentos e patrimônio', tipo: 'despesa' },
  { id: 'transferencias', nome: 'Transferências (não contam como gasto)', tipo: 'despesa' },
  { id: 'outros', nome: 'Outros', tipo: 'despesa' },
  { id: 'transferencias-entrada', nome: 'Transferências recebidas (não contam como renda)', tipo: 'receita' },
];
export const nomeGrupo = (id) => GRUPOS.find((g) => g.id === id)?.nome || 'Outros';

/**
 * Contas que movimentam dinheiro mas NÃO são gasto nem renda (pagar a fatura, passar
 * dinheiro entre as próprias contas, aplicar ou resgatar investimento). Ficam no extrato,
 * mas fora dos totais, gráficos, metas e previsões — assim nada é contado duas vezes.
 */
export const NEUTRAS = new Set(['transf-contas', 'transf-identificar', 'fatura-cartao', 'invest-auto', 'transf-entrada', 'resgate']);

/**
 * Plano de contas pessoal (adaptado da lista de validação do Bruno: o que era só de empresa
 * — PIS, COFINS, ICMS, Simples, estoque, fornecedores, maquininha, marketing, Abrasel,
 * Sindipan — ficou de fora; o que era de funcionário virou "Empregados domésticos").
 * `padrao`: já vem no app. `pai`: conta que recebe o lançamento se esta não existir.
 * `kw`: palavras que reconhecem a descrição (sem acentos, minúsculas). A ordem importa:
 * as mais específicas vêm antes.
 */

/**
 * Contas do plano. As que têm `padrao` já vêm no app; as outras são SUGERIDAS quando
 * aparecem nos seus lançamentos. `pai` é a conta padrão que recebe o lançamento enquanto
 * a conta mais específica não for criada. `kw` reconhece a descrição (sem acentos, minúsculas).
 */
export const CONTAS = [
  // ----- receitas
  { id: 'salario', nome: 'Salário / pró-labore', grupo: 'receitas', tipo: 'receita', padrao: true, kw: /salario|folha|proventos|vencimentos|pagamento de salario|holerite|pro-?labore/ },
  { id: 'decimo-ferias', nome: '13º e férias', grupo: 'receitas', tipo: 'receita', padrao: true, pai: 'salario', kw: /13o|decimo terceiro|\bferias\b/ },
  { id: 'bonus', nome: 'Bonificações e premiações', grupo: 'receitas', tipo: 'receita', padrao: true, pai: 'extra', kw: /bonus|bonifica|premia|\bplr\b|participacao nos lucros/ },
  { id: 'lucros', nome: 'Distribuição de lucros', grupo: 'receitas', tipo: 'receita', padrao: true, pai: 'extra', kw: /distribuicao de lucros|lucros distribuidos/ },
  { id: 'rendimentos', nome: 'Rendimentos', grupo: 'receitas', tipo: 'receita', padrao: true, pai: 'extra', kw: /rendimento|dividendo|\bjcp\b|juros sobre capital|remuneracao (da )?conta|rend pago/ },
  { id: 'reembolsos', nome: 'Reembolsos e cashback', grupo: 'receitas', tipo: 'receita', padrao: true, pai: 'outras-receitas', kw: /reembolso|cashback/ },
  { id: 'devolucoes', nome: 'Devoluções', grupo: 'receitas', tipo: 'receita', padrao: true, pai: 'outras-receitas', kw: /devolu|estorno|valor devolvido|compra cancelada|cancelamento de compra/ },
  { id: 'ticket-alimentacao', nome: 'Ticket Alimentação', grupo: 'receitas', tipo: 'receita', padrao: true, pai: 'salario', kw: /(ticket|vale|alelo|sodexo|pluxee|flash|caju|swile|cartao|beneficio|credito)[a-z ]{0,12}alimentacao|\bva\b|ticket alim/ },
  { id: 'ticket-refeicao', nome: 'Ticket Refeição', grupo: 'receitas', tipo: 'receita', padrao: true, pai: 'salario', kw: /(ticket|vale|alelo|sodexo|pluxee|flash|caju|swile|cartao|beneficio|credito)[a-z ]{0,12}refeicao|\bvr\b|ticket ref/ },
  { id: 'complemento', nome: 'Complemento de receita', grupo: 'receitas', tipo: 'receita', padrao: true, pai: 'salario', kw: /complemento|complementacao|ajuda de custo|auxilio/ },
  { id: 'vendas', nome: 'Vendas', grupo: 'receitas', tipo: 'receita', pai: 'extra', kw: /venda|olx|enjoei/ },
  { id: 'extra', nome: 'Renda extra', grupo: 'receitas', tipo: 'receita', padrao: true, kw: /freela|bico|comissao|honorario/ },
  { id: 'outras-receitas', nome: 'Outras entradas', grupo: 'receitas', tipo: 'receita', padrao: true },
  { id: 'resgate', nome: 'Resgate de investimento', grupo: 'transferencias-entrada', tipo: 'receita', padrao: true, kw: /resgate|resg\b/ },
  { id: 'transf-entrada', nome: 'Transferência entre contas (entrada)', grupo: 'transferencias-entrada', tipo: 'receita', padrao: true, kw: /transferencia entre contas|mesma titularidade|transf(erencia)? propria/ },
  // ----- moradia
  { id: 'casa', nome: 'Aluguel', grupo: 'moradia', tipo: 'despesa', padrao: true, kw: /aluguel|imobiliaria|quinto ?andar|financiamento (imob|habit)/ },
  { id: 'condominio', nome: 'Condomínio', grupo: 'moradia', tipo: 'despesa', padrao: true, pai: 'casa', kw: /condominio|\bcond\b/ },
  { id: 'iptu', nome: 'IPTU', grupo: 'moradia', tipo: 'despesa', padrao: true, pai: 'casa', kw: /\biptu\b/ },
  { id: 'agua', nome: 'Água', grupo: 'moradia', tipo: 'despesa', padrao: true, pai: 'contas', kw: /sabesp|cedae|copasa|sanepar|embasa|compesa|caesb|cagece|saneago|conta de agua|aguas de/ },
  { id: 'energia', nome: 'Energia', grupo: 'moradia', tipo: 'despesa', padrao: true, pai: 'contas', kw: /enel|\blight\b|cemig|copel|celesc|coelba|neoenergia|energisa|equatorial|cpfl|elektro|conta de luz|energia/ },
  { id: 'gas', nome: 'Gás', grupo: 'moradia', tipo: 'despesa', padrao: true, pai: 'contas', kw: /comgas|naturgy|ultragaz|liquigas|supergasbras|copagaz|botijao|\bgas\b/ },
  { id: 'internet', nome: 'Telefonia fixa e internet', grupo: 'moradia', tipo: 'despesa', padrao: true, pai: 'contas', kw: /\bclaro\b|\bvivo\b|\btim\b|\boi\b|\bnet\b|\bsky\b|internet|telefon|recarga celular|desktop|brisanet|algar/ },
  { id: 'contas', nome: 'Contas (luz, água, internet)', grupo: 'moradia', tipo: 'despesa' },
  { id: 'limpeza', nome: 'Material de limpeza', grupo: 'moradia', tipo: 'despesa', padrao: true, pai: 'mercado', kw: /material de limpeza|produtos de limpeza|limpeza/ },
  { id: 'dedetizacao', nome: 'Dedetização e desentupidora', grupo: 'moradia', tipo: 'despesa', padrao: true, pai: 'manutencao-casa', kw: /dedetiz|desentup|controle de pragas/ },
  { id: 'manutencao-casa', nome: 'Manutenção da casa', grupo: 'moradia', tipo: 'despesa', padrao: true, pai: 'casa', kw: /leroy|telhanorte|c&c|tok ?stok|camicado|mobly|madeira ?madeira|chaveiro|marido de aluguel/ },
  // ----- reforma
  { id: 'ref-mao-de-obra', nome: 'Mão de obra (trabalhadores)', grupo: 'reforma', tipo: 'despesa', padrao: true, pai: 'manutencao-casa', kw: /pedreiro|eletricista|encanador|mestre de obras|mao de obra|servente/ },
  { id: 'ref-hidraulica', nome: 'Hidráulica', grupo: 'reforma', tipo: 'despesa', padrao: true, pai: 'manutencao-casa', kw: /hidraulic|\btigre\b|amanco|\bdocol\b|deca\b/ },
  { id: 'ref-eletrica', nome: 'Elétrica', grupo: 'reforma', tipo: 'despesa', padrao: true, pai: 'manutencao-casa', kw: /material eletrico|eletrica|\bfios?\b|disjuntor/ },
  { id: 'ref-estrutural', nome: 'Estrutural', grupo: 'reforma', tipo: 'despesa', padrao: true, pai: 'manutencao-casa', kw: /estrutural|engenheir|laje|fundacao/ },
  { id: 'ref-teto', nome: 'Teto', grupo: 'reforma', tipo: 'despesa', padrao: true, pai: 'manutencao-casa', kw: /telha|forro|gesso|calha/ },
  { id: 'ref-alvenaria', nome: 'Alvenaria', grupo: 'reforma', tipo: 'despesa', padrao: true, pai: 'manutencao-casa', kw: /cimento|areia|tijolo|bloco|votoran|argamassa|reboco|deposito de material|material de construcao/ },
  { id: 'ref-ferros', nome: 'Colunas e ferros', grupo: 'reforma', tipo: 'despesa', padrao: true, pai: 'manutencao-casa', kw: /vergalhao|gerdau|ferragens?|\bferro\b/ },
  { id: 'ref-portas', nome: 'Portas e janelas', grupo: 'reforma', tipo: 'despesa', padrao: true, pai: 'manutencao-casa', kw: /portas?\b|janelas?\b|vidracaria|serralheria|esquadria/ },
  { id: 'ref-fachada', nome: 'Fachada e pintura', grupo: 'reforma', tipo: 'despesa', padrao: true, pai: 'manutencao-casa', kw: /fachada|pintura|tintas?\b|suvinil|\bcoral\b|pintor/ },
  { id: 'reforma', nome: 'Reforma (outros)', grupo: 'reforma', tipo: 'despesa', padrao: true, pai: 'manutencao-casa', kw: /reforma|obra\b/ },
  // ----- alimentação
  { id: 'mercado', nome: 'Mercado', grupo: 'alimentacao', tipo: 'despesa', padrao: true, kw: /supermerc|mercado(?! ?(livre|pago))|atacad|assai|carrefour|pao de acucar|\bextra\b|\bbig\b|zaffari|condor|savegnago|guanabara|st marche|mambo|sonda/ },
  { id: 'feira', nome: 'Feira e hortifrúti', grupo: 'alimentacao', tipo: 'despesa', pai: 'mercado', kw: /hortifruti|sacolao|(?<!-)\bfeira\b|quitanda|acougue|peixaria/ },
  { id: 'padaria', nome: 'Padaria e café', grupo: 'alimentacao', tipo: 'despesa', pai: 'restaurante', kw: /padaria|panificadora|\bcafe\b|cafeteria|starbucks|confeitaria/ },
  { id: 'delivery', nome: 'Delivery', grupo: 'alimentacao', tipo: 'despesa', pai: 'restaurante', kw: /ifood|rappi|ze delivery|aiqfome|delivery|uber ?eats/ },
  { id: 'restaurante', nome: 'Restaurante e delivery', grupo: 'alimentacao', tipo: 'despesa', padrao: true, kw: /restaurante|lanchonete|pizza|burger|mcdonald|\bbk\b|subway|churrasc|sushi|outback|lanche|almoco|jantar|marmita/ },
  // ----- transporte e veículo
  { id: 'combustivel', nome: 'Combustível', grupo: 'transporte', tipo: 'despesa', padrao: true, pai: 'transporte', kw: /posto|combust|gasolina|etanol|\bshell\b|ipiranga|petrobras|br mania|abasteci/ },
  { id: 'estacionamento', nome: 'Estacionamento e pedágio', grupo: 'transporte', tipo: 'despesa', padrao: true, pai: 'transporte', kw: /estacion|zona azul|pedagio|sem parar|conectcar|veloe|move mais|taggy/ },
  { id: 'ipva', nome: 'IPVA e licenciamento', grupo: 'transporte', tipo: 'despesa', padrao: true, pai: 'transporte', kw: /\bipva\b|licenciamento|detran/ },
  { id: 'carro', nome: 'Manutenção do automóvel', grupo: 'transporte', tipo: 'despesa', padrao: true, pai: 'transporte', kw: /oficina|mecanic|pneu|auto ?pecas|lava ?rapido|funilaria|autocenter|troca de oleo/ },
  { id: 'app-transporte', nome: 'Deslocamento (Uber, táxi)', grupo: 'transporte', tipo: 'despesa', padrao: true, pai: 'transporte', kw: /\buber\b(?! ?eats)|\b99\b|99 ?(app|pop|taxi)|cabify|indrive|taxi/ },
  { id: 'transporte-publico', nome: 'Transporte público', grupo: 'transporte', tipo: 'despesa', pai: 'transporte', kw: /\bmetro\b|onibus|bilhete unico|sptrans|riocard|top recarga|cartao transporte|\btrem\b|\bbrt\b/ },
  { id: 'frete', nome: 'Frete e entregas', grupo: 'transporte', tipo: 'despesa', padrao: true, pai: 'transporte', kw: /frete|transportadora|loggi|jadlog|mudanca|lalamove/ },
  { id: 'transporte', nome: 'Transporte (outros)', grupo: 'transporte', tipo: 'despesa', padrao: true },
  // ----- saúde
  { id: 'farmacia', nome: 'Farmácia', grupo: 'saude', tipo: 'despesa', padrao: true, pai: 'saude', kw: /farmac|drogaria|droga ?raia|drogasil|pague menos|panvel|nissei|drogao/ },
  { id: 'plano-saude', nome: 'Plano de saúde', grupo: 'saude', tipo: 'despesa', padrao: true, pai: 'saude', kw: /unimed|amil|hapvida|sulamerica saude|bradesco saude|notredame|porto saude|plano de saude|prevent senior/ },
  { id: 'telemedicina', nome: 'Telemedicina', grupo: 'saude', tipo: 'despesa', padrao: true, pai: 'saude', kw: /telemedicina|teleconsulta|conexa|doutor online/ },
  { id: 'consultas', nome: 'Consultas e exames médicos', grupo: 'saude', tipo: 'despesa', padrao: true, pai: 'saude', kw: /clinica|consulta|medic|odonto|dentist|laborat|exame|psicolog|fisioterap|hospital|fleury|dasa|lavoisier/ },
  { id: 'nutricionista', nome: 'Nutricionista', grupo: 'saude', tipo: 'despesa', padrao: true, pai: 'saude', kw: /nutricion/ },
  { id: 'academia', nome: 'Academia e esporte', grupo: 'saude', tipo: 'despesa', padrao: true, pai: 'saude', kw: /academia|smart ?fit|bluefit|bodytech|selfit|gympass|wellhub|totalpass|crossfit|pilates|natacao/ },
  { id: 'seguro-vida', nome: 'Seguro de vida', grupo: 'saude', tipo: 'despesa', padrao: true, pai: 'saude', kw: /seguro de vida|vida e previdencia|prudential|mag seguros|icatu|metlife/ },
  { id: 'saude', nome: 'Saúde (outros)', grupo: 'saude', tipo: 'despesa', padrao: true },
  // ----- educação
  { id: 'cursos', nome: 'Cursos e treinamentos', grupo: 'educacao', tipo: 'despesa', padrao: true, pai: 'educacao', kw: /udemy|alura|curso|hotmart|coursera|duolingo|rocketseat|treinamento|digital college/ },
  { id: 'livros', nome: 'Livros', grupo: 'educacao', tipo: 'despesa', pai: 'educacao', kw: /livraria|kindle|livro|saraiva|estante virtual/ },
  { id: 'material-escritorio', nome: 'Material de escritório e escolar', grupo: 'educacao', tipo: 'despesa', padrao: true, pai: 'educacao', kw: /papelaria|kalunga|material escolar|escritorio/ },
  { id: 'educacao', nome: 'Educação (escola, faculdade)', grupo: 'educacao', tipo: 'despesa', padrao: true, kw: /escola|faculdade|universidade|mensalidade|colegio/ },
  // ----- lazer
  { id: 'viagem', nome: 'Viagens', grupo: 'lazer', tipo: 'despesa', padrao: true, pai: 'lazer', kw: /hotel|airbnb|booking|decolar|\blatam\b|\bgol\b|\bazul\b(?! seguros)|passagem|pousada|hostel|123 ?milhas|maxmilhas|cvc/ },
  { id: 'festas', nome: 'Confraternizações e festas', grupo: 'lazer', tipo: 'despesa', padrao: true, pai: 'lazer', kw: /festa|confraterniz|buffet|aniversario|decoracao de festa/ },
  { id: 'cinema-shows', nome: 'Cinema e shows', grupo: 'lazer', tipo: 'despesa', pai: 'lazer', kw: /cinema|cinemark|kinoplex|ingresso|sympla|eventim|\bshow\b|teatro/ },
  { id: 'jogos', nome: 'Jogos', grupo: 'lazer', tipo: 'despesa', pai: 'lazer', kw: /steam|playstation|\bpsn\b|xbox|nintendo|epic games|riot|garena/ },
  { id: 'bares', nome: 'Bares e saídas', grupo: 'lazer', tipo: 'despesa', pai: 'lazer', kw: /\bbar\b|boteco|cervejaria|\bpub\b|balada|adega/ },
  { id: 'lazer', nome: 'Lazer (outros)', grupo: 'lazer', tipo: 'despesa', padrao: true },
  // ----- pessoal
  { id: 'vestuario', nome: 'Roupas, calçados e uniformes', grupo: 'pessoal', tipo: 'despesa', padrao: true, pai: 'compras', kw: /renner|riachuelo|c&a|\bcea\b|zara|shein|hering|centauro|netshoes|calcad|marisa|youcom|dafiti|nike|adidas|uniforme|fardamento/ },
  { id: 'beleza', nome: 'Beleza e cuidados', grupo: 'pessoal', tipo: 'despesa', padrao: true, pai: 'compras', kw: /salao|barbearia|cabeleir|manicure|boticario|natura|sephora|avon|eudora|estetica/ },
  { id: 'pets', nome: 'Pets', grupo: 'pessoal', tipo: 'despesa', pai: 'compras', kw: /petz|cobasi|pet ?shop|veterin|racao|petlove/ },
  { id: 'eletronicos', nome: 'Eletrônicos, informática e manutenção', grupo: 'pessoal', tipo: 'despesa', padrao: true, pai: 'compras', kw: /kabum|fast ?shop|apple store|samsung|pichau|terabyte|xiaomi|assistencia tecnica|conserto de celular|informatica/ },
  { id: 'compras', nome: 'Compras (outros)', grupo: 'pessoal', tipo: 'despesa', padrao: true, kw: /amazon(?! prime)|mercado ?livre|mercadolivre|magalu|magazine|shopee|aliexpress|americanas|casas bahia|temu|loja/ },
  // ----- serviços e assinaturas
  { id: 'streaming', nome: 'Streaming', grupo: 'servicos', tipo: 'despesa', padrao: true, pai: 'assinaturas', kw: /netflix|spotify|amazon prime|prime video|disney|hbo|globoplay|youtube premium|deezer|paramount|crunchyroll|apple tv|apple music|max\.com/ },
  { id: 'apps', nome: 'Aluguel de software e apps', grupo: 'servicos', tipo: 'despesa', padrao: true, pai: 'assinaturas', kw: /apple\.com|icloud|google (one|storage|play|workspace)|microsoft|office 365|dropbox|chatgpt|openai|anthropic|claude\.ai|canva|adobe|software/ },
  { id: 'cartorio', nome: 'Cartório e correios', grupo: 'servicos', tipo: 'despesa', padrao: true, pai: 'outros', kw: /cartorio|correios|registro de imoveis|tabelionato|reconhecimento de firma/ },
  { id: 'contador', nome: 'Consultoria contábil', grupo: 'servicos', tipo: 'despesa', padrao: true, pai: 'outros', kw: /contabil|contador|contabilidade/ },
  { id: 'advogado', nome: 'Consultoria jurídica', grupo: 'servicos', tipo: 'despesa', padrao: true, pai: 'outros', kw: /advoca|juridic|advogado/ },
  { id: 'associacoes', nome: 'Associações e sindicatos', grupo: 'servicos', tipo: 'despesa', padrao: true, pai: 'outros', kw: /associacao|sindicato|contribuicao sindical|conselho regional|\bcrea\b|\boab\b|\bcrm\b|\bcrc\b/ },
  { id: 'assinaturas', nome: 'Assinaturas (outras)', grupo: 'servicos', tipo: 'despesa', padrao: true, kw: /assinatura|mensalidade app/ },
  { id: 'servicos-outros', nome: 'Outras prestações de serviços', grupo: 'servicos', tipo: 'despesa', padrao: true, pai: 'outros' },
  // ----- empregados domésticos
  { id: 'folha-domestica', nome: 'Salário de empregada / diarista', grupo: 'domesticos', tipo: 'despesa', padrao: true, pai: 'outros', kw: /diarista|empregada|\bbaba\b|cuidadora|faxina|domestica/ },
  { id: 'dae', nome: 'DAE eSocial (INSS e FGTS)', grupo: 'domesticos', tipo: 'despesa', padrao: true, pai: 'impostos', kw: /\bdae\b|esocial|e-social|fgts|inss domestic/ },
  { id: 'dom-13-ferias', nome: '13º, férias e rescisão', grupo: 'domesticos', tipo: 'despesa', padrao: true, pai: 'outros', kw: /rescisao|13o salario da|ferias da/ },
  { id: 'dom-beneficios', nome: 'Vale-transporte e benefícios', grupo: 'domesticos', tipo: 'despesa', padrao: true, pai: 'outros', kw: /vale ?transporte|vale ?alimentacao|ajuda de custo/ },
  // ----- impostos e taxas
  { id: 'darf', nome: 'DARF / Imposto de renda', grupo: 'impostos', tipo: 'despesa', padrao: true, pai: 'impostos', kw: /darf|imposto de renda|irpf|receita federal|carne-?leao/ },
  { id: 'iof', nome: 'IOF', grupo: 'impostos', tipo: 'despesa', padrao: true, pai: 'impostos', kw: /\biof\b/ },
  { id: 'parc-impostos', nome: 'Parcelamento de impostos', grupo: 'impostos', tipo: 'despesa', padrao: true, pai: 'impostos', kw: /parcelamento de (imposto|debito|tributo)|regularize|pgfn/ },
  { id: 'documentos', nome: 'Alvarás, licenças, laudos e documentos', grupo: 'impostos', tipo: 'despesa', padrao: true, pai: 'impostos', kw: /alvara|licenca|laudo|passaporte|\brg\b|segunda via|taxa de emissao/ },
  { id: 'impostos', nome: 'Tributos diversos', grupo: 'impostos', tipo: 'despesa', padrao: true, kw: /imposto|tributo|\bgps\b|inss|\bdas\b|taxa municipal/ },
  // ----- financeiro e seguros
  { id: 'tarifas', nome: 'Taxas e tarifas bancárias', grupo: 'financeiro', tipo: 'despesa', padrao: true, pai: 'outros', kw: /tarifa|anuidade|cesta de servicos|pacote de servicos|manutencao de conta/ },
  { id: 'juros', nome: 'Juros e multas', grupo: 'financeiro', tipo: 'despesa', padrao: true, pai: 'outros', kw: /juros|multa|encargo|\bmora\b|rotativo/ },
  { id: 'emprestimos', nome: 'Amortização de empréstimos e financiamentos', grupo: 'financeiro', tipo: 'despesa', padrao: true, pai: 'outros', kw: /emprestimo|financiamento|consignado|parcela credito|credito pessoal|amortiza/ },
  { id: 'seguros', nome: 'Seguros (carro, casa)', grupo: 'financeiro', tipo: 'despesa', padrao: true, pai: 'outros', kw: /seguro(?! de vida)|seguradora|porto seguro|tokio marine|allianz|mapfre|azul seguros|bradesco seguros|hdi|liberty/ },
  { id: 'doacoes', nome: 'Doações', grupo: 'financeiro', tipo: 'despesa', pai: 'outros', kw: /doacao|dizimo|oferta|vakinha/ },
  // ----- investimentos e patrimônio
  { id: 'invest-auto', nome: 'Investimento automático / aplicação', grupo: 'patrimonio', tipo: 'despesa', padrao: true, kw: /aplicacao|investimento|\bcdb\b|\brdb\b|tesouro direto|corretora|caixinha|cofrinho|poupanca|previdencia privada/ },
  { id: 'bens', nome: 'Aquisição de bens (carro, imóvel, móveis)', grupo: 'patrimonio', tipo: 'despesa', padrao: true, kw: /concessionaria|compra de veiculo|moveis planejados|entrada do apartamento|entrada do imovel/ },
  // ----- transferências (fora dos totais)
  { id: 'fatura-cartao', nome: 'Pagamento da fatura do cartão', grupo: 'transferencias', tipo: 'despesa', padrao: true, kw: /pagamento (de |da )?fatura|pgto fatura|fatura (do )?cartao/ },
  { id: 'transf-contas', nome: 'Transferência entre contas', grupo: 'transferencias', tipo: 'despesa', padrao: true, kw: /transferencia entre contas|mesma titularidade|transf(erencia)? propria/ },
  { id: 'transf-identificar', nome: 'Transferência a identificar', grupo: 'transferencias', tipo: 'despesa', padrao: true },
  // ----- outros
  { id: 'outros', nome: 'Outras despesas', grupo: 'outros', tipo: 'despesa', padrao: true },
];

/** Grupo de cada conta do plano. */
export const GRUPO_PADRAO = Object.fromEntries(CONTAS.map((c) => [c.id, c.grupo]));

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
const PAGS = [[/\b(ticket|vale|alelo|sodexo|pluxee|flash|caju|swile|cartao|beneficio)\b[a-z ]{0,12}\brefeicao\b|\bvr\b/, 'Ticket Refeição'], [/\b(ticket|vale|alelo|sodexo|pluxee|flash|caju|swile|cartao|beneficio)\b[a-z ]{0,12}\balimentacao\b|\bva\b/, 'Ticket Alimentação'], [/\b(ticket|alelo|sodexo|pluxee|caju|swile)\b/, 'Ticket'], [/\bpix\b/, 'Pix'], [/\bdebito\b/, 'Débito'], [/\b(credito|cartao)\b/, 'Crédito'], [/\b(dinheiro|especie)\b/, 'Dinheiro'], [/\bboleto\b/, 'Boleto'], [/\b(transferencia|ted|doc)\b/, 'Transferência']];
const VERBOS_RECEITA = /\b(recebi|ganhei|entrou|entrada|caiu|salario|reembolso|rendimento|vendi|devolucao|devolveram|devolvido|complemento)\b/;
const VAZIAS = /\b(gastei|paguei|comprei|recebi|ganhei|entrou|caiu|vendi|com|no|na|nos|nas|de|do|da|em|pelo|pela|para|pra|por|um|uma|o|a|e|reais|real|conto|contos|pila|r\$|hoje|ontem|anteontem|dia|via|cartao|pix|debito|credito|dinheiro|boleto|transferencia|ted|doc|especie|passado|passada|ticket|vale|alelo|sodexo|pluxee|caju|swile|vr|va|refeicao|alimentacao)\b/g;

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
  // "no ticket" sem dizer qual: refeição para comida pronta, alimentação para o resto (mercado, feira…)
  if (r.pagamento === 'Ticket') r.pagamento = /restaurante|lanche|lanchonete|almoco|jantar|ifood|pizza|burger|marmita|padaria|cafe|refeicao/.test(t) ? 'Ticket Refeição' : 'Ticket Alimentação';
  // "caiu o VR 600": é o crédito do benefício, uma entrada
  if (r.tipo === 'receita' && /^Ticket /.test(r.pagamento || '')) { r.descricao = r.pagamento; delete r.pagamento; }
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
    if (l.recorrente || !l.descricao || NEUTRAS.has(l.categoria)) continue;
    const k0 = chaveDescricao(l.descricao);
    if (!k0) continue;
    const k = l.tipo === 'receita' ? 'receita:' + k0 : k0;   // gastos mantêm a chave antiga (o que foi dispensado continua dispensado)
    (porChave.get(k) || porChave.set(k, []).get(k)).push(l);
  }
  const jaFixas = new Set(estado.recorrentes.filter((r) => !r.fim).map((r) => (r.tipo === 'receita' ? 'receita:' : '') + chaveDescricao(r.descricao)));
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
    fixas.push({ chave: k, tipo: ultimo.tipo, descricao: ultimo.descricao, valor: ultimo.valor, dia: +ultimo.data.slice(8, 10), categoria: ultimo.categoria, pagamento: ultimo.pagamento || '', meses: meses.length, temNesteMes: porMes.has(mesHoje) });
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
