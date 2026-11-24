(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const KEY = "no9_content_v1";
  const D = JSON.parse(JSON.stringify(window.SITE_CONTENT || {}));
  if (!Array.isArray(D.models)) D.models = [];
  if (!Array.isArray(D.faq)) D.faq = [];
  if (!Array.isArray(D.coupons)) D.coupons = [];
  if (!D.stock || typeof D.stock !== "object") D.stock = {};
  const msg = (t) => { $("#msg").textContent = t; };

  /* ---------- 管理密碼 ---------- */
  const CODE = "0909";
  const lockEl = document.getElementById("lock");
  function unlock() {
    if (lockEl) lockEl.remove();
    document.body.classList.remove("locked");
  }
  if (lockEl) {
    if (sessionStorage.getItem("no9_admin_ok") === "1") {
      unlock();
    } else {
      const go = () => {
        const v = ($("#lockCode").value || "").trim();
        if (v === CODE) { sessionStorage.setItem("no9_admin_ok", "1"); unlock(); }
        else { $("#lockErr").textContent = "密碼不對，再試一次"; $("#lockCode").value = ""; }
      };
      $("#lockGo").addEventListener("click", go);
      $("#lockCode").addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
      setTimeout(() => { const el = $("#lockCode"); if (el) el.focus(); }, 300);
    }
  }

  /* tabs */
  $$("#tabs button").forEach((b) => b.addEventListener("click", () => {
    $$("#tabs button").forEach((x) => x.classList.toggle("on", x === b));
    $$("[data-panel]").forEach((p) => { p.hidden = p.dataset.panel !== b.dataset.tab; });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }));

  /* basic + texts */
  $$("[data-k]").forEach((el) => {
    const k = el.dataset.k;
    el.value = D[k] === undefined ? "" : D[k];
    el.addEventListener("input", () => { D[k] = el.type === "number" ? Number(el.value) : el.value; msg("有未儲存的修改"); });
  });

  /* ---------- models ---------- */
  const modelList = $("#modelList");
  function renderModels() {
    modelList.innerHTML = D.models.map((m, i) =>
      '<div class="row-card" data-mi="' + i + '">' +
        '<div class="row-head"><b>機型 ' + (i + 1) + '</b><button class="mini del" type="button" data-del-model="' + i + '">刪除</button></div>' +
        '<div class="m-thumb">' +
          '<img class="thumb" src="' + (m.image || "assets/img/hero-sky.jpg") + '" alt="">' +
          '<div class="f" style="flex:1;margin:0"><label>機型圖片</label><input type="file" accept="image/*" data-img="' + i + '"><span class="hint">未上傳時使用預設插圖</span></div>' +
        '</div>' +
        '<div class="grid2" style="margin-top:12px">' +
          '<div class="f"><label>名稱</label><input data-mf="name" data-i="' + i + '" value="' + esc(m.name) + '"></div>' +
          '<div class="f"><label>品牌</label><input data-mf="brand" data-i="' + i + '" value="' + esc(m.brand || "") + '"></div>' +
          '<div class="f" style="grid-column:1/-1"><label>規格描述</label><input data-mf="spec" data-i="' + i + '" value="' + esc(m.spec || "") + '"></div>' +
          '<div class="f"><label>日租金</label><input type="number" data-mf="price" data-i="' + i + '" value="' + (m.price || 0) + '"></div>' +
          '<div class="f"><label>第 3 天起日租金</label><input type="number" data-mf="price3" data-i="' + i + '" value="' + (m.price3 || 0) + '"></div>' +
          '<div class="f"><label>押金</label><input type="number" data-mf="deposit" data-i="' + i + '" value="' + (m.deposit || 0) + '"></div>' +
          '<div class="f"><label>庫存台數</label><input type="number" data-mf="capacity" data-i="' + i + '" value="' + (m.capacity || 0) + '"></div>' +
          '<div class="f" style="grid-column:1/-1"><label>適合座位／短句</label><input data-mf="note" data-i="' + i + '" value="' + esc(m.note || "") + '"></div>' +
          '<div class="f"><label>增距鏡名稱（可留空）</label><input data-mf="lensName" data-i="' + i + '" value="' + esc(m.lens ? m.lens.name : "") + '"></div>' +
          '<div class="f"><label>增距鏡日租金</label><input type="number" data-mf="lensPrice" data-i="' + i + '" value="' + (m.lens ? m.lens.price : 0) + '"></div>' +
        '</div>' +
      '</div>'
    ).join("");
    bindModels();
  }
  function esc(v) { return String(v == null ? "" : v).replace(/"/g, "&quot;").replace(/</g, "&lt;"); }
  function bindModels() {
    $$("[data-mf]").forEach((el) => el.addEventListener("input", () => {
      const m = D.models[Number(el.dataset.i)];
      const f = el.dataset.mf;
      if (f === "lensName") { m.lens = m.lens || { name: "", price: 0 }; m.lens.name = el.value; if (!el.value) m.lens = null; }
      else if (f === "lensPrice") { if (m.lens) m.lens.price = Number(el.value); }
      else if (["price", "price3", "deposit", "capacity"].includes(f)) m[f] = Number(el.value);
      else m[f] = el.value;
      msg("有未儲存的修改");
    }));
    $$("[data-del-model]").forEach((b) => b.addEventListener("click", () => {
      if (!confirm("確定刪除這個機型？")) return;
      D.models.splice(Number(b.dataset.delModel), 1); renderModels(); renderStock(); msg("已刪除，記得儲存");
    }));
    $$("[data-img]").forEach((inp) => inp.addEventListener("change", () => {
      const file = inp.files && inp.files[0]; if (!file) return;
      const idx = Number(inp.dataset.img);
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 700;
          const scale = Math.min(1, max / img.width);
          const cv = document.createElement("canvas");
          cv.width = Math.round(img.width * scale); cv.height = Math.round(img.height * scale);
          cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
          D.models[idx].image = cv.toDataURL("image/jpeg", 0.82);
          renderModels(); msg("圖片已加入，記得儲存");
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }));
  }
  $("#addModel").addEventListener("click", () => {
    const id = "m" + Date.now().toString(36);
    D.models.push({ id: id, brand: "", name: "新機型", spec: "", price: 500, price3: 400, deposit: 3000, capacity: 1, note: "", image: "", lens: null });
    renderModels(); renderStock(); msg("已新增機型，記得儲存");
  });

  /* ---------- stock ---------- */
  const sel = $("#stockModel");
  function renderStock() {
    sel.innerHTML = D.models.map((m) => '<option value="' + m.id + '">' + m.name + '</option>').join("");
    const entries = Object.keys(D.stock).sort();
    $("#stockList").innerHTML = entries.length
      ? "手動設定：<br>" + entries.map((k) => '<code>' + k + '</code> = ' + D.stock[k] + ' 台 <button class="mini del" type="button" data-del-stock="' + k + '">清除</button>').join("<br>")
      : "目前沒有手動設定，全部依「庫存 − 預約」自動計算。";
    $$("[data-del-stock]").forEach((b) => b.addEventListener("click", () => { delete D.stock[b.dataset.delStock]; renderStock(); msg("已清除，記得儲存"); }));
  }
  $("#applyStock").addEventListener("click", () => {
    const id = sel.value; const qty = Number($("#stockQty").value);
    const from = $("#stockFrom").value; const to = $("#stockTo").value || from;
    if (!id || !from) { msg("請選機型與開始日期"); return; }
    const d = new Date(from + "T00:00:00"); const end = new Date(to + "T00:00:00");
    let n = 0;
    while (d <= end && n < 120) {
      const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      D.stock[id + "|" + key] = qty;
      d.setDate(d.getDate() + 1); n++;
    }
    renderStock(); msg("已設定 " + n + " 天，記得儲存");
  });

  /* ---------- faq ---------- */
  function renderFaq() {
    $("#faqList").innerHTML = D.faq.map((f, i) =>
      '<div class="row-card" data-fi="' + i + '">' +
        '<div class="row-head"><b>問題 ' + (i + 1) + '</b><button class="mini del" type="button" data-del-faq="' + i + '">刪除</button></div>' +
        '<div class="f"><label>問題</label><input data-ff="q" data-i="' + i + '" value="' + esc(f.q) + '"></div>' +
        '<div class="f"><label>回答</label><textarea data-ff="a" data-i="' + i + '">' + esc(f.a) + '</textarea></div>' +
      '</div>'
    ).join("");
    $$("[data-ff]").forEach((el) => el.addEventListener("input", () => {
      D.faq[Number(el.dataset.i)][el.dataset.ff] = el.value; msg("有未儲存的修改");
    }));
    $$("[data-del-faq]").forEach((b) => b.addEventListener("click", () => {
      D.faq.splice(Number(b.dataset.delFaq), 1); renderFaq(); msg("已刪除，記得儲存");
    }));
  }
  $("#addFaq").addEventListener("click", () => { D.faq.push({ q: "新問題", a: "在這裡輸入回答" }); renderFaq(); msg("已新增，記得儲存"); });

  /* ---------- coupons ---------- */
  function renderCoupons() {
    $("#couponList").innerHTML = D.coupons.map((c, i) =>
      '<div class="row-card">' +
        '<div class="row-head"><b>優惠券 ' + (i + 1) + '</b><button class="mini del" type="button" data-del-coupon="' + i + '">刪除</button></div>' +
        '<div class="grid2">' +
          '<div class="f"><label>折扣碼</label><input data-cf="code" data-i="' + i + '" value="' + esc(c.code) + '"></div>' +
          '<div class="f"><label>標題</label><input data-cf="title" data-i="' + i + '" value="' + esc(c.title) + '"></div>' +
          '<div class="f"><label>折扣顯示</label><input data-cf="off" data-i="' + i + '" value="' + esc(c.off) + '"></div>' +
          '<div class="f"><label>說明</label><input data-cf="desc" data-i="' + i + '" value="' + esc(c.desc) + '"></div>' +
          '<div class="f" style="grid-column:1/-1"><label>使用規則</label><input data-cf="rule" data-i="' + i + '" value="' + esc(c.rule) + '"></div>' +
        '</div>' +
      '</div>'
    ).join("");
    $$("[data-cf]").forEach((el) => el.addEventListener("input", () => {
      D.coupons[Number(el.dataset.i)][el.dataset.cf] = el.value; msg("有未儲存的修改");
    }));
    $$("[data-del-coupon]").forEach((b) => b.addEventListener("click", () => {
      D.coupons.splice(Number(b.dataset.delCoupon), 1); renderCoupons(); msg("已刪除，記得儲存");
    }));
  }
  $("#addCoupon").addEventListener("click", () => {
    D.coupons.push({ code: "NEWCODE", title: "新優惠", off: "NT$100", desc: "", rule: "" });
    renderCoupons(); msg("已新增，記得儲存");
  });

  /* ---------- 演唱會視角 ---------- */
  function renderViewsEdit() {
    const box = $("#viewList");
    if (!Array.isArray(D.views)) D.views = [];
    if (!D.views.length) { box.innerHTML = '<p class="sub">還沒有任何視角，按下面新增。</p>'; return; }
    box.innerHTML = D.views.map((v, i) =>
      '<div class="row-card">' +
        '<div class="row-head"><b>視角 ' + (i + 1) + '</b><button class="mini del" type="button" data-del-view="' + i + '">刪除</button></div>' +
        '<div class="grid2">' +
          '<div class="f"><label>場館</label><input data-vf="venue" data-i="' + i + '" value="' + esc(v.venue) + '"></div>' +
          '<div class="f"><label>座位區</label><input data-vf="seat" data-i="' + i + '" value="' + esc(v.seat) + '"></div>' +
          '<div class="f" style="grid-column:1/-1"><label>標題</label><input data-vf="title" data-i="' + i + '" value="' + esc(v.title) + '"></div>' +
          '<div class="f" style="grid-column:1/-1"><label>說明</label><textarea data-vf="desc" data-i="' + i + '">' + esc(v.desc) + '</textarea></div>' +
          '<div class="f"><label>使用的機型</label><input data-vf="model" data-i="' + i + '" value="' + esc(v.model) + '"></div>' +
          '<div class="f"><label>YouTube 網址</label><input data-vf="video" data-i="' + i + '" placeholder="https://www.youtube.com/watch?v=..." value="' + esc(v.video) + '"></div>' +
          '<div class="f" style="grid-column:1/-1"><label>自訂縮圖網址（可留空，會自動抓 YouTube 縮圖）</label><input data-vf="poster" data-i="' + i + '" value="' + esc(v.poster) + '"></div>' +
        '</div>' +
      '</div>'
    ).join("");
    $$("[data-vf]").forEach((el) => el.addEventListener("input", () => {
      D.views[Number(el.dataset.i)][el.dataset.vf] = el.value; msg("有未儲存的修改");
    }));
    $$("[data-del-view]").forEach((b) => b.addEventListener("click", () => {
      if (!confirm("刪除這個視角？")) return;
      D.views.splice(Number(b.dataset.delView), 1); renderViewsEdit(); msg("已刪除，記得儲存");
    }));
  }
  $("#addView").addEventListener("click", () => {
    D.views = D.views || [];
    D.views.push({ id: "v" + Date.now().toString(36), venue: "", seat: "", model: "", title: "新的視角", desc: "", video: "", poster: "" });
    renderViewsEdit(); msg("已新增，記得儲存");
  });

  /* ---------- 顧客與成本 ---------- */
  function money(n) { return "NT$" + Math.round(n).toLocaleString("en-US"); }
  function readOrders() {
    try { return JSON.parse(localStorage.getItem("no9_orders_v1") || "[]"); } catch (e) { return []; }
  }
  function crmStats() {
    if (!D.costs) D.costs = { monthly: 0, startDate: "", models: {} };
    const c = D.costs; c.models = c.models || {};
    const orders = readOrders().filter((o) => o.status !== "已取消");
    const revenue = orders.reduce((s, o) => s + Math.max(0, (Number(o.total) || 0) - (Number(o.deposit) || 0)), 0);
    const invest = (D.models || []).reduce((s, m) => s + (Number(c.models[m.id]) || 0), 0);
    const start = c.startDate ? new Date(c.startDate + "T00:00:00") : null;
    const now = new Date();
    const months = start ? Math.max(1, Math.ceil((now - start) / (1000 * 60 * 60 * 24 * 30.4))) : 1;
    const runCost = (Number(c.monthly) || 0) * months;
    const totalCost = invest + runCost;
    const remain = Math.max(0, totalCost - revenue);
    const pct = totalCost > 0 ? Math.min(100, Math.round((revenue / totalCost) * 100)) : 0;
    const d30 = new Date(now.getTime() - 30 * 864e5);
    const rev30 = orders.filter((o) => o.created && new Date(o.created) >= d30)
      .reduce((s, o) => s + Math.max(0, (Number(o.total) || 0) - (Number(o.deposit) || 0)), 0);
    const perDay = rev30 > 0 ? rev30 / 30 : (orders.length ? revenue / Math.max(30, months * 30.4) : 0);
    const daysLeft = perDay > 0 ? Math.ceil(remain / perDay) : null;
    const eta = daysLeft != null ? new Date(now.getTime() + daysLeft * 864e5) : null;
    return { orders, revenue, invest, runCost, totalCost, remain, pct, rev30, perDay, daysLeft, eta, months };
  }
  function renderCrm() {
    const st = crmStats();
    const c = D.costs;
    const etaTxt = st.eta ? (st.eta.getFullYear() + "/" + String(st.eta.getMonth() + 1).padStart(2, "0") + "/" + String(st.eta.getDate()).padStart(2, "0")) : "—";
    $("#crmDash").innerHTML =
      '<div class="kpis">' +
        '<div class="kpi"><div class="k">累計營收</div><b>' + money(st.revenue) + '</b></div>' +
        '<div class="kpi"><div class="k">累計成本</div><b>' + money(st.totalCost) + '</b></div>' +
        '<div class="kpi"><div class="k">回本進度</div><b>' + st.pct + '%</b></div>' +
        '<div class="kpi"><div class="k">尚差</div><b>' + money(st.remain) + '</b></div>' +
      '</div>' +
      '<div class="pbar"><i style="width:' + st.pct + '%"></i></div>' +
      '<p class="hint" style="font-size:12px;color:#5A5E80">' +
        (st.remain <= 0
          ? '已經回本，之後的租金都是淨收入。'
          : (st.daysLeft != null
              ? (st.daysLeft > 3650
                  ? '近 30 天營收 ' + money(st.rev30) + '，平均每天 ' + money(st.perDay) + '。以目前速度要超過 10 年才回本，建議先確認購機成本與每月固定成本是否填對，或增加曝光與場次。'
                  : '近 30 天營收 ' + money(st.rev30) + '，平均每天 ' + money(st.perDay) + '。照這個速度，還要約 <b>' + st.daysLeft + ' 天</b>（約 ' + (st.daysLeft / 30).toFixed(1) + ' 個月），預估 <b>' + etaTxt + '</b> 回本。')
              : '目前還沒有足夠的營收紀錄可以估算，先完成一兩筆預約，或到下面填入成本。')) +
      '</p>' +
      '<p class="hint" style="font-size:11.5px;color:#878BA8">計算方式：累計營收 = 訂單總額 − 押金（押金不算收入）；累計成本 = 各機型購機成本 ＋ 每月固定成本 × 經營月數（' + st.months + ' 個月）。</p>';
    $("#crmCost").innerHTML =
      '<div class="grid2" style="margin-top:14px">' +
        '<div class="f"><label>每月固定成本（保險、耗材、運費補貼…）</label><input type="number" id="crmMonthly" value="' + (Number(c.monthly) || 0) + '"></div>' +
        '<div class="f"><label>開始營運日</label><input type="date" id="crmStart" value="' + esc(c.startDate || "") + '"></div>' +
      '</div>' +
      '<div class="grid2">' +
        (D.models || []).map((m) => '<div class="f"><label>' + esc(m.name) + ' 購機成本</label><input type="number" data-cost-model="' + m.id + '" value="' + (Number(c.models[m.id]) || 0) + '"></div>').join("") +
      '</div>' +
      '<p class="hint" style="font-size:11.5px;color:#5A5E80">目前投入：購機 ' + money(st.invest) + ' ＋ 營運 ' + money(st.runCost) + ' ＝ ' + money(st.totalCost) + '</p>';
    $("#crmMonthly").addEventListener("change", (e) => { D.costs.monthly = Number(e.target.value) || 0; renderCrm(); msg("有未儲存的修改"); });
    $("#crmStart").addEventListener("change", (e) => { D.costs.startDate = e.target.value; renderCrm(); msg("有未儲存的修改"); });
    $$("[data-cost-model]").forEach((el) => el.addEventListener("change", () => {
      D.costs.models[el.dataset.costModel] = Number(el.value) || 0; renderCrm(); msg("有未儲存的修改");
    }));
    renderCrmList();
  }
  function renderCrmList() {
    if (!D.customers) D.customers = {};
    const q = ($("#crmSearch").value || "").trim().toLowerCase();
    const map = {};
    readOrders().forEach((o) => {
      if (o.status === "已取消") return;
      const p = o.phone || "未填電話";
      const row = map[p] || (map[p] = { phone: p, name: o.name || "", line: o.line || "", email: o.email || "", count: 0, rev: 0, last: "" });
      row.count += 1;
      row.rev += Math.max(0, (Number(o.total) || 0) - (Number(o.deposit) || 0));
      if ((o.start || "") > row.last) row.last = o.start || "";
      row.name = row.name || o.name || "";
    });
    let rows = Object.values(map).sort((a, b) => b.rev - a.rev);
    if (q) rows = rows.filter((r) => (r.name + r.phone + r.line).toLowerCase().indexOf(q) > -1);
    if (!rows.length) {
      $("#crmList").innerHTML = '<p class="sub" style="margin-top:10px">這台裝置還沒有預約紀錄。客人在這台電腦／手機完成預約後就會出現在這裡。</p>';
      return;
    }
    $("#crmList").innerHTML =
      '<table class="crm"><thead><tr><th>顧客</th><th>聯絡</th><th>預約 / 營收</th><th>最近租期</th><th style="width:38%">備註</th></tr></thead><tbody>' +
      rows.map((r) =>
        '<tr><td><b>' + esc(r.name || "—") + '</b><div style="font-size:11px;color:#7A80A0">' + esc(r.phone) + '</div></td>' +
        '<td style="font-size:11px;color:#5A5E80">' + (r.line ? "LINE " + esc(r.line) + "<br>" : "") + esc(r.email || "") + '</td>' +
        '<td>' + r.count + ' 筆<div style="font-size:11px;color:#5A5E80">' + money(r.rev) + '</div></td>' +
        '<td style="font-size:11px">' + esc(r.last || "—") + '</td>' +
        '<td><textarea class="crm-note" data-note="' + esc(r.phone) + '" placeholder="例如：易碎體質、要提醒帶證件、喜歡哪一支">' + esc((D.customers[r.phone] && D.customers[r.phone].note) || "") + '</textarea></td></tr>'
      ).join("") + '</tbody></table>';
    $$("[data-note]").forEach((el) => el.addEventListener("input", () => {
      const key = el.dataset.note;
      D.customers[key] = D.customers[key] || {};
      D.customers[key].note = el.value;
      msg("備註未儲存");
    }));
  }
  $("#crmSearch").addEventListener("input", renderCrmList);

  /* ---------- save / download / reset ---------- */
  $("#saveBtn").addEventListener("click", () => {
    localStorage.setItem(KEY, JSON.stringify(D));
    msg("已儲存，正在重新載入…");
    setTimeout(() => location.reload(), 500);
  });
  $("#downloadBtn").addEventListener("click", () => {
    const body = "window.SITE_CONTENT = " + JSON.stringify(D, null, 2) + ";\n\n(function(){try{var s=JSON.parse(localStorage.getItem('no9_content_v1')||'null');if(s)window.SITE_CONTENT=Object.assign({},window.SITE_CONTENT,s);}catch(e){}})();\n";
    const blob = new Blob([body], { type: "text/javascript;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "content.js";
    document.body.appendChild(a); a.click(); a.remove();
    msg("已下載 content.js，請上傳覆蓋 GitHub 的同名檔案");
  });
  $("#resetBtn").addEventListener("click", () => {
    if (!confirm("還原成預設內容？你手動改的文字與圖片會消失。")) return;
    localStorage.removeItem(KEY); location.reload();
  });

  renderModels(); renderStock(); renderFaq(); renderCoupons(); renderViewsEdit(); renderCrm();
})();
