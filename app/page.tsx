"use client";

import { useRef, useState } from "react";

type View = "dashboard" | "reconcile" | "income" | "expenses" | "reports" | "settings";

const labels: Record<View, [string, string]> = {
  dashboard: ["店鋪帳務總覽", "匯入 Shopee 與 TikTok Shop 報表後，系統會自動整理帳務。"],
  reconcile: ["訂單對帳", "檢查平台訂單、物流單號與入帳金額是否一致。"],
  income: ["收入明細", "集中查看店鋪收入、退款與帳單調整。"],
  expenses: ["費用管理", "管理廣告、平台、倉儲、人工與其他營運費用。"],
  reports: ["報表中心", "產生每月店鋪利潤表並匯出。"],
  settings: ["店鋪與規則", "管理店鋪、費用分攤與自動匹配規則。"],
};

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [platform, setPlatform] = useState("全部");
  const [month, setMonth] = useState("2026年8月");
  const [showImport, setShowImport] = useState(false);
  const [notice, setNotice] = useState("");
  const [rules, setRules] = useState([true, true, true, false]);
  const [expenses, setExpenses] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const go = (next: View) => { setView(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const imported = (file?: File) => {
    if (!file) return;
    setShowImport(false);
    setNotice(`已選擇「${file.name}」，等待欄位配對。`);
    window.setTimeout(() => setNotice(""), 4000);
  };
  const exportEmpty = () => {
    const blob = new Blob(["店鋪,平台,訂單,銷售額,總成本,淨利潤,利潤率\n"], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `All-Money-${month}.csv`; a.click();
    URL.revokeObjectURL(url); setNotice("空白報表已匯出。"); window.setTimeout(() => setNotice(""), 4000);
  };

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">M</span><div><b>All Money</b><small>Back My Home</small></div></div>
      <nav>
        {([["dashboard","▦","總覽"],["reconcile","⇄","訂單對帳"],["income","▤","收入明細"],["expenses","⊖","費用管理"],["reports","◫","報表中心"]] as [View,string,string][]).map(([key,icon,text]) =>
          <button key={key} className={`nav-item ${view===key?"active":""}`} onClick={()=>go(key)}><span>{icon}</span>{text}</button>
        )}
      </nav>
      <div className="sidebar-bottom">
        <button className={`nav-item ${view==="settings"?"active":""}`} onClick={()=>go("settings")}><span>⚙</span>店鋪與規則</button>
        <div className="profile"><div className="avatar">龍</div><div><b>管理員</b><small>尚未連接店鋪</small></div></div>
      </div>
    </aside>

    <section className="workspace">
      <header>
        <div><p className="eyebrow">財務工作台</p><h1>{labels[view][0]}</h1><p className="subtitle">{labels[view][1]}</p></div>
        <div className="header-actions">
          <select className="period" value={month} onChange={e=>setMonth(e.target.value)}>{["2026年8月","2026年7月","2026年6月","2026年5月","2026年4月"].map(m=><option key={m}>{m}</option>)}</select>
          <button className="primary" onClick={()=>setShowImport(true)}>＋ 匯入報表</button>
        </div>
      </header>

      {view==="dashboard" && <section className="page-stack">
        <div className="filter-row"><div className="tabs">{["全部","Shopee","TikTok Shop"].map(p=><button key={p} className={platform===p?"selected":""} onClick={()=>setPlatform(p)}>{p}</button>)}</div><span className="sync">○ 尚未匯入資料</span></div>
        <section className="kpi-grid">{[["總銷售額","尚未匯入","blue"],["訂單數","尚未匯入","violet"],["總支出","尚未匯入","amber"],["淨利潤","尚未匯入","green"]].map(([a,b,t])=><article className="metric" key={a}><div className={`metric-icon ${t}`}>—</div><div className="metric-top"><span>{a}</span></div><strong>{b}</strong><p><span>等待平台報表</span></p></article>)}</section>
        <section className="dashboard-grid">
          <article className="card"><div className="card-title"><div><h2>營收與利潤趨勢</h2><p>匯入報表後顯示</p></div></div><div className="empty-state"><b>尚無趨勢資料</b><p>請先匯入 Shopee 或 TikTok Shop 報表。</p><button onClick={()=>setShowImport(true)}>匯入第一份報表</button></div></article>
          <article className="card"><div className="card-title"><div><h2>對帳健康度</h2><p>尚未進行資料檢查</p></div><button onClick={()=>go("reconcile")}>查看</button></div><div className="empty-state compact"><b>等待資料</b><p>匯入後自動檢查未匹配訂單。</p></div></article>
        </section>
        <article className="card"><div className="card-title"><div><h2>店鋪表現</h2><p>{platform} · 尚未匯入</p></div><button onClick={()=>go("reports")}>查看完整報表 →</button></div><div className="empty-state compact"><b>尚未連接店鋪</b><p>匯入平台報表後，店鋪會顯示在這裡。</p></div></article>
      </section>}

      {view==="reconcile" && <section className="page-stack"><div className="summary-strip"><b>待處理：尚未匯入</b><span>請先加入平台訂單與帳款報表</span><button onClick={()=>setShowImport(true)}>更新報表</button></div><article className="card"><div className="card-title"><div><h2>未匹配訂單</h2><p>{month}</p></div></div><div className="empty-state"><b>目前沒有訂單資料</b><p>匯入資料後可在此標記匹配結果。</p></div></article></section>}

      {view==="income" && <section className="page-stack"><article className="card"><div className="card-title"><div><h2>收入流水</h2><p>{month}</p></div><button onClick={()=>setShowImport(true)}>匯入收入報表</button></div><div className="empty-state"><b>尚未匯入收入資料</b><p>支援平台收入、退款及帳單調整報表。</p></div></article></section>}

      {view==="expenses" && <section className="page-stack"><div className="summary-strip"><b>本月費用：尚未設定</b><span>已新增 {expenses.length} 個空白項目</span><button onClick={()=>setExpenses([...expenses,"未命名費用"])}>＋ 新增費用</button></div><article className="card"><div className="card-title"><div><h2>費用明細</h2><p>新增項目後再填入實際資料</p></div></div>{expenses.length===0?<div className="empty-state"><b>尚無費用項目</b><p>按上方按鈕開始新增。</p></div>:<div className="setting-list">{expenses.map((e,i)=><div key={i}><p><b>{e}</b><small>尚未填寫金額與日期</small></p><button className="delete-button" onClick={()=>setExpenses(expenses.filter((_,x)=>x!==i))}>刪除</button></div>)}</div>}</article></section>}

      {view==="reports" && <section className="page-stack"><div className="report-hero"><div><span>月度利潤報表</span><h2>{month}</h2><p>尚未匯入店鋪與訂單</p></div><button onClick={exportEmpty}>↓ 匯出空白 CSV</button></div><article className="card"><div className="empty-state"><b>尚無可統計資料</b><p>匯入平台報表後，損益表將自動產生。</p></div></article></section>}

      {view==="settings" && <section className="page-stack"><article className="card"><div className="card-title"><div><h2>已連接店鋪</h2><p>尚未連接任何店鋪</p></div><button onClick={()=>setShowImport(true)}>＋ 新增店鋪資料</button></div><div className="empty-state compact"><b>從報表建立店鋪</b><p>首次匯入後自動識別平台與店鋪。</p></div></article><article className="card"><div className="card-title"><div><h2>自動處理規則</h2><p>匯入報表時套用</p></div></div><div className="setting-list">{["依物流單號自動匹配訂單","退貨訂單自動扣除收入","廣告費依店鋪分攤","低效益時顯示警告"].map((name,i)=><div key={name}><p><b>{name}</b><small>可隨時開啟或關閉</small></p><label className="switch"><input type="checkbox" checked={rules[i]} onChange={()=>setRules(rules.map((v,x)=>x===i?!v:v))}/><i /></label></div>)}</div></article></section>}
    </section>

    {showImport && <div className="modal-backdrop" onMouseDown={()=>setShowImport(false)}><section className="modal" onMouseDown={e=>e.stopPropagation()}><button className="close" onClick={()=>setShowImport(false)}>×</button><div className="modal-icon">⇧</div><h2>匯入平台報表</h2><p>支援 Shopee 與 TikTok Shop 匯出的 Excel 或 CSV 報表。</p><button className="dropzone" onClick={()=>inputRef.current?.click()}><b>選擇檔案</b><span>或將檔案拖曳到這裡</span></button><input ref={inputRef} hidden type="file" accept=".xlsx,.xls,.csv" onChange={e=>imported(e.target.files?.[0])}/><small>檔案只在目前瀏覽器中處理。</small></section></div>}
    {notice && <div className="toast">✓ {notice}</div>}
  </main>;
}
