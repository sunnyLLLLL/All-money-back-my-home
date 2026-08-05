"use client";

import { useMemo, useRef, useState } from "react";

type Platform = "全部" | "Shopee" | "TikTok Shop";
type View = "dashboard" | "reconcile" | "income" | "expenses" | "reports" | "settings";

const months = [
  { name: "3月", revenue: 128, profit: 21 },
  { name: "4月", revenue: 154, profit: 27 },
  { name: "5月", revenue: 168, profit: 31 },
  { name: "6月", revenue: 181, profit: 34 },
  { name: "7月", revenue: 206, profit: 39 },
  { name: "8月", revenue: 188, profit: 36 },
];

const shops = [
  { platform: "TikTok Shop", name: "SURNO Official", orders: 1824, sales: 284_520_000, cost: 213_390_000, profit: 71_130_000, margin: 25 },
  { platform: "Shopee", name: "SURNO Indonesia", orders: 1247, sales: 196_840_000, cost: 157_472_000, profit: 39_368_000, margin: 20 },
  { platform: "TikTok Shop", name: "VRWEO Official", orders: 706, sales: 98_310_000, cost: 77_665_000, profit: 20_645_000, margin: 21 },
];

const money = (value: number) => `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [platform, setPlatform] = useState<Platform>("全部");
  const [month, setMonth] = useState("2026年8月");
  const [notice, setNotice] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [expenseRows, setExpenseRows] = useState([
    { name: "廣告推廣費", platform: "TikTok Shop", amount: 42_680_000, date: "2026/08/05" },
    { name: "平台服務費", platform: "Shopee", amount: 29_740_000, date: "2026/08/04" },
    { name: "倉儲費用", platform: "共同費用", amount: 16_520_000, date: "2026/08/01" },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => shops.filter((s) => platform === "全部" || s.platform === platform), [platform]);
  const totals = useMemo(() => filtered.reduce((a, s) => ({ sales: a.sales + s.sales, orders: a.orders + s.orders, cost: a.cost + s.cost, profit: a.profit + s.profit }), { sales: 0, orders: 0, cost: 0, profit: 0 }), [filtered]);

  function importFile(file?: File) {
    if (!file) return;
    setNotice(`已讀取「${file.name}」，下一步將進行欄位配對。`);
    setShowImport(false);
    window.setTimeout(() => setNotice(""), 5000);
  }

  const titles: Record<View, [string, string]> = {
    dashboard: ["店鋪帳務總覽", "蝦皮與 TikTok Shop 的收入、費用和利潤，一頁看清。"],
    reconcile: ["訂單對帳", "檢查平台訂單、物流單號與入帳金額是否一致。"],
    income: ["收入明細", "集中查看所有店鋪收入、退款與帳單調整。"],
    expenses: ["費用管理", "管理廣告、平台、倉儲、人工與其他營運費用。"],
    reports: ["報表中心", "產生每月店鋪利潤表並匯出 CSV。"],
    settings: ["店鋪與規則", "管理店鋪、費用分攤與自動匹配規則。"],
  };

  function go(next: View) { setView(next); window.scrollTo({ top: 0, behavior: "smooth" }); }

  function exportReport() {
    const rows = ["店鋪,平台,訂單,銷售額,總成本,淨利潤,利潤率", ...shops.map(s => `${s.name},${s.platform},${s.orders},${s.sales},${s.cost},${s.profit},${s.margin}%`)];
    const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `All-Money-${month}.csv`; a.click(); URL.revokeObjectURL(url);
    setNotice("月度利潤報表已匯出。"); window.setTimeout(() => setNotice(""), 4000);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">M</span><div><b>All Money</b><small>Back My Home</small></div></div>
        <nav>
          <button className={`nav-item ${view === "dashboard" ? "active" : ""}`} onClick={() => go("dashboard")}><span>▦</span>總覽</button>
          <button className={`nav-item ${view === "reconcile" ? "active" : ""}`} onClick={() => go("reconcile")}><span>⇄</span>訂單對帳</button>
          <button className={`nav-item ${view === "income" ? "active" : ""}`} onClick={() => go("income")}><span>▤</span>收入明細</button>
          <button className={`nav-item ${view === "expenses" ? "active" : ""}`} onClick={() => go("expenses")}><span>⊖</span>費用管理</button>
          <button className={`nav-item ${view === "reports" ? "active" : ""}`} onClick={() => go("reports")}><span>◫</span>報表中心</button>
        </nav>
        <div className="sidebar-bottom">
          <button className={`nav-item ${view === "settings" ? "active" : ""}`} onClick={() => go("settings")}><span>⚙</span>店鋪與規則</button>
          <div className="profile"><div className="avatar">龍</div><div><b>管理員</b><small>3 間店鋪已連接</small></div><span>›</span></div>
        </div>
      </aside>

      <section className="workspace">
        <header>
          <div><p className="eyebrow">財務工作台</p><h1>{titles[view][0]}</h1><p className="subtitle">{titles[view][1]}</p></div>
          <div className="header-actions"><select className="period" value={month} onChange={(e) => setMonth(e.target.value)}><option>2026年8月</option><option>2026年7月</option><option>2026年6月</option><option>2026年5月</option><option>2026年4月</option></select><button className="primary" onClick={() => setShowImport(true)}>＋ 匯入報表</button></div>
        </header>

        {view === "dashboard" ? <>
        <div className="filter-row">
          <div className="tabs">{(["全部", "Shopee", "TikTok Shop"] as Platform[]).map((p) => <button key={p} className={platform === p ? "selected" : ""} onClick={() => setPlatform(p)}>{p === "Shopee" && <i className="dot orange" />}{p === "TikTok Shop" && <i className="dot black" />}{p}</button>)}</div>
          <span className="sync">● 最後更新：今天 21:48</span>
        </div>

        <section className="kpi-grid">
          <Metric label="總銷售額" value={money(totals.sales)} change="12.8%" tone="blue" />
          <Metric label="訂單數" value={new Intl.NumberFormat().format(totals.orders)} change="8.4%" tone="violet" />
          <Metric label="總支出" value={money(totals.cost)} change="5.2%" tone="amber" inverse />
          <Metric label="淨利潤" value={money(totals.profit)} change="18.6%" tone="green" />
        </section>

        <section className="dashboard-grid">
          <article className="card chart-card">
            <div className="card-title"><div><h2>營收與利潤趨勢</h2><p>最近 6 個月</p></div><div className="legend"><span><i className="dot blue" />營收</span><span><i className="dot green" />利潤</span></div></div>
            <div className="chart">
              <div className="y-axis"><span>2億</span><span>1.5億</span><span>1億</span><span>5千萬</span><span>0</span></div>
              <div className="bars">{months.map((m) => <div className="bar-group" key={m.name}><div className="bar-pair"><div className="bar revenue" style={{ height: `${m.revenue / 2.15}%` }} /><div className="bar profit" style={{ height: `${m.profit / 2.15}%` }} /></div><span>{m.name}</span></div>)}</div>
            </div>
          </article>

          <article className="card health-card">
            <div className="card-title"><div><h2>對帳健康度</h2><p>本月資料檢查</p></div><button onClick={() => go("reconcile")}>查看全部</button></div>
            <div className="score-wrap"><div className="score-ring"><strong>94</strong><span>/ 100</span></div><div><b>整體狀況良好</b><p>還有 3 項需要處理</p></div></div>
            <div className="issues"><div><span className="status bad">!</span><p><b>12 筆訂單未匹配</b><small>可能缺少 Tracking ID</small></p><button className="text-action" onClick={() => go("reconcile")}>處理</button></div><div><span className="status warn">!</span><p><b>2 份報表待更新</b><small>Shopee 店鋪資料截止 8/3</small></p><button className="text-action" onClick={() => setShowImport(true)}>更新</button></div><div><span className="status good">✓</span><p><b>費用規則正常</b><small>本月已套用 8 項規則</small></p></div></div>
          </article>
        </section>

        <section className="card shop-card">
          <div className="card-title"><div><h2>店鋪表現</h2><p>依淨利潤排序</p></div><button onClick={() => go("reports")}>查看完整報表 →</button></div>
          <div className="table-wrap"><table><thead><tr><th>平台與店鋪</th><th>訂單</th><th>銷售額</th><th>總成本</th><th>淨利潤</th><th>利潤率</th></tr></thead><tbody>{filtered.map((s) => <tr key={s.name}><td><span className={`platform-icon ${s.platform === "Shopee" ? "shopee" : "tiktok"}`}>{s.platform === "Shopee" ? "S" : "♪"}</span><div><b>{s.name}</b><small>{s.platform}</small></div></td><td>{s.orders.toLocaleString()}</td><td>{money(s.sales)}</td><td>{money(s.cost)}</td><td className="profit-text">{money(s.profit)}</td><td><span className="margin">{s.margin}%</span></td></tr>)}</tbody></table></div>
        </section></> : <WorkspacePage view={view} month={month} expenseRows={expenseRows} setExpenseRows={setExpenseRows} exportReport={exportReport} openImport={() => setShowImport(true)} />}
      </section>

      {showImport && <div className="modal-backdrop" onMouseDown={() => setShowImport(false)}><section className="modal" onMouseDown={(e) => e.stopPropagation()}><button className="close" onClick={() => setShowImport(false)}>×</button><div className="modal-icon">⇧</div><h2>匯入平台報表</h2><p>支援 Shopee 與 TikTok Shop 匯出的 Excel 或 CSV 報表。</p><button className="dropzone" onClick={() => inputRef.current?.click()}><b>選擇檔案</b><span>或將檔案拖曳到這裡</span></button><input ref={inputRef} hidden type="file" accept=".xlsx,.xls,.csv" onChange={(e) => importFile(e.target.files?.[0])} /><small>檔案只用於帳務分析，不會公開分享。</small></section></div>}
      {notice && <div className="toast">✓ {notice}</div>}
    </main>
  );
}

function WorkspacePage({ view, month, expenseRows, setExpenseRows, exportReport, openImport }: { view: View; month: string; expenseRows: {name:string;platform:string;amount:number;date:string}[]; setExpenseRows: React.Dispatch<React.SetStateAction<{name:string;platform:string;amount:number;date:string}[]>>; exportReport:()=>void; openImport:()=>void }) {
  const [matched, setMatched] = useState<string[]>([]);
  const [rules, setRules] = useState([true, true, true, false]);
  const orders = [
    { id: "576829104331", platform: "TikTok Shop", tracking: "SPXID082191402", amount: 159_900, state: "缺少平台款項" },
    { id: "260805K7Q3X9", platform: "Shopee", tracking: "SPXID082176625", amount: 214_900, state: "Tracking ID 未匹配" },
    { id: "576827401152", platform: "TikTok Shop", tracking: "JXID803614992", amount: 373_300, state: "手續費差異" },
  ];
  if (view === "reconcile") return <section className="page-stack"><div className="summary-strip"><b>待處理 12 筆</b><span>金額差異 {money(2_846_500)}</span><span>已匹配 3,765 筆</span><button onClick={openImport}>更新報表</button></div><article className="card"><div className="card-title"><div><h2>未匹配訂單</h2><p>{month} · 點擊右側按鈕標記完成</p></div></div><div className="table-wrap"><table><thead><tr><th>訂單編號</th><th>平台</th><th>物流單號</th><th>訂單金額</th><th>異常原因</th><th>操作</th></tr></thead><tbody>{orders.map(o => <tr key={o.id}><td><b>{o.id}</b></td><td>{o.platform}</td><td>{o.tracking}</td><td>{money(o.amount)}</td><td><span className="error-pill">{matched.includes(o.id) ? "已處理" : o.state}</span></td><td><button className="row-button" disabled={matched.includes(o.id)} onClick={() => setMatched([...matched,o.id])}>{matched.includes(o.id) ? "完成" : "標記匹配"}</button></td></tr>)}</tbody></table></div></article></section>;
  if (view === "income") return <section className="page-stack"><div className="mini-kpis"><div><span>商品收入</span><b>{money(579_670_000)}</b></div><div><span>退款／取消</span><b className="red">-{money(18_420_000)}</b></div><div><span>帳單調整</span><b>{money(3_260_000)}</b></div></div><article className="card"><div className="card-title"><div><h2>收入流水</h2><p>{month} 所有平台</p></div><button onClick={openImport}>匯入收入報表</button></div><div className="table-wrap"><table><thead><tr><th>日期</th><th>來源</th><th>店鋪</th><th>類型</th><th>金額</th></tr></thead><tbody>{[["08/05","TikTok Shop","SURNO Official","訂單收入",12840000],["08/05","Shopee","SURNO Indonesia","訂單收入",8960000],["08/04","TikTok Shop","VRWEO Official","退款",-429800],["08/04","Shopee","SURNO Indonesia","帳單調整",3260000]].map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j} className={j===4?(Number(v)<0?"red":"profit-text"):""}>{j===4?money(Number(v)):v}</td>)}</tr>)}</tbody></table></div></article></section>;
  if (view === "expenses") return <section className="page-stack"><div className="summary-strip"><b>本月總支出 {money(expenseRows.reduce((a,b)=>a+b.amount,0))}</b><span>共 {expenseRows.length} 筆費用</span><button onClick={() => setExpenseRows([{name:"新增其他費用",platform:"共同費用",amount:1_000_000,date:"2026/08/05"},...expenseRows])}>＋ 新增費用</button></div><article className="card"><div className="card-title"><div><h2>費用明細</h2><p>新增的項目會立即計入總支出</p></div></div><div className="table-wrap"><table><thead><tr><th>日期</th><th>費用項目</th><th>歸屬平台</th><th>金額</th><th>操作</th></tr></thead><tbody>{expenseRows.map((e,i)=><tr key={i}><td>{e.date}</td><td><b>{e.name}</b></td><td>{e.platform}</td><td>{money(e.amount)}</td><td><button className="delete-button" onClick={()=>setExpenseRows(expenseRows.filter((_,x)=>x!==i))}>刪除</button></td></tr>)}</tbody></table></div></article></section>;
  if (view === "reports") return <section className="page-stack"><div className="report-hero"><div><span>月度利潤報表</span><h2>{month}</h2><p>已整合 3 間店鋪、3,777 筆訂單</p></div><button onClick={exportReport}>↓ 匯出 CSV</button></div><article className="card"><div className="card-title"><div><h2>平台損益表</h2><p>實際收入減去商品、平台、廣告與營運成本</p></div></div><div className="table-wrap"><table><thead><tr><th>店鋪</th><th>銷售額</th><th>總成本</th><th>淨利潤</th><th>利潤率</th></tr></thead><tbody>{shops.map(s=><tr key={s.name}><td><b>{s.name}</b><small>{s.platform}</small></td><td>{money(s.sales)}</td><td>{money(s.cost)}</td><td className="profit-text">{money(s.profit)}</td><td><span className="margin">{s.margin}%</span></td></tr>)}</tbody></table></div></article></section>;
  return <section className="page-stack"><article className="card"><div className="card-title"><div><h2>已連接店鋪</h2><p>控制哪些店鋪納入報表</p></div><button onClick={openImport}>＋ 新增店鋪資料</button></div><div className="setting-list">{shops.map(s=><div key={s.name}><span className={`platform-icon ${s.platform === "Shopee" ? "shopee":"tiktok"}`}>{s.platform === "Shopee" ? "S":"♪"}</span><p><b>{s.name}</b><small>{s.platform} · 正常同步</small></p><label className="switch"><input type="checkbox" defaultChecked/><i /></label></div>)}</div></article><article className="card"><div className="card-title"><div><h2>自動處理規則</h2><p>匯入報表時自動套用</p></div></div><div className="setting-list rules">{["依 Tracking ID 自動匹配訂單","退貨訂單自動扣除收入","廣告費依店鋪分攤","ROI 低於 8 時顯示警告"].map((name,i)=><div key={name}><p><b>{name}</b><small>{i===0?"同時檢查訂單編號":"可隨時開啟或關閉"}</small></p><label className="switch"><input type="checkbox" checked={rules[i]} onChange={()=>setRules(rules.map((v,x)=>x===i?!v:v))}/><i /></label></div>)}</div></article></section>;
}

function Metric({ label, value, change, tone, inverse = false }: { label: string; value: string; change: string; tone: string; inverse?: boolean }) {
  return <article className="metric"><div className={`metric-icon ${tone}`}>{tone === "blue" ? "↗" : tone === "violet" ? "▥" : tone === "amber" ? "↘" : "◎"}</div><div className="metric-top"><span>{label}</span><button>•••</button></div><strong>{value}</strong><p className={inverse ? "down" : "up"}>{inverse ? "↓" : "↑"} {change} <span>較上月</span></p></article>;
}
