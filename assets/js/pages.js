/* 內頁：優惠券、訂單查詢、聯繫客服 */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const N = window.NO9;
  if (!N) return;
  const { NT, DB, toast, copyText, COUPONS, fmtDate, normalizePhone } = N;
  const CFG = window.SITE_CONFIG || {};

  /* ---------- coupons ---------- */
  const grid = $("#couponGrid");
  if (grid) {
    const claimed = DB.claimed();
    grid.innerHTML = COUPONS.map((c) => {
      const has = claimed.indexOf(c.code) > -1;
      return '<article class="coupon ' + (has ? "claimed" : "") + '" data-code="' + c.code + '">' +
        '<div class="top">' +
          '<div class="off">' + c.off + ' <small>OFF</small></div>' +
          '<div class="name">' + c.title + '</div>' +
          '<p class="rule-txt">' + c.desc + '<br><span class="muted">' + c.rule + '</span></p>' +
        '</div>' +
        '<div class="bot">' +
          '<span class="code">' + c.code + '</span>' +
          (has
            ? '<a class="btn btn-sm btn-line" href="index.html?coupon=' + c.code + '#booking">帶入預約</a>'
            : '<button class="btn btn-sm" type="button" data-claim="' + c.code + '">領取</button>') +
        '</div>' +
      '</article>';
    }).join("");
    $$("[data-claim]", grid).forEach((b) => {
      b.addEventListener("click", () => {
        DB.claim(b.dataset.claim);
        const card = b.closest(".coupon");
        card.classList.add("claimed");
        b.outerHTML = '<a class="btn btn-sm btn-line" href="index.html?coupon=' + b.dataset.claim + '#booking">帶入預約</a>';
        toast("已領取，結帳時輸入 " + b.dataset.claim);
      });
    });
  }

  /* ---------- order lookup ---------- */
  const lookupForm = $("#lookupForm");
  if (lookupForm) {
    const result = $("#lookupResult");
    const render = (orders) => {
      if (!orders.length) {
        result.innerHTML = '<div class="notice" style="margin-top:22px"><b>找不到訂單。</b><br>請確認訂單碼是否完整（例：NR261123-A1B2），或換成預約時填的手機號碼。訂單資料存在預約當時使用的瀏覽器，換裝置或清除瀏覽器資料後可能查不到，可直接加 LINE 由小編協助。</div>';
        return;
      }
      result.innerHTML = orders.map((o) => {
        const steps = ["待付訂金", "已確認", "已取機", "已歸還"];
        const idx = Math.max(0, steps.indexOf(o.status));
        return '<article class="order-card">' +
          '<div class="hd"><b>' + o.code + '</b><span class="badge few">' + o.status + '</span></div>' +
          '<div class="bd">' +
            '<div class="timeline">' + steps.map((s, i) => '<div class="' + (i <= idx ? "on" : "") + '">' + s + '</div>').join("") + '</div>' +
            '<div class="sum-row"><span>機型</span><b>' + o.modelName + (o.lens ? " ＋ " + o.lens : "") + '</b></div>' +
            '<div class="sum-row"><span>租期</span><b>' + o.start + " ~ " + o.end + "（" + o.days + " 天）</b></div>" +
            '<div class="sum-row"><span>取機方式</span><b>' + (o.pickup === "post" ? "郵寄到府" : "捷運中山站面交") + '</b></div>' +
            '<div class="sum-row"><span>應付總額</span><b>' + NT(o.total) + '</b></div>' +
            '<div class="sum-row"><span>已付訂金</span><b>' + NT(0) + '</b></div>' +
            '<div class="sum-row"><span>取機尾款</span><b>' + NT(o.balance) + '</b></div>' +
            '<div class="sum-row"><span>聯絡人</span><b>' + o.name + " · " + o.phone + '</b></div>' +
          '</div>' +
        '</article>';
      }).join("");
      const last = orders[0];
      result.insertAdjacentHTML("afterbegin", '<p class="small muted" style="margin-top:18px">共 ' + orders.length + ' 筆，最近一筆建立於 ' + new Date(last.created).toLocaleString("zh-TW") + '</p>');
    };

    lookupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = $("#lookupInput").value.trim();
      if (!q) { toast("請輸入訂單碼或手機號碼"); return; }
      const all = DB.orders();
      const code = q.toUpperCase().replace(/\s/g, "");
      let found = all.filter((o) => o.code === code);
      if (!found.length) {
        const p = normalizePhone(q);
        if (p.length >= 8) found = all.filter((o) => normalizePhone(o.phone) === p);
      }
      render(found);
    });
  }

  /* ---------- contact ---------- */
  const contactForm = $("#contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#cName").value.trim();
      const phone = $("#cPhone").value.trim();
      const topic = $("#cTopic").value;
      const msg = $("#cMsg").value.trim();
      if (!name || !msg) { toast("請留下稱呼與想問的問題"); return; }
      const txt = "【玖號追星日常 客服】\n稱呼：" + name + "\n電話：" + (phone || "未填") + "\n主題：" + topic + "\n內容：" + msg;
      copyText(txt, "訊息已複製，貼到 LINE 送出即可");
    });
  }
})();
