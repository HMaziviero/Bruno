import {jsPDF} from 'jspdf';
import {autoTable} from 'jspdf-autotable';
import {money,monthLabel,payable,total,type Month} from './model';
const clean=(s:string)=>s.replace(/[–—]/g,'-').replace(/[“”]/g,'"').replace(/[’‘]/g,"'");
export function createPdf(m:Month,employee:string){
 const rows=m.rows.filter(r=>r.employee===employee&&payable(r));if(!rows.length)throw Error('Nenhum registro para esta funcionária.');
 const doc=new jsPDF();const draft=!m.closed;doc.setFillColor(16,33,57);doc.rect(0,0,210,40,'F');doc.setTextColor(255);doc.setFontSize(10);doc.text('FECHAMENTO / PRODUÇÃO',14,13);doc.setFontSize(21);doc.text(clean(employee),14,25);doc.setFontSize(10);doc.text(clean(monthLabel(m.month)),14,33);
 doc.setTextColor(24,38,56);doc.setFontSize(10);doc.text(draft?'PRÉVIA - valores ainda não aprovados':'DEMONSTRATIVO DE COMISSÕES - mês revisado',14,50);doc.setFontSize(25);doc.text(money(total(rows)),14,65);doc.setFontSize(11);doc.text(`${rows.length} registros de produção | Referência: data final da colagem`,14,74);
 const groups=[...new Set(rows.map(r=>r.value))].sort((a,b)=>a-b);autoTable(doc,{startY:83,head:[['Valor por registro','Registros','Subtotal']],body:groups.map(v=>[money(v),String(rows.filter(r=>r.value===v).length),money(total(rows.filter(r=>r.value===v)))]),theme:'grid',headStyles:{fillColor:[20,94,235]},styles:{font:'helvetica',fontSize:10,cellPadding:3},columnStyles:{1:{halign:'right'},2:{halign:'right'}}});
 const summaryY=(doc as unknown as {lastAutoTable:{finalY:number}}).lastAutoTable.finalY+10;doc.setFontSize(9);doc.text('Os valores são por registro; dashboards unitários usam a quantidade × R$ 1,75.',14,summaryY);doc.text('Este demonstrativo não é um comprovante de pagamento.',14,summaryY+6);
 autoTable(doc,{startY:summaryY+15,head:[['Linha','Colagem / pedido','Descrição do produto','Valor']],body:rows.map(r=>[String(r.sourceRow),`${r.date?r.date.split('-').reverse().join('/'):'Sem data'}\n${clean(r.order)}`,clean(r.description)+(r.note?'\nObs.: '+clean(r.note):''),money(r.value)]),theme:'striped',headStyles:{fillColor:[16,33,57]},styles:{font:'helvetica',fontSize:9,cellPadding:3,overflow:'linebreak'},columnStyles:{0:{cellWidth:16},1:{cellWidth:32},3:{cellWidth:21,halign:'right'}},margin:{top:18,bottom:18},rowPageBreak:'avoid'});
 const count=doc.getNumberOfPages();for(let p=1;p<=count;p++){doc.setPage(p);doc.setTextColor(88,107,130);doc.setFontSize(8);doc.text(clean(`${employee} | ${monthLabel(m.month)}${draft?' | PRÉVIA':''}`),14,289);doc.text(`${p} / ${count}`,196,289,{align:'right'})}return doc;
}
export function downloadPdf(m:Month,employee:string){createPdf(m,employee).save(`${m.closed?'Demonstrativo':'Previa'}-${employee.replace(/[^a-zA-Z0-9]/g,'-')}-${m.month}.pdf`)}



