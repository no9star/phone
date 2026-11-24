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

  renderModels(); renderStock(); renderFaq(); renderCoupons();
})();
