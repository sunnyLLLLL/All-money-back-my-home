"use client";

import { useMemo, useRef, useState } from "react";

type Platform = "全部" | "Shopee" | "TikTok Shop";

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
  const [platform, setPlatform] = useState<Platform>("全部");
  const [notice, setNotice] = useState("");
  const [showImport, setShowImport] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => shops.filter((s) => platform === "全部" || s.platform === platform), [platform]);
  const totals = useMemo(() => filtered.reduce((a, s) => ({ sales: a.sales + s.sales, orders: a.orders + s.orders, cost: a.cost + s.cost, profit: a.profit + s.profit }), { sales: 0, orders: 0, cost: 0, profit: 0 }), [filtered]);

  function importFile(file?: File) {
    if (!file) return;
    setNotice(`已讀取「${file.name}」，下一步將進行欄位配對。`);
    setShowImport(false);
    window.setTimeout(() => setNotice(""), 5000);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">M</span><div><b>All Money</b><small>Back My Home</small></div></div>
        <nav>
          <button className="nav-item active"><span>▦</span>總覽</button>
          <button className="nav-item"><span>⇄</span>訂單對帳</button>
          <button className="nav-item"><span>▤</span>收入明細</button>
          <button className="nav-item"><span>⊖</span>費用管理</button>
          <button className="nav-item"><span>◫</span>報表中心</button>
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item"><span>⚙</span>店鋪與規則</button>
          <div className="profile"><div className="avatar">龍</div><div><b>管理員</b><small>3 間店鋪已連接</small></div><span>›</span></div>
        </div>
      </aside>

      <section className="workspace">
        <header>
          <div><p className="eyebrow">財務工作台</p><h1>店鋪帳務總覽</h1><p className="subtitle">蝦皮與 TikTok Shop 的收入、費用和利潤，一頁看清。</p></div>
          <div className="header-actions"><button className="period">2026年8月 <span>⌄</span></button><button className="primary" onClick={() => setShowImport(true)}>＋ 匯入報表</button></div>
        </header>

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
            <div className="card-title"><div><h2>對帳健康度</h2><p>本月資料檢查</p></div><button>查看全部</button></div>
            <div className="score-wrap"><div className="score-ring"><strong>94</strong><span>/ 100</span></div><div><b>整體狀況良好</b><p>還有 3 項需要處理</p></div></div>
            <div className="issues"><div><span className="status bad">!</span><p><b>12 筆訂單未匹配</b><small>可能缺少 Tracking ID</small></p><em>處理</em></div><div><span className="status warn">!</span><p><b>2 份報表待更新</b><small>Shopee 店鋪資料截止 8/3</small></p><em>更新</em></div><div><span className="status good">✓</span><p><b>費用規則正常</b><small>本月已套用 8 項規則</small></p></div></div>
          </article>
        </section>

        <section className="card shop-card">
          <div className="card-title"><div><h2>店鋪表現</h2><p>依淨利潤排序</p></div><button>查看完整報表 →</button></div>
          <div className="table-wrap"><table><thead><tr><th>平台與店鋪</th><th>訂單</th><th>銷售額</th><th>總成本</th><th>淨利潤</th><th>利潤率</th></tr></thead><tbody>{filtered.map((s) => <tr key={s.name}><td><span className={`platform-icon ${s.platform === "Shopee" ? "shopee" : "tiktok"}`}>{s.platform === "Shopee" ? "S" : "♪"}</span><div><b>{s.name}</b><small>{s.platform}</small></div></td><td>{s.orders.toLocaleString()}</td><td>{money(s.sales)}</td><td>{money(s.cost)}</td><td className="profit-text">{money(s.profit)}</td><td><span className="margin">{s.margin}%</span></td></tr>)}</tbody></table></div>
        </section>
      </section>

      {showImport && <div className="modal-backdrop" onMouseDown={() => setShowImport(false)}><section className="modal" onMouseDown={(e) => e.stopPropagation()}><button className="close" onClick={() => setShowImport(false)}>×</button><div className="modal-icon">⇧</div><h2>匯入平台報表</h2><p>支援 Shopee 與 TikTok Shop 匯出的 Excel 或 CSV 報表。</p><button className="dropzone" onClick={() => inputRef.current?.click()}><b>選擇檔案</b><span>或將檔案拖曳到這裡</span></button><input ref={inputRef} hidden type="file" accept=".xlsx,.xls,.csv" onChange={(e) => importFile(e.target.files?.[0])} /><small>檔案只用於帳務分析，不會公開分享。</small></section></div>}
      {notice && <div className="toast">✓ {notice}</div>}
    </main>
  );
}

function Metric({ label, value, change, tone, inverse = false }: { label: string; value: string; change: string; tone: string; inverse?: boolean }) {
  return <article className="metric"><div className={`metric-icon ${tone}`}>{tone === "blue" ? "↗" : tone === "violet" ? "▥" : tone === "amber" ? "↘" : "◎"}</div><div className="metric-top"><span>{label}</span><button>•••</button></div><strong>{value}</strong><p className={inverse ? "down" : "up"}>{inverse ? "↓" : "↑"} {change} <span>較上月</span></p></article>;
}
