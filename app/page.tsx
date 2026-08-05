"use client";

import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

type View = "dashboard"|"reconcile"|"income"|"expenses"|"reports"|"settings";\ntype Account = "shopee"|"tiktok";
type Kind = "income"|"processing"|"promotion"|"adjustment"|"failed"|"returns"|"orders"|"returnTracking"|"storage"|"expenses"|"tkSettled"|"tkProcessing"|"tkOrders"|"tkCancels"|"tkReturns"|"tkReturnTracking";
type Row = Record<string, unknown>;
type ImportSet = { name:string; kind:Kind; rows:Row[]; importedAt:string };

const kinds: Record<Kind,string> = {
  income:"尾款收入 Released", processing:"蝦皮訂單處理費", promotion:"推廣費 Seller Balance Payment",
  adjustment:"帳單調整 Adjustment", failed:"交付失敗訂單", returns:"退貨 Return/Refund",
  orders:"蝦皮店鋪訂單", returnTracking:"退貨訂單狀態表", storage:"倉儲費表", expenses:"公司支出／刷單表",\n  tkSettled:"TikTok Finance Settled", tkProcessing:"TikTok 訂單處理費", tkOrders:"TikTok Manage Orders",\n  tkCancels:"TikTok 取消單", tkReturns:"TikTok 退貨單", tkReturnTracking:"TikTok Manage Returns 物流表"
};
const nav: [View,string,string][] = [["dashboard","▦","匯總"],["reconcile","⇄","訂單對帳"],["income","▤","收入明細"],["expenses","⊖","費用管理"],["reports","◫","報表中心"]];
const titles: Record<View,[string,string]> = {
  dashboard:["蝦皮帳務匯總","依照《蝦皮做帳》規則，自動計算收入、退貨及營運費用。"],
  reconcile:["訂單與退貨匹配","使用訂單號及快遞單號檢查尾款、取消與退貨資料。"],
  income:["平台報表管理","依報表類型匯入 Shopee／TikTok Excel 或 CSV。"],
  expenses:["營運費用","管理裝卸費、人員工資及其他人工補充費用。"],
  reports:["月度利潤表","檢查本期結果並匯出 CSV。"],
  settings:["計算規則","20日結算週期、匯率與記事本公式。"]
};
const aliases = {
  order:["訂單號","定單號","no.pesanan","nomor pesanan","order id","order_id","order no"],
  tracking:["快遞單號","no.resi","tracking id","tracking_id","awb","resi"],
  amount:["金額","amount","jumlah","total","nominal","收入","payment"],
  qty:["數量","qty","quantity","jumlah produk","jumlah"],
  item:["計費項目","fee item","transaction type","jenis transaksi","type"],
  store:["店鋪","shop","store","nama toko"],
  platform:["平台","platform"],
  status:["狀態","status","上架狀態","status pesanan"],
  productTotal:["商品總金額","貨值","product total","item value","total produk"],
  fee:["出庫操作費","訂單處理費","尾程費用","fee","biaya"],
  created:["創建時間","request creation date","created time","creation time","waktu dibuat"]
};
const norm=(v:unknown)=>String(v??"").trim().toLowerCase().replace(/[\s_.\-/]/g,"");
const pick=(row:Row,names:string[])=>{const keys=Object.keys(row);const key=keys.find(k=>names.some(n=>norm(k)===norm(n)));return key?row[key]:"";};
const num=(v:unknown)=>{if(typeof v==="number")return Number.isFinite(v)?v:0;const s=String(v??"").replace(/[^0-9.-]/g,"");return Number(s)||0;};
const sum=(rows:Row[],names:string[])=>rows.reduce((a,r)=>a+num(pick(r,names)),0);
const money=(v:number)=>"Rp "+new Intl.NumberFormat("id-ID",{maximumFractionDigits:0}).format(v);
const classify=(id:unknown)=>/^\d+$/.test(String(id??"").trim())?"TikTok":"Shopee";

export default function Home(){
  const [view,setView]=useState<View>("dashboard");\n  const [account,setAccount]=useState<Account>("shopee");
  const [kind,setKind]=useState<Kind>("income");
  const [sets,setSets]=useState<ImportSet[]>([]);
  const [month,setMonth]=useState("2026-08");
  const [cutoff,setCutoff]=useState(20);
  const [rate,setRate]=useState(2594);
  const [manual,setManual]=useState({handling:0,wages:0,other:0,brushOrders:0});
  const [showImport,setShowImport]=useState(false);
  const [notice,setNotice]=useState("");
  const input=useRef<HTMLInputElement>(null);
  const rows=(k:Kind)=>sets.filter(s=>s.kind===k).flatMap(s=>s.rows);

  const calc=useMemo(()=>{
    const income=rows("income"), processing=rows("processing"), failed=rows("failed"), returns=rows("returns");
    const promotion=sum(rows("promotion"),aliases.amount), adjustment=sum(rows("adjustment"),aliases.amount);
    const incomeByOrder=new Map(income.map(r=>[norm(pick(r,aliases.order)),r]));
    const failedValue=failed.reduce((a,r)=>a+num(pick(incomeByOrder.get(norm(pick(r,aliases.order)))||{},aliases.productTotal)),0);
    const returnValue=returns.reduce((a,r)=>a+num(pick(incomeByOrder.get(norm(pick(r,aliases.order)))||{},aliases.productTotal)),0);
    const sales=sum(income,aliases.amount), productCost=sum(income,aliases.productTotal), quantity=sum(income,aliases.qty);
    const processingFee=sum(processing,[...aliases.fee,...aliases.amount]);
    const storageFee=sum(rows("storage"),[...aliases.fee,...aliases.amount]);
    const brushCost=manual.brushOrders*10*rate;
    const listingFee=quantity*0.1*rate;
    const currentSales=sales-promotion;
    const remittanceFee=currentSales*0.004;
    const returnCost=failedValue+returnValue;
    const operating=manual.handling+manual.wages+manual.other+brushCost;
    const totalCost=productCost+returnCost+processingFee+storageFee+listingFee+remittanceFee+operating;
    const profit=currentSales+adjustment-totalCost;
    return {sales,promotion,currentSales,adjustment,productCost,failedValue,returnValue,returnCost,processingFee,storageFee,quantity,listingFee,remittanceFee,brushCost,operating,totalCost,profit};
  },[sets,manual,rate,account]);

  const reconcile=useMemo(()=>{
    const incomeOrders=new Set(rows("income").map(r=>norm(pick(r,aliases.order))).filter(Boolean));
    const returnTracking=new Map(rows("returnTracking").map(r=>[norm(pick(r,aliases.tracking)),pick(r,aliases.status)]));
    const targets=[...rows("failed"),...rows("returns")];
    return targets.map(r=>({order:String(pick(r,aliases.order)||"—"),tracking:String(pick(r,aliases.tracking)||"—"),platform:classify(pick(r,aliases.order)),incomeMatched:incomeOrders.has(norm(pick(r,aliases.order))),returnStatus:String(returnTracking.get(norm(pick(r,aliases.tracking)))||"未匹配")}));
  },[sets,account]);

  async function importFile(file?:File){
    if(!file)return;
    try{
      const data=await file.arrayBuffer();const book=XLSX.read(data,{type:"array",cellDates:true});
      const parsed=XLSX.utils.sheet_to_json<Row>(book.Sheets[book.SheetNames[0]],{defval:""});
      setSets(s=>[...s,{name:file.name,kind,rows:parsed,importedAt:new Date().toLocaleString("zh-TW")}]);
      setShowImport(false);setNotice(`已匯入 ${file.name}，共 ${parsed.length} 筆。`);
    }catch{setNotice("檔案解析失敗，請確認是有效的 Excel 或 CSV。");}
    window.setTimeout(()=>setNotice(""),5000);
  }
  function exportCsv(){
    const data=[["項目","金額"],["銷售收入",calc.sales],["推廣費用",calc.promotion],["當月銷售收入",calc.currentSales],["帳單調整",calc.adjustment],["商品成本",calc.productCost],["退貨成本",calc.returnCost],["訂單處理費",calc.processingFee],["上架費",calc.listingFee],["倉儲費",calc.storageFee],["回款手續費",calc.remittanceFee],["營運費用",calc.operating],["淨利潤",calc.profit]];
    const csv=XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(data));const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`Shopee-account-${month}.csv`;a.click();URL.revokeObjectURL(url);
  }
  const go=(v:View)=>{setView(v);window.scrollTo({top:0,behavior:"smooth"});};\n  const switchAccount=(a:Account)=>{setAccount(a);setKind(a==="shopee"?"income":"tkSettled");};

  return <main className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark">M</span><div><b>All Money</b><small>Back My Home</small></div></div>
      <nav>{nav.map(([v,i,t])=><button key={v} className={`nav-item ${view===v?"active":""}`} onClick={()=>go(v)}><span>{i}</span>{t}</button>)}</nav>
      <div className="sidebar-bottom"><button className={`nav-item ${view==="settings"?"active":""}`} onClick={()=>go("settings")}><span>⚙</span>計算規則</button><div className="profile"><div className="avatar">龍</div><div><b>本機帳務</b><small>資料不離開瀏覽器</small></div></div></div>
    </aside>
    <section className="workspace"><header><div><p className="eyebrow">{account==="shopee"?"SHOPEE ACCOUNTING":"TIKTOK ACCOUNTING"}</p><h1>{account==="shopee"?titles[view][0]:`TikTok ${titles[view][0]}`}</h1><p className="subtitle">{account==="shopee"?titles[view][1]:"依照《抖音做帳》規則，處理 Settled、訂單、取消與退貨資料。"}</p><div className="account-tabs"><button className={account==="shopee"?"selected":""} onClick={()=>switchAccount("shopee")}>Shopee 蝦皮</button><button className={account==="tiktok"?"selected":""} onClick={()=>switchAccount("tiktok")}>TikTok 抖音</button></div></div><div className="header-actions"><input className="period" type="month" value={month} onChange={e=>setMonth(e.target.value)}/><button className="primary" onClick={()=>setShowImport(true)}>＋ 匯入報表</button></div></header>

      {view==="dashboard"&&<section className="page-stack"><div className="rule-banner"><b>{account==="shopee"?"蝦皮結算區間":"TikTok Settled 結算區間"}</b><span>上月 {cutoff+1} 日至本月 {cutoff} 日</span><em>{sets.filter(s=>account==="shopee"?!s.kind.startsWith("tk"):s.kind.startsWith("tk")).length} 份相關報表</em></div><section className="kpi-grid">{[["當月銷售收入",calc.currentSales,"blue"],["退貨成本",calc.returnCost,"violet"],["總成本費用",calc.totalCost,"amber"],["淨利潤",calc.profit,"green"]].map(([a,b,t])=><article className="metric" key={String(a)}><div className={`metric-icon ${t}`}>◎</div><div className="metric-top"><span>{a}</span></div><strong>{money(Number(b))}</strong><p><span>{sets.length?"已依規則計算":"等待匯入報表"}</span></p></article>)}</section><section className="dashboard-grid"><Summary calc={calc}/><article className="card"><div className="card-title"><div><h2>資料完整度</h2><p>必要報表檢查</p></div></div><div className="check-list">{(account==="shopee"?(["income","processing","promotion","adjustment","failed","returns","orders"] as Kind[]):(["tkSettled","tkProcessing","tkOrders","tkCancels","tkReturns","tkReturnTracking"] as Kind[])).map(k=><div key={k}><span className={rows(k).length?"ok":"missing"}>{rows(k).length?"✓":"!"}</span><p><b>{kinds[k]}</b><small>{rows(k).length?rows(k).length+" 筆":"尚未匯入"}</small></p></div>)}</div></article></section></section>}

      {view==="income"&&<section className="page-stack"><div className="import-toolbar"><select value={kind} onChange={e=>setKind(e.target.value as Kind)}>{Object.entries(kinds).filter(([k])=>account==="shopee"?!k.startsWith("tk"):k.startsWith("tk")).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><button onClick={()=>setShowImport(true)}>選擇檔案匯入</button></div><article className="card"><div className="card-title"><div><h2>已匯入報表</h2><p>同類型可匯入多個月份或店鋪</p></div><button onClick={()=>setSets([])}>全部清除</button></div>{sets.length?<div className="setting-list">{sets.map((s,i)=><div key={i}><p><b>{s.name}</b><small>{kinds[s.kind]} · {s.rows.length} 筆 · {s.importedAt}</small></p><button className="delete-button" onClick={()=>setSets(sets.filter((_,x)=>x!==i))}>移除</button></div>)}</div>:<Empty text="尚未匯入任何平台報表"/>}</article></section>}

      {view==="reconcile"&&<section className="page-stack"><div className="summary-strip"><b>取消＋退貨：{reconcile.length} 筆</b><span>尾款匹配 {reconcile.filter(r=>r.incomeMatched).length} 筆</span><button onClick={()=>setShowImport(true)}>補充報表</button></div><article className="card"><div className="table-wrap">{reconcile.length?<table><thead><tr><th>訂單號</th><th>快遞單號</th><th>平台識別</th><th>尾款收入</th><th>退貨狀態</th></tr></thead><tbody>{reconcile.map((r,i)=><tr key={i}><td>{r.order}</td><td>{r.tracking}</td><td>{r.platform}</td><td>{r.incomeMatched?"已匹配":"未匹配"}</td><td>{r.returnStatus}</td></tr>)}</tbody></table>:<Empty text="匯入尾款、交付失敗、退貨及退貨狀態表後顯示"/>}</div></article></section>}

      {view==="expenses"&&<section className="page-stack"><article className="card"><div className="card-title"><div><h2>人工補充費用</h2><p>金額以印尼盾輸入；刷單按每單10元×匯率計算</p></div></div><div className="form-grid"><Field label="裝卸費用" value={manual.handling} set={v=>setManual({...manual,handling:v})}/><Field label="人員工資" value={manual.wages} set={v=>setManual({...manual,wages:v})}/><Field label="其他費用" value={manual.other} set={v=>setManual({...manual,other:v})}/><Field label="刷單數量" value={manual.brushOrders} set={v=>setManual({...manual,brushOrders:v})}/></div></article><Summary calc={calc}/></section>}

      {view==="reports"&&<section className="page-stack"><div className="report-hero"><div><span>蝦皮月度利潤表</span><h2>{month}</h2><p>依20日結算與記事本公式產生</p></div><button onClick={exportCsv}>↓ 匯出 CSV</button></div><Summary calc={calc}/></section>}

      {view==="settings"&&<section className="page-stack"><article className="card"><div className="card-title"><div><h2>結算與換算</h2><p>預設採用記事本規則</p></div></div><div className="form-grid"><Field label="每月結算日" value={cutoff} set={v=>setCutoff(Math.max(1,Math.min(28,v)))}/><Field label="人民幣兌印尼盾" value={rate} set={setRate}/></div></article><article className="card"><div className="card-title"><div><h2>已啟用公式</h2></div></div><div className="formula-list"><p>當月銷售收入＝銷售收入－推廣費用</p><p>回款手續費＝當月銷售收入×0.004</p><p>退貨成本＝交付失敗貨值＋退貨貨值</p><p>上架費用＝尾款收入數量×0.1×匯率</p><p>刷單費用＝刷單數量×10×匯率</p><p>全數字訂單識別為 TikTok；含英文字母識別為 Shopee</p><p>TikTok 店鋪訂單按建立月份匯入，不套用＋20日區間</p><p>TikTok 取消單保留 Cancel；退貨單保留 Return/Refund</p><p>TikTok 退貨缺少 Tracking ID 時，以 Manage Returns 手動補齊</p></div></article></section>}
    </section>

    {showImport&&<div className="modal-backdrop" onMouseDown={()=>setShowImport(false)}><section className="modal" onMouseDown={e=>e.stopPropagation()}><button className="close" onClick={()=>setShowImport(false)}>×</button><div className="modal-icon">⇧</div><h2>匯入{kinds[kind]}</h2><p>支援 .xlsx、.xls、.csv；第一個工作表會在瀏覽器內解析。</p><button className="dropzone" onClick={()=>input.current?.click()}><b>選擇檔案</b><span>目前類型：{kinds[kind]}</span></button><input ref={input} hidden type="file" accept=".xlsx,.xls,.csv" onChange={e=>importFile(e.target.files?.[0])}/><small>不會上傳到伺服器或公開儲存。</small></section></div>}
    {notice&&<div className="toast">✓ {notice}</div>}
  </main>;
}

function Field({label,value,set}:{label:string;value:number;set:(v:number)=>void}){return <label className="field"><span>{label}</span><input type="number" value={value||""} placeholder="0" onChange={e=>set(Number(e.target.value)||0)}/></label>;}
function Empty({text}:{text:string}){return <div className="empty-state"><b>尚無資料</b><p>{text}</p></div>;}
function Summary({calc}:{calc:Record<string,number>}){const lines=[["銷售收入",calc.sales],["推廣費用",-calc.promotion],["當月銷售收入",calc.currentSales],["帳單調整",calc.adjustment],["商品成本",-calc.productCost],["退貨成本",-calc.returnCost],["訂單處理費",-calc.processingFee],["上架費",-calc.listingFee],["倉儲費",-calc.storageFee],["回款手續費",-calc.remittanceFee],["營運費用",-calc.operating],["淨利潤",calc.profit]];return <article className="card"><div className="card-title"><div><h2>帳務計算明細</h2><p>依記事本公式即時計算</p></div></div><div className="summary-lines">{lines.map(([n,v],i)=><div className={i===lines.length-1?"total":""} key={String(n)}><span>{n}</span><b className={Number(v)<0?"red":""}>{money(Number(v))}</b></div>)}</div></article>;}
