import seed from './seed.json';
export type Row={id:string;sourceRow:number;description:string;value:number;original:number|null;employee:string;date:string;order:string;customer:string;status:string;reviewed:boolean;note:string};
export type Month={month:string;filename:string;rows:Row[];revision:number;closed:boolean;updated:string};
export const money=(v:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);
export const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
export function product(s:string){return norm(s).replace(/^(?:(?:\d+\s*-?\s*)|(?:\(\d+\)\s*-?\s*))+/,'').trim()}
export const payable=(r:Row)=>!!r.employee.trim()&&norm(r.employee)!=='sem colagem';
export const total=(rows:Row[])=>rows.reduce((s,r)=>s+Math.round(r.value*100),0)/100;
export const monthLabel=(s:string)=>new Date(s+'-15T12:00:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
export function rule(description:string){
 const s=norm(description);
 if(/dashboard unitario/.test(s)){const q=s.match(/(?:^|\s)(\d+)\s*x\s*dashboard unitario/);return q?{value:Number(q[1])*1.75,reason:`Dashboard unitário: ${q[1]} × R$ 1,75`,certain:true}:{value:1.75,reason:'Dashboard unitário sem quantidade explícita. Conferir.',certain:false}}
 if(s.includes('caixa organizadora')&&s.includes('big box')&&s.includes('eldritch horror')){const p=s.match(/parte\s*(\d+)/);return p&&[1,2,3,4].includes(+p[1])?{value:+p[1]===4?9:7,reason:`BIG BOX Eldritch Horror · parte ${p[1]}`,certain:true}:{value:7,reason:'BIG BOX Eldritch Horror sem parte identificada',certain:false}}
 if(s.includes('soft insert')||(/\bparana\b/.test(s)&&!s.includes('estrela-insert'))){return {value:8,reason:'Soft Insert / material Paraná',certain:true}}
 if(s.includes('caixa organizadora')&&s.includes('big box')&&s.includes('card games')&&!/separador|tokens|caixas de/.test(s)){return {value:9,reason:'Caixa BIG BOX para Card Games',certain:true}}
 return {value:7,reason:'Valor padrão para os demais produtos',certain:false};
}
const catalog=new Map<string,Set<number>>();
for(const r of seed){const k=product(r.description);if(!catalog.has(k))catalog.set(k,new Set());catalog.get(k)!.add(r.value)}
export function suggest(description:string){const base=rule(description),known=catalog.get(product(description));if(known&&known.size>1)return {...base,certain:false,reason:'Mesmo produto com valores diferentes na referência. Conferir.'};if(known?.size===1){const v=[...known][0];if(v!==base.value)return {value:v,certain:false,reason:`Exceção observada em agosto: ${money(v)}. Conferir antes de repetir.`};return {...base,certain:true,reason:base.certain?base.reason:'Produto já pago a R$ 7 na referência'}}return base}
export function issue(r:Row){const s=suggest(r.description);if(!payable(r))return 'Fora do pagamento · sem colagem';if(!r.date||!/^\d{4}-\d{2}-\d{2}$/.test(r.date))return 'Data de colagem ausente ou inválida';if(r.value!==s.value)return `Valor informado difere da sugestão (${money(s.value)})`;if(!s.certain)return s.reason;return ''}
export const reference:Month={month:'2026-08',filename:'Fechamento Jira - Agosto 26.xls',rows:seed as Row[],revision:0,closed:false,updated:''};
export function validateMonth(v:unknown):asserts v is Month{
 const m=v as Month;if(!m||!/^\d{4}-(0[1-9]|1[0-2])$/.test(m.month)||!Array.isArray(m.rows)||!m.rows.length||m.rows.length>15000||!Number.isInteger(m.revision)||m.revision<0||typeof m.closed!=='boolean'||typeof m.filename!=='string'||m.filename.length>250)throw Error('Fechamento inválido. Limite: 15.000 registros.');
 const ids=new Set();for(const r of m.rows){if(!r||typeof r.id!=='string'||ids.has(r.id)||typeof r.description!=='string'||!r.description.trim()||r.description.length>3000||!Number.isFinite(r.value)||r.value<0||r.value>10000||Math.abs(r.value*100-Math.round(r.value*100))>1e-6||!(r.original===null||Number.isFinite(r.original))||!['employee','date','order','customer','status','note'].every(k=>typeof r[k as keyof Row]==='string'&&String(r[k as keyof Row]).length<=3000)||typeof r.reviewed!=='boolean')throw Error('Registro inválido: confira descrição, responsável e valor.');ids.add(r.id)}
 if(m.closed&&m.rows.some(r=>payable(r)&&!r.reviewed))throw Error('Revise todos os registros antes de fechar o mês.');
}
