/* =========================================================
   玖號追星日常 — 前台互動
   ========================================================= */
(function () {
  "use strict";

  const CFG = window.SITE_CONFIG || {};
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const NT = (n) => "NT$" + Number(n || 0).toLocaleString("en-US");
  const DOW = ["日", "一", "二", "三", "四", "五", "六"];
  const TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();

  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function fmtDate(d) {
    return d.getFullYear() + " 年 " + (d.getMonth() + 1) + " 月 " + d.getDate() + " 日（" + DOW[d.getDay()] + "）";
  }
  function fmtShort(d) {
    return (d.getMonth() + 1) + "/" + d.getDate() + "（" + DOW[d.getDay()] + "）";
  }
  function daysBetween(a, b) {
    return Math.round((b.setHours(0, 0, 0, 0) - a.setHours(0, 0, 0, 0)) / 86400000) + 1;
  }
  function normalizePhone(v) { return String(v || "").replace(/[^0-9]/g, ""); }
  function toast(msg) {
    let el = $(".toast");
    if (!el) { el = document.createElement("div"); el.className = "toast"; document.body.appendChild(el); }
    el.textContent = msg;
    requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), 2600);
  }
  function copyText(txt, okMsg) {
    const done = () => toast(okMsg || "已複製");
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(txt).then(done).catch(() => fallback());
    } else { fallback(); }
    function fallback() {
      const ta = document.createElement("textarea");
      ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { toast("請長按選取複製"); }
      document.body.removeChild(ta);
    }
  }

  /* ---------------- storage ---------------- */
  const DB = {
    key: "no9_orders_v1",
    mkey: "no9_members_v1",
    orders() { try { return JSON.parse(localStorage.getItem(this.key) || "[]"); } catch (e) { return []; } },
    save(order) {
      const list = this.orders();
      list.unshift(order);
      localStorage.setItem(this.key, JSON.stringify(list.slice(0, 60)));
    },
    members() { try { return JSON.parse(localStorage.getItem(this.mkey) || "[]"); } catch (e) { return []; } },
    addMember(phone) {
      if (!phone) return;
      const list = this.members();
      if (list.indexOf(phone) === -1) { list.push(phone); localStorage.setItem(this.mkey, JSON.stringify(list)); }
    },
    isMember(phone) {
      const p = normalizePhone(phone);
      if (!p) return false;
      if (CFG.demoMemberPhone && p === normalizePhone(CFG.demoMemberPhone)) return true;
      return this.members().indexOf(p) > -1;
    },
    claim(code) {
      try {
        const c = JSON.parse(localStorage.getItem("no9_coupons_v1") || "[]");
        if (c.indexOf(code) === -1) c.push(code);
        localStorage.setItem("no9_coupons_v1", JSON.stringify(c));
      } catch (e) {}
    },
    claimed() { try { return JSON.parse(localStorage.getItem("no9_coupons_v1") || "[]"); } catch (e) { return []; } }
  };

  /* ---------------- header / quick menu ---------------- */
  $$("[data-line-link]").forEach((a) => { if (CFG.lineUrl) a.href = CFG.lineUrl; });
  $$("[data-line-id]").forEach((el) => { if (CFG.lineId) el.textContent = CFG.lineId; });
  $$("[data-brand]").forEach((el) => { if (CFG.brand) el.textContent = CFG.brand; });
  $$("[data-phone]").forEach((el) => { if (CFG.phone) el.textContent = CFG.phone; });
  $$("[data-email]").forEach((el) => { if (CFG.email) el.textContent = CFG.email; });
  $$("[data-meet]").forEach((el) => { if (CFG.meetPoint) el.textContent = CFG.meetPoint; });
  $$("[data-hours]").forEach((el) => { if (CFG.hours) el.textContent = CFG.hours; });

  const qm = $(".qm");
  if (qm) {
    const btn = $(".qm-btn", qm);
    btn.addEventListener("click", () => {
      const open = qm.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", (e) => { if (!qm.contains(e.target)) qm.classList.remove("open"); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") qm.classList.remove("open"); });
  }

  const burger = $(".burger");
  if (burger) {
    burger.addEventListener("click", () => {
      const nav = $(".nav");
      if (!nav) return;
      const open = nav.classList.toggle("nav-open");
      nav.style.cssText = open
        ? "display:flex;position:absolute;top:66px;left:0;right:0;background:#F9F5EB;flex-direction:column;gap:0;padding:10px 22px 18px;border-bottom:1px solid rgba(19,38,43,.14);margin:0"
        : "";
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------------- accordions ---------------- */
  $$(".faq-item").forEach((item) => {
    const q = $(".faq-q", item);
    const a = $(".faq-a", item);
    if (!q || !a) return;
    q.addEventListener("click", () => {
      const open = item.classList.toggle("open");
      q.setAttribute("aria-expanded", open ? "true" : "false");
      a.style.maxHeight = open ? a.scrollHeight + "px" : "0px";
    });
  });

  window.NO9 = { NT, fmtDate, fmtShort, addDays, dateKey, DB, toast, copyText, MODELS, COUPONS, FAQ, normalizePhone };

  /* =========================================================
     Booking wizard
     ========================================================= */
  const wizard = $("#booking");
  if (!wizard) return;

  const state = {
    step: 1,
    start: null,
    end: null,
    awaitingEnd: false,
    month: new Date(TODAY.getFullYear(), TODAY.getMonth(), 1),
    model: null,
    lens: false,
    battery: false,
    phone: "",
    checked: false,
    name: "",
    line: "",
    email: "",
    pickup: "meet",
    terms: false,
    coupon: "",
    couponOff: 0,
    member: false
  };
  const maxDate = addDays(TODAY, 180);

  function days() {
    if (!state.start || !state.end) return 0;
    return Math.round((state.end - state.start) / 86400000) + 1;
  }
  function model() { return MODELS.find((m) => m.id === state.model) || null; }
  function calc() {
    const m = model();
    const d = days();
    if (!m || d < 2) return { rent: 0, base: 0, lens: 0, battery: 0, deposit: 0, shipping: 0, total: 0, due: 0, balance: 0, days: d };
    const base = d <= 2 ? m.price * d : m.price * 2 + m.price3 * (d - 2);
    const lens = state.lens && m.lens ? m.lens.price * d : 0;
    const battery = state.battery ? 50 * d : 0;
    const rent = base + lens + battery;
    const deposit = Math.round(m.deposit * (state.member ? 0.5 : 1));
    const shipping = state.pickup === "post" ? 100 : 0;
    const total = rent + deposit + shipping - state.couponOff;
    const due = Math.min(CFG.depositNow || 500, total);
    return { rent, base, lens, battery, deposit, shipping, total, due, balance: total - due, days: d };
  }

  /* ---------------- step nav ---------------- */
  const stepEls = $$(".step");
  function go(step, scroll) {
    state.step = step;
    $$(".panel").forEach((p) => { p.hidden = Number(p.dataset.step) !== step; });
    stepEls.forEach((el, i) => {
      const n = i + 1;
      el.classList.toggle("active", n === step);
      el.classList.toggle("done", n < step);
      el.setAttribute("aria-current", n === step ? "step" : "false");
    });
    renderTicket();
    if (scroll !== false) {
      const sec = $("#booking");
      const y = sec.getBoundingClientRect().top + window.pageYOffset - 74;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }

  $$("[data-back]").forEach((b) => b.addEventListener("click", () => go(Number(b.dataset.back))));

  /* ---------------- calendar ---------------- */
  const calGrid = $("#calGrid");
  const calLabel = $("#calLabel");
  function renderCal() {
    if (!calGrid) return;
    const y = state.month.getFullYear();
    const m = state.month.getMonth();
    calLabel.textContent = y + " 年 " + (m + 1) + " 月";
    $("#calPrev").disabled = state.month <= new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
    $("#calNext").disabled = state.month >= new Date(TODAY.getFullYear(), TODAY.getMonth() + 5, 1);

    const frag = document.createDocumentFragment();
    ["日", "一", "二", "三", "四", "五", "六"].forEach((d) => {
      const el = document.createElement("div"); el.className = "cal-dow"; el.textContent = d; frag.appendChild(el);
    });
    const first = new Date(y, m, 1).getDay();
    const total = new Date(y, m + 1, 0).getDate();
    for (let i = 0; i < first; i++) {
      const blank = document.createElement("div"); blank.setAttribute("aria-hidden", "true"); frag.appendChild(blank);
    }
    for (let d = 1; d <= total; d++) {
      const date = new Date(y, m, d);
      const key = dateKey(date);
      const st = availability(key);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "day";
      btn.dataset.date = key;
      btn.dataset.s = st;
      const isPast = date < TODAY;
      if (isPast) btn.disabled = true;
      if (date.getTime() === TODAY.getTime()) btn.classList.add("today");
      if (isPast) btn.classList.add("past");
      if (state.start && state.end) {
        if (date > state.start && date < state.end) btn.classList.add("in-range");
        if (date.getTime() === state.start.getTime()) btn.classList.add("range-start");
        if (date.getTime() === state.end.getTime()) btn.classList.add("range-end");
      } else if (state.start && date.getTime() === state.start.getTime()) {
        btn.classList.add("range-start", "range-end");
      }
      btn.innerHTML = '<span class="num">' + d + '</span><i class="dot"></i>';
      const label = { ok: "可預約", few: "剩餘少量", full: "已額滿" }[st];
      btn.setAttribute("aria-label", fmtDate(date) + "，" + label);
      btn.setAttribute("aria-pressed", state.start && date >= state.start && state.end && date <= state.end ? "true" : "false");
      btn.addEventListener("click", () => pick(date));
      frag.appendChild(btn);
    }
    calGrid.innerHTML = "";
    calGrid.appendChild(frag);
    renderCalSide();
  }

  function pick(date) {
    if (!state.start || !state.awaitingEnd) {
      state.start = date;
      state.end = addDays(date, 1);
      state.awaitingEnd = true;
    } else if (date <= state.start) {
      state.start = date;
      state.end = addDays(date, 1);
      state.awaitingEnd = true;
    } else {
      state.end = date;
      state.awaitingEnd = false;
    }
    if (state.end > maxDate) state.end = maxDate;
    if (state.end <= state.start) state.end = addDays(state.start, 1);
    renderCal();
    renderTicket();
    updateNext1();
  }

  function renderCalSide() {
    const box = $("#calSide");
    if (!box) return;
    if (!state.start || !state.end) {
      box.innerHTML = '<div class="k">YOUR DATES</div><p class="empty">點一下開始日，再點結束日。<br>最少租借兩天。</p>';
      return;
    }
    const d = days();
    box.innerHTML =
      '<div class="k">YOUR DATES</div>' +
      '<div class="row"><span>租借</span><b>' + fmtShort(state.start) + ' – ' + fmtShort(state.end) + '</b></div>' +
      '<div class="row"><span>取機</span><b>' + fmtShort(addDays(state.start, -1)) + ' 20:00 後</b></div>' +
      '<div class="row"><span>還機</span><b>' + fmtShort(addDays(state.end, 1)) + ' 20:00 前</b></div>' +
      '<div class="total"><span>共 ' + d + ' 天</span><b>' + (model() ? NT(calc().base) : "待選機型") + '</b></div>';
  }

  function updateNext1() { const b = $("#next1"); if (b) b.disabled = !(state.start && state.end && !state.awaitingEnd); }

  $("#calPrev").addEventListener("click", () => { state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1); renderCal(); });
  $("#calNext").addEventListener("click", () => { state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1); renderCal(); });
  $("#next1").addEventListener("click", () => { if (!state.start) return; go(2); renderModels(); });

  /* ---------------- models ---------------- */
  const phoneSvg = '<svg width="34" height="92" viewBox="0 0 34 92" fill="none" aria-hidden="true"><rect x="1.5" y="1.5" width="31" height="89" rx="7" stroke="#EADFC8" stroke-opacity=".75"/><rect x="5" y="7" width="24" height="72" rx="3" fill="#223A3F"/><circle cx="12" cy="21" r="3.4" fill="#C3954A" opacity=".9"/><circle cx="20" cy="21" r="3.4" fill="#C3954A" opacity=".55"/><circle cx="16" cy="31" r="3.4" fill="#EADFC8" opacity=".55"/><rect x="12" y="84" width="10" height="1.6" rx=".8" fill="#EADFC8" opacity=".6"/></svg>';

  function renderModels() {
    const wrap = $("#models");
    if (!wrap) return;
    const d = days();
    wrap.innerHTML = MODELS.map((m) => {
      const stock = Math.min.apply(null, Array.from({ length: d }, (_, i) => stockOf(m.id, dateKey(addDays(state.start, i)))).concat([99]));
      const sold = stock < 1;
      const base = d <= 2 ? m.price * d : m.price * 2 + m.price3 * (d - 2);
      const sel = state.model === m.id;
      return (
        '<article class="model ' + (sel ? "sel " : "") + (sold ? "sold" : "") + '" data-id="' + m.id + '" tabindex="0" role="button" aria-pressed="' + sel + '" aria-disabled="' + sold + '">' +
          '<div class="model-art">' + phoneSvg + '</div>' +
          '<div class="model-info">' +
            '<h4>' + m.name + ' <span class="badge ' + (sold ? "full" : stock === 1 ? "few" : "ok") + '">' + (sold ? "此檔期已滿" : "尚有 " + stock + " 台") + '</span></h4>' +
            '<div class="spec">' + m.spec + '</div>' +
            '<div class="price"><b>' + NT(m.price) + '</b> / 天 <span class="n3">· 第 3 天起 ' + NT(m.price3) + '</span></div>' +
            '<div class="dep">押金 ' + NT(m.deposit) + ' · 舊客半價 · ' + m.note + '</div>' +
          '</div>' +
          '<div class="model-side">' +
            '<div class="calc tnum">' + NT(m.price) + ' × ' + d + ' 天 = <b>' + NT(base) + '</b></div>' +
            '<div class="pick">' + (sold ? "額滿" : sel ? "✓ 已選擇" : "選擇此機型") + '</div>' +
          '</div>' +
        '</article>'
      );
    }).join("");

    $$(".model", wrap).forEach((el) => {
      const m = MODELS.find((x) => x.id === el.dataset.id);
      const sold = el.classList.contains("sold");
      const act = () => {
        if (sold) { toast("這個檔期已經滿了，換一支或改日期都可以"); return; }
        state.model = m.id;
        if (!m.lens) state.lens = false;
        renderModels(); renderAddons(); renderTicket(); updateNext2();
      };
      el.addEventListener("click", act);
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } });
    });
  }

  function renderAddons() {
    const wrap = $("#addons");
    const m = model();
    if (!wrap || !m) return;
    const d = days();
    let html = "";
    if (m.lens) {
      html += '<div class="addon ' + (state.lens ? "on" : "") + '" data-add="lens">' +
        '<div class="ic">◉</div><div class="txt"><b>' + m.lens.name + '</b><span>搭配 ' + m.name + ' 使用 · 山頂也能拍到表情</span></div>' +
        '<div class="p tnum">' + NT(m.lens.price) + ' / 天<br><span class="muted small">' + NT(m.lens.price * d) + ' / ' + d + ' 天</span></div>' +
        '<button type="button" class="tog">' + (state.lens ? "已加購" : "加購") + '</button></div>';
    }
    html += ACCESSORIES.map((a) =>
      '<div class="addon ' + (state.battery ? "on" : "") + '" data-add="battery">' +
      '<div class="ic">▮</div><div class="txt"><b>' + a.name + '</b><span>' + a.desc + '</span></div>' +
      '<div class="p tnum">' + NT(a.price) + ' / 天<br><span class="muted small">' + NT(a.price * d) + ' / ' + d + ' 天</span></div>' +
      '<button type="button" class="tog">' + (state.battery ? "已加購" : "加購") + '</button></div>'
    ).join("");
    wrap.innerHTML = html;
    $$("[data-add]", wrap).forEach((el) => {
      el.addEventListener("click", () => {
        if (el.dataset.add === "lens") state.lens = !state.lens;
        if (el.dataset.add === "battery") state.battery = !state.battery;
        renderAddons(); renderTicket();
      });
    });
  }

  function updateNext2() { const b = $("#next2"); if (b) b.disabled = !state.model; }
  $("#next2").addEventListener("click", () => { if (!state.model) return; go(3); });

  /* ---------------- identity ---------------- */
  const idInput = $("#idPhone");
  const idResult = $("#idResult");
  $("#idCheck").addEventListener("click", () => {
    const p = normalizePhone(idInput.value);
    if (p.length < 9) { idInput.classList.add("err"); toast("請填寫 9 到 10 碼的手機號碼"); return; }
    idInput.classList.remove("err");
    state.phone = p;
    state.member = DB.isMember(p);
    state.checked = true;
    idResult.classList.add("show");
    idResult.innerHTML =
      '<div class="who"><span class="badge ' + (state.member ? "ok" : "few") + '">' + (state.member ? "舊客" : "新朋友") + '</span><b>' + p.replace(/(\d{4})(\d{3})(\d{3})/, "$1-$2-$3") + '</b></div>' +
      (state.member
        ? '<p>歡迎回來。你的租借紀錄已套用 <b>押金半價</b> 與 <b>郵寄到府</b> 服務，確認頁會自動幫你算好。</p><div class="perk">押金減半，取機當日只收一半</div><div class="perk">可選擇黑貓郵寄到府（運費 NT$100）</div>'
        : '<p>第一次來沒關係，現場面交約 10 分鐘。完成一次租借並歸還後，下次就升格舊客，押金直接半價。</p><div class="perk">捷運中山站一號出口面交</div><div class="perk">完成租借後自動累積舊客資格</div>');
    $("#idLabel").textContent = "重新確認";
    $("#next3").disabled = false;
    renderTicket();
  });
  idInput.addEventListener("input", () => {
    idInput.classList.remove("err");
    const p = normalizePhone(idInput.value);
    if (state.checked && p !== state.phone) {
      state.checked = false; state.member = false;
      idResult.classList.remove("show");
      $("#idLabel").textContent = "確認";
      $("#next3").disabled = true;
      renderTicket();
    }
  });
  $("#next3").addEventListener("click", () => {
    if (!state.checked) return;
    $("#formPhone").value = state.phone.replace(/(\d{4})(\d{3})(\d{3})/, "$1-$2-$3");
    const postBtn = $('[data-pickup="post"]');
    if (postBtn) postBtn.disabled = !state.member;
    go(4);
  });

  /* ---------------- form ---------------- */
  $$("[data-pickup]").forEach((b) => {
    b.addEventListener("click", () => {
      if (b.disabled) return;
      state.pickup = b.dataset.pickup;
      $$("[data-pickup]").forEach((x) => x.classList.toggle("on", x === b));
      renderTicket();
    });
  });
  $("#next4").addEventListener("click", () => {
    const name = $("#fName").value.trim();
    const line = $("#fLine").value.trim();
    const email = $("#fEmail").value.trim();
    let bad = false;
    [["#fName", name.length >= 2], ["#fLine", line.length >= 1], ["#fEmail", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)]].forEach(([sel, ok]) => {
      $(sel).classList.toggle("err", !ok);
      if (!ok) bad = true;
    });
    if (bad) { toast("請把姓名、LINE 名稱與電子信箱填完整"); return; }
    state.name = name; state.line = line; state.email = email;
    go(5);
  });

  /* ---------------- terms ---------------- */
  $("#agree").addEventListener("change", (e) => {
    state.terms = e.target.checked;
    $("#next5").disabled = !state.terms;
  });
  $("#next5").addEventListener("click", () => { if (!state.terms) return; renderSummary(); go(6); });

  /* ---------------- summary ---------------- */
  function renderSummary() {
    const m = model(); const c = calc();
    if (!m) return;
    const rows = [
      ["取機時間", fmtDate(addDays(state.start, -1)) + " 20:00 後"],
      ["租借期間", fmtDate(state.start) + " – " + fmtDate(state.end) + "（" + c.days + " 天）"],
      ["還機時間", fmtDate(addDays(state.end, 1)) + " 20:00 前"],
      ["手機型號", m.name + (state.lens && m.lens ? " ＋ " + m.lens.name : "")],
      ["租金", NT(m.price) + " × 2 天" + (c.days > 2 ? " ＋ " + NT(m.price3) + " × " + (c.days - 2) + " 天" : "") + " = " + NT(c.base)],
      ["配件", c.lens + c.battery > 0 ? NT(c.lens + c.battery) : "無"],
      ["押金", NT(c.deposit) + (state.member ? "（舊客半價）" : "")],
      ["取機方式", state.pickup === "post" ? "黑貓郵寄到府（運費 NT$100）" : "台北捷運中山站面交"],
      ["優惠折抵", state.couponOff > 0 ? "－ " + NT(state.couponOff) + "（" + state.coupon + "）" : "未使用"]
    ];
    $("#sumList").innerHTML = rows.map((r) => '<div class="sum-row"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>').join("");
    $("#sumTotal").textContent = NT(c.total);
    $("#sumDue").textContent = NT(c.due);
    $("#sumBalance").textContent = NT(c.balance);
  }

  $("#applyCoupon").addEventListener("click", () => {
    const code = $("#couponInput").value.trim().toUpperCase();
    const c = calc();
    if (!code) { toast("請輸入優惠碼"); return; }
    let off = 0; let msg = "";
    if (code === "FIRST100") {
      if (state.member) msg = "這個優惠只限首次租借";
      else off = 100;
    } else if (code === "STAY3") {
      if (c.days < 3) msg = "STAY3 需租滿 3 天";
      else off = 200;
    } else if (code === "FREESHIP") {
      if (!state.member) msg = "FREESHIP 限有租借紀錄的舊客";
      else if (state.pickup !== "post") msg = "請先選擇郵寄到府";
      else off = 100;
    } else { msg = "找不到這個優惠碼"; }
    if (msg) { toast(msg); return; }
    state.coupon = code; state.couponOff = off;
    $("#couponMsg").textContent = "已套用 " + code + "，折抵 " + NT(off);
    $("#couponMsg").style.color = "#3F6049";
    renderSummary(); renderTicket(); toast("優惠已套用");
  });

  /* ---------------- ticket ---------------- */
  function renderTicket() {
    const box = $("#ticketBody");
    if (!box) return;
    const m = model(); const c = calc();
    if (!state.start) {
      box.innerHTML = '<div class="t-row"><span>租期</span><b>尚未選擇</b></div>' +
        '<div class="t-row"><span>機型</span><b>尚未選擇</b></div>' +
        '<div class="foot"><span>TOTAL</span><b>—</b></div>';
      return;
    }
    box.innerHTML =
      '<div class="t-row"><span>租期</span><b>' + fmtShort(state.start) + ' – ' + fmtShort(state.end) + ' · ' + c.days + ' 天</b></div>' +
      '<div class="t-row"><span>取機</span><b>' + fmtShort(addDays(state.start, -1)) + ' 20:00 後</b></div>' +
      '<div class="t-row"><span>機型</span><b>' + (m ? m.name : "尚未選擇") + '</b></div>' +
      '<div class="t-row"><span>配件</span><b>' + (state.lens || state.battery ? [state.lens && m && m.lens ? "增距鏡" : "", state.battery ? "電池組" : ""].filter(Boolean).join("、") : "無") + '</b></div>' +
      '<div class="t-row"><span>押金</span><b>' + (m ? NT(c.deposit) : "—") + '</b></div>' +
      '<div class="foot"><span>TOTAL</span><b>' + (m ? NT(c.total) : "—") + '</b></div>';
  }

  /* ---------------- submit ---------------- */
  $("#submitOrder").addEventListener("click", () => {
    const m = model(); const c = calc();
    if (!m || !state.start) return;
    const now = new Date();
    const ymd = String(now.getFullYear()).slice(2) + String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0");
    const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
    const order = {
      code: "NR" + ymd + "-" + rnd,
      created: now.toISOString(),
      phone: state.phone,
      name: state.name,
      line: state.line,
      email: state.email,
      modelId: m.id,
      modelName: m.name,
      start: dateKey(state.start),
      end: dateKey(state.end),
      days: c.days,
      lens: state.lens && m.lens ? m.lens.name : "",
      battery: state.battery,
      pickup: state.pickup,
      rent: c.rent,
      deposit: c.deposit,
      shipping: c.shipping,
      coupon: state.coupon,
      couponOff: state.couponOff,
      total: c.total,
      due: c.due,
      balance: c.balance,
      status: "待付訂金"
    };
    DB.save(order);
    DB.addMember(state.phone);
    if (CFG.orderWebhook) {
      try {
        fetch(CFG.orderWebhook, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(order) });
      } catch (e) {}
    }
    const panel = $('[data-step="6"]');
    panel.querySelector(".panel-head").style.display = "none";
    panel.querySelector(".panel-body").innerHTML =
      '<div class="success">' +
        '<div class="seal">✓</div>' +
        '<h3>預約已送出</h3>' +
        '<p class="sub">我們保留手機 24 小時。請在期限內完成訂金匯款，並把訂單碼傳到官方 LINE。</p>' +
        '<div class="code-box"><span>ORDER CODE</span><b>' + order.code + '</b></div>' +
        '<div class="success-actions">' +
          '<button class="btn btn-sm" type="button" id="copyOrder">複製訂單資訊</button>' +
          '<a class="btn btn-sm btn-line" href="' + (CFG.lineUrl || "#") + '" target="_blank" rel="noopener">加 LINE 回傳截圖</a>' +
          '<a class="btn btn-sm btn-line" href="order.html">查詢訂單</a>' +
        '</div>' +
        '<ol class="next-steps">' +
          '<li><span class="n">01</span><span>24 小時內匯款訂金 <b>' + NT(order.due) + '</b> 至指定帳戶（訂單送出後由小編提供）。</span></li>' +
          '<li><span class="n">02</span><span>把匯款截圖與訂單碼 <b>' + order.code + '</b> 傳到官方 LINE。</span></li>' +
          '<li><span class="n">03</span><span>小編確認後會與你約定取機時間；取機當日結清尾款 <b>' + NT(order.balance) + '</b>。</span></li>' +
        '</ol>' +
        '<p class="small muted" style="margin-top:18px">訂單資料保存在你這台裝置的瀏覽器，換裝置查詢請輸入訂單碼。</p>' +
      '</div>';
    panel.querySelector(".panel-foot").style.display = "none";
    $("#copyOrder").addEventListener("click", () => {
      const txt = "【玖號追星日常 預約】\n訂單碼：" + order.code + "\n機型：" + order.modelName + "\n租期：" + order.start + " ~ " + order.end + "（" + order.days + " 天）\n應付總額：NT$" + order.total + "\n訂金：NT$" + order.due + "\n姓名：" + order.name;
      copyText(txt, "訂單資訊已複製，貼到 LINE 即可");
    });
    stepEls.forEach((el) => { el.classList.add("done"); el.classList.remove("active"); });
    renderTicket();
  });

  /* ---------------- init ---------------- */
  renderCal();
  renderTicket();
  updateNext1();
  updateNext2();
  go(1, false);

  const preCoupon = new URLSearchParams(location.search).get("coupon");
  if (preCoupon) {
    const ci = $("#couponInput");
    if (ci) ci.value = preCoupon.toUpperCase();
  }

})();
