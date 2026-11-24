/* 資料層：全部由 content.js 提供，可在 admin.html 即時修改 */

const C = window.SITE_CONTENT || {};
const MODELS = Array.isArray(C.models) ? C.models : [];
const COUPONS = Array.isArray(C.coupons) ? C.coupons : [];
const FAQ = Array.isArray(C.faq) ? C.faq : [];
const ACCESSORIES = [
  { id: "battery", name: "備用電池組（含行動電源）", price: 50, desc: "演唱會錄整場必備，歸還時充飽即可" }
];

const TERMS = [
  { h: "一、租借資格", p: ["承租人須年滿 18 歲，並具備中華民國身分證或其他可證明本人身分之證件正本。未滿 18 歲者須由法定代理人共同簽署。"] },
  { h: "二、身分核對與取機", p: ["取機時請出示證件正本供現場核對與拍照留存，完成歸還並結清款項後，本公司將於 30 日內刪除證件影像。若資料不實、無法核對或現場有明顯異常，本公司得拒絕出租並取消訂單，且不負違約責任。"] },
  { h: "三、訂金與付款", p: ["訂單成立後須於 24 小時內支付訂金 NT$500，逾時系統將自動取消。尾款（租金＋押金－訂金）於取機當日現場結清。押金於歸還並確認機況無誤後，當日現場全額退還。"] },
  { h: "四、取消與改期", p: ["取機日前 15 日（含）前取消，訂金全額退還；取機日前 15 日內取消，訂金不退，可轉為一次改期使用（限原訂日期後 90 日內）。退款若使用非指定銀行帳戶，將扣除跨行手續費 NT$15。"] },
  { h: "五、租借期間之使用規範", p: ["租借期間請維持手機電量 30% 以上歸還；不得刷機、越獄、Root、拆機或安裝非官方應用程式；不得將設備轉租、轉借、抵押或攜出台灣本島。"] },
  { h: "六、損壞與遺失", p: ["設備若有刮傷、進水、螢幕破裂或功能異常，將依實際維修報價扣除押金，不足者另行求償。若無法維修或遺失，須賠償該機型台灣官方全新零售價；維修期間致無法出借，另須賠償每日租金 50% 之營業損失（上限 10 日）。"] },
  { h: "七、資料與隱私", p: ["承租人提供之姓名、電話、LINE 名稱與電子信箱，僅供訂單聯繫、租借紀錄與售後服務使用，不會提供給第三方。"] },
  { h: "八、準據法與管轄", p: ["本條款以中華民國法律為準據法。因本契約涉訟時，雙方同意以台灣台北地方法院為第一審管轄法院。"] }
];

/* ---------- 檔期狀態 ---------- */
function hashCode(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + dd;
}

/* 已成立的預約會自動扣掉庫存 */
function bookedOn(modelId, key) {
  try {
    const list = JSON.parse(localStorage.getItem("no9_orders_v1") || "[]");
    return list.filter((o) => o.modelId === modelId && o.status !== "已取消" && o.start <= key && o.end >= key).length;
  } catch (e) { return 0; }
}

function stockOf(modelId, key) {
  const model = MODELS.find((m) => m.id === modelId);
  if (!model) return 0;
  const manual = C.stock || {};
  const k = modelId + "|" + key;
  if (Object.prototype.hasOwnProperty.call(manual, k)) return Math.max(0, Number(manual[k]) || 0);
  const cap = Number(model.capacity || 0);
  return Math.max(0, cap - bookedOn(modelId, key));
}

function availability(key) {
  if (!MODELS.length) return "full";
  const stocks = MODELS.map((m) => stockOf(m.id, key));
  if (Math.max.apply(null, stocks) === 0) return "full";
  if (stocks.some((s) => s === 0)) return "few";
  return "ok";
}

function rangeAvailable(start, end, modelId) {
  const d = new Date(start);
  while (d <= end) {
    if (stockOf(modelId, dateKey(d)) < 1) return false;
    d.setDate(d.getDate() + 1);
  }
  return true;
}
