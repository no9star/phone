/* 資料層：機型、配件、優惠券、條款、常見問題、檔期狀態 */

const MODELS = [
  {
    id: "s25u",
    brand: "SAMSUNG",
    name: "Galaxy S25 Ultra",
    spec: "6.9 吋 · 200MP 主鏡 · 5 倍光學",
    price: 550,
    price3: 400,
    deposit: 3000,
    capacity: 2,
    lens: null,
    note: "內場與前排首選，成片最穩"
  },
  {
    id: "x300p",
    brand: "VIVO",
    name: "vivo X300 Pro",
    spec: "6.78 吋 · 200MP 蔡司 · 85mm 潛望",
    price: 780,
    price3: 600,
    deposit: 3500,
    capacity: 1,
    lens: { name: "蔡司 400mm 增距鏡", price: 180 },
    note: "三樓看台、山頂座位專用"
  },
  {
    id: "x9p",
    brand: "OPPO",
    name: "Find X9 Pro",
    spec: "6.78 吋 · 哈蘇色彩 · 200MP 潛望",
    price: 820,
    price3: 650,
    deposit: 4000,
    capacity: 1,
    lens: { name: "哈蘇 300mm 增距鏡", price: 180 },
    note: "舞台燈光下的發色最討喜"
  }
];

const ACCESSORIES = [
  { id: "battery", name: "備用電池組（含行動電源）", price: 50, desc: "演唱會錄整場必備，歸還時充飽即可" }
];

const COUPONS = [
  {
    code: "FIRST100",
    title: "首次租借折 NT$100",
    off: "NT$100",
    desc: "第一次來玖號追星日常？租金現折 100 元，不用搶名額。",
    rule: "限首次租借使用 · 每筆訂單折抵一次 · 不得與其他折扣併用"
  },
  {
    code: "STAY3",
    title: "連租三天再折 NT$200",
    off: "NT$200",
    desc: "連假場次、外縣市巡迴都適用，租期滿三天即折。",
    rule: "租期需滿 3 天 · 於確認頁輸入優惠碼 · 每筆訂單折抵一次"
  },
  {
    code: "FREESHIP",
    title: "舊客免運（現折 NT$100）",
    off: "NT$100",
    desc: "租借過一次以上，選擇郵寄到府即折運費 100 元。",
    rule: "限有租借紀錄之電話 · 需選擇郵寄到府 · 每筆訂單折抵一次"
  }
];

const TERMS = [
  {
    h: "一、租借資格",
    p: ["承租人須年滿 18 歲，並具備中華民國身分證或其他可證明本人身分之證件正本。未滿 18 歲者須由法定代理人共同簽署。"]
  },
  {
    h: "二、身分核對與取機",
    p: ["取機時請出示證件正本供現場核對與拍照留存，完成歸還並結清款項後，本公司將於 30 日內刪除證件影像。若資料不實、無法核對或現場有明顯異常，本公司得拒絕出租並取消訂單，且不負違約責任。"]
  },
  {
    h: "三、訂金與付款",
    p: ["訂單成立後須於 24 小時內支付訂金 NT$500，逾時系統將自動取消。尾款（租金＋押金－訂金）於取機當日現場結清。押金於歸還並確認機況無誤後，當日現場全額退還。"]
  },
  {
    h: "四、取消與改期",
    p: ["取機日前 15 日（含）前取消，訂金全額退還；取機日前 15 日內取消，訂金不退，可轉為一次改期使用（限原訂日期後 90 日內）。退款若使用非指定銀行帳戶，將扣除跨行手續費 NT$15。"]
  },
  {
    h: "五、租借期間之使用規範",
    p: ["租借期間請維持手機電量 30% 以上歸還；不得刷機、越獄、Root、拆機或安裝非官方應用程式；不得將設備轉租、轉借、抵押或攜出台灣本島。"]
  },
  {
    h: "六、損壞與遺失",
    p: ["設備若有刮傷、進水、螢幕破裂或功能異常，將依實際維修報價扣除押金，不足者另行求償。若無法維修或遺失，須賠償該機型台灣官方全新零售價；維修期間致無法出借，另須賠償每日租金 50% 之營業損失（上限 10 日）。"]
  },
  {
    h: "七、資料與隱私",
    p: ["承租人提供之姓名、電話、LINE 名稱與電子信箱，僅供訂單聯繫、租借紀錄與售後服務使用，不會提供給第三方。"]
  },
  {
    h: "八、準據法與管轄",
    p: ["本條款以中華民國法律為準據法。因本契約涉訟時，雙方同意以台灣台北地方法院為第一審管轄法院。"]
  }
];

const FAQ = [
  {
    q: "最少要租幾天？",
    a: "兩天起租。第三天起每天以優惠日租金計算（S25 Ultra 400 元、X300 Pro 600 元、Find X9 Pro 650 元），連看兩場或跨週末都很划算。"
  },
  {
    q: "押金多少？什麼時候退？",
    a: "S25 Ultra 押金 3,000 元，X300 Pro 3,500 元，Find X9 Pro 4,000 元，取機當日付款。歸還時確認手機與配件完整、結清費用後現場全額退還；舊客押金享半價。"
  },
  {
    q: "取機要帶什麼？",
    a: "身分證正本（或可證明本人的護照、居留證）以及訂單確認碼。證件僅供現場核對，歸還後 30 日內刪除影像。"
  },
  {
    q: "非本國籍可以租借嗎？",
    a: "可以，需出示護照或居留證正本，並收取兩倍押金。若為短期來台追星，建議提前三天私訊，我們會先幫你保留機況最好的那一支。"
  },
  {
    q: "可以郵寄嗎？",
    a: "第一次租借請於台北捷運中山站面交。有完整租借與歸還紀錄的舊客可選擇郵寄到府（運費 100 元），我們會於取機日前一天黑貓寄出。"
  },
  {
    q: "取消預約可以退訂金嗎？",
    a: "取機日前 15 天（含）取消可全額退訂金；15 天內取消則訂金不退，可轉為一次改期，限原日期後 90 天內使用。"
  },
  {
    q: "哪一支最適合拍演唱會？",
    a: "坐三樓或山頂，選 X300 Pro 或 Find X9 Pro 再加購增距鏡，等於帶了 400mm 進場；坐內場或搖滾區，S25 Ultra 的 5 倍光學與錄影穩定度就很夠用。"
  },
  {
    q: "手機裡的演唱會影片會留著嗎？",
    a: "不會。歸還前請自行備份，我們會在歸還當晚完成清除，不做任何備份或查看。若需要現場轉檔，可以自備隨身碟，我們協助你當場複製。"
  }
];

/* ---------- 檔期狀態（以日期字串產生固定結果，換裝置也一致） ---------- */
function hashCode(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function stockOf(modelId, dateStr) {
  const model = MODELS.find((m) => m.id === modelId);
  if (!model) return 0;
  const v = hashCode(modelId + "|" + dateStr) % 13;
  if (v === 0) return 0;
  if (v <= 2) return 1;
  return model.capacity;
}

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + dd;
}

function availability(dateStr) {
  const stocks = MODELS.map((m) => stockOf(m.id, dateStr));
  const max = Math.max.apply(null, stocks);
  if (max === 0) return "full";
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
