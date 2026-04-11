const $ = (id) => document.getElementById(id);

const form = $("calcForm");
const transportMode = $("transportMode");
const includeLocalDelivery = $("includeLocalDelivery");

const pricePerKgWrap = $("pricePerKgWrap");
const pricePerCbmWrap = $("pricePerCbmWrap");
const fixedTransportWrap = $("fixedTransportWrap");
const weightWrap = $("weightWrap");
const cbmWrap = $("cbmWrap");
const localDeliveryWrap = $("localDeliveryWrap");

const historyKey = "afriShipPlusHistory";

function num(id) {
  return Number($(id).value) || 0;
}

function text(id) {
  return $(id).value.trim();
}

function money(value) {
  const n = Math.round(Number(value) || 0);
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

function updateTransportFields() {
  const mode = transportMode.value;

  pricePerKgWrap.classList.add("hidden");
  pricePerCbmWrap.classList.add("hidden");
  fixedTransportWrap.classList.add("hidden");
  weightWrap.classList.add("hidden");
  cbmWrap.classList.add("hidden");

  if (mode === "kg") {
    pricePerKgWrap.classList.remove("hidden");
    weightWrap.classList.remove("hidden");
  } else if (mode === "cbm") {
    pricePerCbmWrap.classList.remove("hidden");
    cbmWrap.classList.remove("hidden");
  } else {
    fixedTransportWrap.classList.remove("hidden");
  }
}

function updateLocalDeliveryField() {
  localDeliveryWrap.classList.toggle("hidden", !includeLocalDelivery.checked);
}

function compute() {
  const productName = text("productName") || "Produit";
  const currency = text("currency") || "FCFA";
  const supplierAmount = num("supplierAmount");
  const quantity = Math.max(1, num("quantity"));
  const exchangeRate = Math.max(0, num("exchangeRate")) || 1;
  const taxPercent = Math.max(0, num("taxPercent"));
  const packaging = num("packaging");
  const otherFees = num("otherFees");
  const sellingPrice = num("sellingPrice");
  const localDelivery = includeLocalDelivery.checked ? num("localDelivery") : 0;

  const supplierFcfa = supplierAmount * exchangeRate;

  let transportCost = 0;
  let transportLabel = "";

  if (transportMode.value === "kg") {
    transportCost = num("pricePerKg") * num("weightTotal");
    transportLabel = "Transport par kg";
  } else if (transportMode.value === "cbm") {
    transportCost = num("pricePerCbm") * num("volumeCbm");
    transportLabel = "Transport par CBM";
  } else {
    transportCost = num("fixedTransport");
    transportLabel = "Transport fixe";
  }

  const taxes = (supplierFcfa + transportCost) * (taxPercent / 100);
  const totalCost = supplierFcfa + transportCost + taxes + packaging + otherFees + localDelivery;
  const unitCost = totalCost / quantity;
  const revenueTotal = sellingPrice * quantity;
  const profitTotal = revenueTotal - totalCost;
  const profitUnit = sellingPrice - unitCost;
  const marginPercent = sellingPrice > 0 ? (profitUnit / sellingPrice) * 100 : 0;

  let status = "neutral";
  let badgeText = "Équilibre";
  let message = "Aucun gain ni perte.";

  if (profitTotal > 0) {
    status = "gain";
    badgeText = "Gain";
    message = `Gain avec une marge de ${marginPercent.toFixed(1)}%`;
  } else if (profitTotal < 0) {
    status = "loss";
    badgeText = "Perte";
    message = `Perte avec une marge de ${marginPercent.toFixed(1)}%`;
  }

  const result = {
    date: new Date().toLocaleString(),
    productName,
    currency,
    supplierAmount,
    quantity,
    supplierFcfa,
    transportLabel,
    transportCost,
    taxes,
    packaging,
    otherFees,
    localDelivery,
    totalCost,
    unitCost,
    sellingPrice,
    revenueTotal,
    profitTotal,
    profitUnit,
    marginPercent,
    status,
    badgeText,
    message
  };

  renderResult(result);
  return result;
}

function renderResult(r) {
  $("rSupplierFcfa").textContent = money(r.supplierFcfa);
  $("rTransport").textContent = money(r.transportCost);
  $("rTaxes").textContent = money(r.taxes);
  $("rLocalDelivery").textContent = money(r.localDelivery);
  $("rTotalCost").textContent = money(r.totalCost);
  $("rUnitCost").textContent = money(r.unitCost);
  $("rSellingPrice").textContent = money(r.sellingPrice);
  $("rProfitTotal").textContent = money(r.profitTotal);
  $("rProfitUnit").textContent = money(r.profitUnit);
  $("rMargin").textContent = `${r.marginPercent.toFixed(1)}%`;

  const badge = $("statusBadge");
  badge.textContent = r.badgeText;
  badge.className = `badge ${r.status}`;

  $("statusMessage").textContent = r.message;
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(historyKey)) || [];
  } catch {
    return [];
  }
}

function saveHistory(item) {
  const history = getHistory();
  history.unshift(item);
  localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 100)));
  renderHistory();
}

function clearHistory() {
  localStorage.removeItem(historyKey);
  renderHistory();
}

function renderHistory() {
  const history = getHistory();
  const list = $("historyList");

  if (!history.length) {
    list.innerHTML = '<p class="muted">Aucun calcul enregistré.</p>';
    return;
  }

  list.innerHTML = history.map((item) => `
    <div class="history-item">
      <h3>${escapeHtml(item.productName)}</h3>
      <p><strong>Date:</strong> ${escapeHtml(item.date)}</p>
      <p><strong>Coût total:</strong> ${money(item.totalCost)}</p>
      <p><strong>Prix de vente:</strong> ${money(item.sellingPrice)}</p>
      <p><strong>Bénéfice total:</strong> ${money(item.profitTotal)}</p>
      <p><strong>Marge:</strong> ${item.marginPercent.toFixed(1)}%</p>
      <p><strong>Statut:</strong> ${escapeHtml(item.badgeText)}</p>
    </div>
  `).join("");
}

function exportCSV() {
  const history = getHistory();
  if (!history.length) {
    alert("Aucun historique à exporter.");
    return;
  }

  const headers = [
    "date",
    "productName",
    "quantity",
    "supplierFcfa",
    "transportCost",
    "taxes",
    "localDelivery",
    "totalCost",
    "unitCost",
    "sellingPrice",
    "profitTotal",
    "profitUnit",
    "marginPercent",
    "status"
  ];

  const rows = history.map((item) =>
    headers.map((key) => JSON.stringify(item[key] ?? "")).join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "historique-calculateur-marge.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  compute();
});

$("marginBtn").addEventListener("click", () => {
  compute();
});

$("saveBtn").addEventListener("click", () => {
  const result = compute();
  saveHistory(result);
  alert("Calcul enregistré dans l'historique.");
});

$("exportBtn").addEventListener("click", exportCSV);
$("clearHistoryBtn").addEventListener("click", clearHistory);

transportMode.addEventListener("change", updateTransportFields);
includeLocalDelivery.addEventListener("change", updateLocalDeliveryField);

updateTransportFields();
updateLocalDeliveryField();
renderHistory();
