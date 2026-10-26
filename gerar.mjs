// Gera os cartões SVG do perfil. Com GH_TOKEN vai buscar números novos ao GitHub; sem ele usa o stats.json.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const USER = 'Fernandess07';
const VERDE = '#6ABF4B', ESCURO = '#1a4d2e', FUNDO = '#0d1117', TEXTO = '#c9d1d9', CINZA = '#8b949e';
// Ícones do simple-icons (24x24)
const GMAIL = 'M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z';
const LINKEDIN = 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z';
const MESES =['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const PROJETOS = [
  { id: 'logistica', repo: 'Manzana_Verde_Logistica', nome: 'Manzana Verde Logística', desc: 'ERP interno de produção, stock e encomendas', estado: 'em produção', stack: ['React', 'TypeScript', 'Node.js', 'MySQL', 'Docker'] },
  { id: 'vps', repo: 'Manzana_VPS_Admin', nome: 'Manzana VPS Admin', servidor: true, desc: 'App iOS para gerir o servidor', estado: 'iOS', stack: ['React Native', 'Expo', 'TypeScript', 'Linux'] },
];

async function buscar() {
  const repos = PROJETOS.map(p => `${p.id}: repository(owner: "${USER}", name: "${p.repo}") { defaultBranchRef { target { ... on Commit { history { totalCount } } } } }`).join('\n');
  const query = `{ user(login: "${USER}") { contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } } } }\n${repos} }`;
  const r = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${process.env.GH_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const { data, errors } = await r.json();
  if (errors) throw new Error(JSON.stringify(errors));
  const cal = data.user.contributionsCollection.contributionCalendar;
  const porMes = new Map();
  for (const w of cal.weeks) for (const d of w.contributionDays) {
    const k = d.date.slice(0, 7);
    porMes.set(k, (porMes.get(k) || 0) + d.contributionCount);
  }
  const meses = [...porMes].sort().slice(-12).map(([k, n]) => ({ mes: MESES[+k.slice(5) - 1], n }));
  const commits = Object.fromEntries(PROJETOS.map(p => [p.id, data[p.id].defaultBranchRef.target.history.totalCount]));
  return { contribuicoes: cal.totalContributions, meses, commits };
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const FONTE = `font-family="'Segoe UI', Ubuntu, 'Helvetica Neue', sans-serif"`;

function cartaoPrincipal(s) {
  const W = 840, H = 210, x0 = 430, larg = 380, base = 165, alt = 110;
  const max = Math.max(1, ...s.meses.map(m => m.n));
  const bw = larg / s.meses.length;
  const barras = s.meses.map((m, i) => {
    const h = Math.max(3, (m.n / max) * alt);
    const x = x0 + i * bw + 4;
    return `<rect class="barra" style="animation-delay:${0.4 + i * 0.07}s" x="${x}" y="${base - h}" width="${bw - 8}" height="${h}" rx="3" fill="url(#g)"/>
    <text x="${x + (bw - 8) / 2}" y="${base + 18}" text-anchor="middle" font-size="11" fill="${CINZA}">${m.mes}</text>`;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" ${FONTE}>
  <style>
    .in { opacity: 0; animation: in .7s ease-out forwards; }
    .barra { transform-box: fill-box; transform-origin: bottom; transform: scaleY(0); animation: cresce .8s cubic-bezier(.2,.8,.2,1) forwards; }
    .brilho { animation: brilho 4s linear infinite; }
    .pulso { animation: pulso 2s ease-in-out infinite; }
    @keyframes in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    @keyframes cresce { to { transform: scaleY(1); } }
    @keyframes brilho { from { transform: translateX(-${W}px); } to { transform: translateX(${W}px); } }
    @keyframes pulso { 0%, 100% { opacity: 1; } 50% { opacity: .25; } }
  </style>
  <defs>
    <linearGradient id="g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${ESCURO}"/><stop offset="1" stop-color="${VERDE}"/></linearGradient>
    <linearGradient id="linha" x1="0" x2="1"><stop offset="0" stop-color="${VERDE}" stop-opacity="0"/><stop offset=".5" stop-color="${VERDE}"/><stop offset="1" stop-color="${VERDE}" stop-opacity="0"/></linearGradient>
    <clipPath id="c"><rect width="${W}" height="${H}" rx="14"/></clipPath>
  </defs>
  <g clip-path="url(#c)">
    <rect width="${W}" height="${H}" fill="${FUNDO}"/>
    <rect class="brilho" y="0" width="${W}" height="3" fill="url(#linha)"/>
  </g>
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="${ESCURO}"/>
  <text class="in" style="animation-delay:.05s" x="34" y="62" font-size="36" font-weight="700" fill="${VERDE}">Pedro Fernandes</text>
  <g class="in" style="animation-delay:.15s">
    <circle class="pulso" cx="41" cy="86" r="4.5" fill="${VERDE}"/>
    <text x="53" y="91" font-size="15" fill="${TEXTO}">Full-stack developer · Gaia, Portugal</text>
  </g>
  <g class="in" style="animation-delay:.25s" font-size="13" fill="${CINZA}">
    <path transform="translate(36 108) scale(.6667)" fill="${VERDE}" d="${GMAIL}"/>
    <text x="60" y="121">pedrocufe05@gmail.com</text>
    <path transform="translate(220 108) scale(.6667)" fill="${VERDE}" d="${LINKEDIN}"/>
    <text x="244" y="121">pedro-fernandes</text>
  </g>
  <g class="in" style="animation-delay:.4s">
    <text x="36" y="176" font-size="28" font-weight="700" fill="${TEXTO}">${s.contribuicoes}</text>
    <text x="${36 + String(s.contribuicoes).length * 17 + 8}" y="176" font-size="13" fill="${CINZA}">contribuições no último ano</text>
  </g>
  ${barras}
</svg>`;
}

function cartaoProjeto(p, commits, i) {
  const W = 410, H = 230;
  let x = 24;
  const pills = p.stack.map((t, j) => {
    const w = t.length * 6.6 + 20;
    const g = `<g class="in" style="animation-delay:${0.5 + j * 0.1}s"><rect x="${x}" y="168" width="${w}" height="28" rx="14" fill="${ESCURO}"/><text x="${x + w / 2}" y="187" text-anchor="middle" font-size="12" fill="${VERDE}">${esc(t)}</text></g>`;
    x += w + 6;
    return g;
  }).join('\n');
  const T = 64, tx = W - 24 - T, ty = 18;
  let arte;
  if (p.servidor) {
    // Servidor desenhado: 3 unidades de rack com luzes a piscar
    arte = `<rect x="${tx}" y="${ty}" width="${T}" height="${T}" fill="${ESCURO}"/>` + [0, 1, 2].map(k => {
      const y = ty + 12 + k * 14;
      return `<rect x="${tx + 12}" y="${y}" width="${T - 24}" height="10" rx="3" fill="${FUNDO}"/>
      <circle class="led" style="animation-delay:${k * 0.4}s" cx="${tx + 19}" cy="${y + 5}" r="2" fill="${VERDE}"/>
      <rect x="${tx + 26}" y="${y + 4}" width="${T - 46}" height="2" rx="1" fill="${CINZA}" opacity=".5"/>`;
    }).join('');
  } else {
    // A imagem vai embutida em base64: o GitHub não carrega ficheiros externos dentro de um SVG
    const img = `data:image/png;base64,${readFileSync(`imagens/${p.id}.png`).toString('base64')}`;
    arte = `<rect x="${tx}" y="${ty}" width="${T}" height="${T}" fill="#fff"/>
      <image x="${tx + 7}" y="${ty + 7}" width="${T - 14}" height="${T - 14}" preserveAspectRatio="xMidYMid meet" href="${img}" xlink:href="${img}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" ${FONTE}>
  <style>
    .in { opacity: 0; animation: in .6s ease-out forwards; }
    .flutua { animation: flutua 4s ease-in-out infinite; animation-delay: ${i * 1.5}s; }
    .led { animation: pulso 1.2s steps(2) infinite; }
    @keyframes flutua { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
    .pulso { animation: pulso 2s ease-in-out infinite; }
    .borda { stroke-dasharray: 60 ${2 * (W + H)}; animation: corre 6s linear infinite; animation-delay: ${i * 3}s; }
    @keyframes in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    @keyframes pulso { 0%, 100% { opacity: 1; } 50% { opacity: .25; } }
    @keyframes corre { to { stroke-dashoffset: -${2 * (W + H)}; } }
  </style>
  <rect width="${W}" height="${H}" rx="14" fill="${FUNDO}"/>
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="${ESCURO}"/>
  <rect class="borda" x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="${VERDE}" stroke-width="2" stroke-linecap="round"/>
  <defs>
    <clipPath id="tile"><rect x="${tx}" y="${ty}" width="${T}" height="${T}" rx="18"/></clipPath>
    <filter id="sombra" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>
  </defs>
  <g class="in" style="animation-delay:.2s"><g class="flutua">
    <rect x="${tx + 6}" y="${ty + 10}" width="${T - 12}" height="${T - 12}" rx="18" fill="${VERDE}" opacity=".35" filter="url(#sombra)"/>
    <g clip-path="url(#tile)">${arte}</g>
  </g></g>
  <g class="in" style="animation-delay:.05s">
    <circle class="pulso" cx="30" cy="34" r="4.5" fill="${VERDE}"/>
    <text x="42" y="39" font-size="12" fill="${CINZA}">${esc(p.estado)} · privado</text>
  </g>
  <text class="in" style="animation-delay:.15s" x="24" y="80" font-size="22" font-weight="700" fill="${VERDE}">${esc(p.nome)}</text>
  <text class="in" style="animation-delay:.25s" x="24" y="104" font-size="13" fill="${TEXTO}">${esc(p.desc)}</text>
  <g class="in" style="animation-delay:.35s">
    <text x="24" y="146" font-size="24" font-weight="700" fill="${TEXTO}">${commits}</text>
    <text x="${24 + String(commits).length * 14 + 8}" y="146" font-size="12" fill="${CINZA}">commits</text>
  </g>
  ${pills}
</svg>`;
}

const s = process.env.GH_TOKEN ? await buscar() : JSON.parse(readFileSync('stats.json', 'utf8'));
writeFileSync('stats.json', JSON.stringify(s, null, 2) + '\n');
mkdirSync('cartoes', { recursive: true });
writeFileSync('cartoes/principal.svg', cartaoPrincipal(s));
PROJETOS.forEach((p, i) => writeFileSync(`cartoes/${p.id}.svg`, cartaoProjeto(p, s.commits[p.id], i)));
