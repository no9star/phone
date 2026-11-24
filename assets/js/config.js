/* 站台設定：由 content.js 統一提供，可在 admin.html 修改 */
window.SITE_CONFIG = Object.assign({}, window.SITE_CONTENT || {}, {
  brand: "玖號追星日常",
  brandEn: "NO.9",
  lineId: "@491szcgy",
  lineUrl: "https://line.me/R/ti/p/@491szcgy",
  email: "hello@no9daily.tw",
  meetPoint: "捷運中山站 一號出口",
  hours: "每日 11:00 – 22:00",
  shippingFee: 250,
  depositNow: 500,
  orderWebhook: "",
  demoMemberPhone: "0912345678"
}, window.SITE_CONFIG || {});
