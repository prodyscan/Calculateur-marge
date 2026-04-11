const $ = (id) => document.getElementById(id);

const historyKey = "importcacultorHistory";

const form = $("calcForm");
const transportMode = $("transportMode");
const toggleAdvancedBtn = $("toggleAdvancedBtn");
const advancedPanel = $("advancedPanel");

const pricePerKgWrap = $("pricePerKgWrap");
const pricePerCbmWrap = $("pricePerCbmWrap");
const fixedTransportWrap = $("fixedTransportWrap");
const weightWrap = $("weightWrap");
const cbmWrap = $("cbmWrap");

const advancedFixedFields = ["quantityField", "exchangeRateField"];

const optionalMap = [
  { check: "chkTaxes", wrap: "taxPercentWrap" },
  { check: "chkPackaging", wrap: "packagingWrap" },
  { check: "chkOtherFees", wrap: "otherFeesWrap" },
  { check: "chkLocalDelivery", wrap: "localDeliveryWrap" },
  { check: "chkSellingPrice", wrap: "sellingPriceWrap" },
];

function num(id) {
  return Number($(id)?.value) || 0;
}

function text(id) {
  return ($(id)?.value || "").trim();
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

function updateOptionalFields() {
  optionalMap.forEach(({ check, wrap }) => {
    $(wrap).classList.toggle("hidden", !$(check).checked);
  });
}

function updateResultVisibility() {
  const hasTaxes = $("chkTaxes").checked;
  const hasPackaging = $("chkPackaging").checked;
  const hasOtherFees = $("chkOtherFees").checked;
  const hasLocalDelivery = $("chkLocalDelivery").checked;
  const hasSellingPrice = $("chkSellingPrice").checked;

  $("rowTaxes").classList.toggle("hidden", !hasTaxes);
  $("rowPackaging").classList.toggle("hidden", !hasPackaging);
  $("rowOtherFees").classList.toggle("hidden", !hasOtherFees);
  $("rowLocalDelivery").classList.toggle("hidden", !hasLocalDelivery);

  $("rowSellingPrice").classList.toggle("hidden", !hasSellingPrice);
  $("rowProfitTotal").classList.toggle("hidden", !hasSellingPrice);
  $("rowProfitUnit").classList.toggle("hidden", !hasSellingPrice);
  $("rowMargin").classList.toggle("hidden", !hasSellingPrice);
}

function toggleAdvancedPanel() {
  advancedPanel.classList.toggle("hidden");
  const isOpen = !advancedPanel.classList.contains("hidden");

  advancedFixedFields.forEach((id) => {
    $(id).classList.toggle("hidden", !isOpen);
  });
}

function clearResults() {
  [
    "rSupplierFcfa",
    "rSupplierDelivery",
    "rTransport",
    "rTaxes",
    "rPackaging",
    "rOtherFees",
    "rLocalDelivery",
    "rTotalCost",
    "rUnitCost",
    "rSellingPrice",
    "rProfitTotal",
    "rProfitUnit",
    "rMargin",
  ].forEach((id) => {
    $(id).textContent = "-";
  });

  $("statusBadge").textContent = "En attente";
  $("statusBadge").className = "badge neutral";
  $("statusMessage").textContent = "Fais un calcul pour voir le résultat.";

  updateResultVisibility();
}

function resetForm() {
  form.reset();

  $("quantity").value = 1;
  $("exchangeRate").value = 1;
  $("supplierDelivery").value = 0;
  $("taxPercent").value = 0;
  $("packaging").value = 0;
  $("otherFees").value = 0;
  $("localDelivery").value = 0;
  $("sellingPrice").value = 0;

  $("currency").value = "USD";
  $("transportMode").value = "kg";

  advancedPanel.classList.add("hidden");
  advancedFixedFields.forEach((id) => $(id).classList.add("hidden"));

  updateTransportFields();
  updateOptionalFields();
  updateResultVisibility();
  clearResults();
}

function compute() {
  const productName = text("productName") || "Produit";
  const currency = text("currency") || "USD";
  const supplierAmount = num("supplierAmount");
  const supplierDelivery = num("supplierDelivery");

  const quantityVisible = !$("quantityField").classList.contains("hidden");
  const exchangeVisible = !$("exchangeRateField").classList.contains("hidden");

  const quantity = quantityVisible ? Math.max(1, num("quantity")) : 1;
  const exchangeRate = exchangeVisible ? (Math.max(0, num("exchangeRate")) || 1) : 1;

  const hasTaxes = $("chkTaxes").checked;
  const hasPackaging = $("chkPackaging").checked;
  const hasOtherFees = $("chkOtherFees").checked;
  const hasLocalDelivery = $("chkLocalDelivery").checked;
  const hasSellingPrice = $("chkSellingPrice").checked;

  const taxPercent = hasTaxes ? num("taxPercent") : 0;
  const packaging = hasPackaging ? num("packaging") : 0;
  const otherFees = hasOtherFees ? num("otherFees") : 0;
  const localDelivery = hasLocalDelivery ? num("localDelivery") : 0;
  const sellingPrice = hasSellingPrice ? num("sellingPrice") : 0;

  const supplierFcfa = supplierAmount * exchangeRate;

  let transportCost = 0;
  let transportLabel = "";

  if (transportMode.value === "kg") {
    transportCost = num("pricePerKg") * num("weightTotal");
    transportLabel = "Par kg";
  } else if (transportMode.value === "cbm") {
    transportCost = num("pricePerCbm") * num("volumeCbm");
    transportLabel = "Par CBM";
  } else {
    transportCost = num("fixedTransport");
    transportLabel = "Montant fixe";
  }

  const taxableBase = supplierFcfa + supplierDelivery + transportCost;
  const taxes = taxableBase * (taxPercent / 100);

  const totalCost =
    supplierFcfa +
    supplierDelivery +
    transportCost +
    taxes +
    packaging +
    otherFees +
    localDelivery;

  const unitCost = totalCost / quantity;
  const revenueTotal = sellingPrice * quantity;
  const profitTotal = revenueTotal - totalCost;
  const profitUnit = sellingPrice - unitCost;
  const marginPercent = sellingPrice > 0 ? (profitUnit / sellingPrice) * 100 : 0;

  let status = "neutral";
  let badgeText = "Sans marge";
  let message = "Calcul coût effectué sans prix de vente.";

  if (hasSellingPrice) {
    if (profitTotal > 0) {
      status = "gain";
      badgeText = "Gain";
      message = `Gain avec une marge de ${marginPercent.toFixed(1)}%`;
    } else if (profitTotal < 0) {
      status = "loss";
      badgeText = "Perte";
      message = `Perte avec une marge de ${marginPercent.toFixed(1)}%`;
    } else {
      status = "neutral";
      badgeText = "Équilibre";
      message = "Aucun gain ni perte.";
    }
  }

  const result = {
    date: new Date().toLocaleString(),
    productName,
    currency,
    supplierAmount,
    supplierDelivery,
    quantity,
    exchangeRate,
    supplierFcfa,
    transportMode: transportLabel,
    transportCost,
    taxes,
    packaging,
    otherFees,
    localDelivery,
    totalCost,
    unitCost,
    sellingPrice,
    profitTotal,
    profitUnit,
    marginPercent,
    status,
    badgeText,
    message,
  };

  renderResult(result);
  return result;
}

function renderResult(r) {
  updateResultVisibility();

  $("rSupplierFcfa").textContent = money(r.supplierFcfa);
  $("rSupplierDelivery").textContent = money(r.supplierDelivery);
  $("rTransport").textContent = money(r.transportCost);
  $("rTaxes").textContent = money(r.taxes);
  $("rPackaging").textContent = money(r.packaging);
  $("rOtherFees").textContent = money(r.otherFees);
  $("rLocalDelivery").textContent = money(r.localDelivery);
  $("rTotalCost").textContent = money(r.totalCost);
  $("rUnitCost").textContent = money(r.unitCost);
  $("rSellingPrice").textContent = money(r.sellingPrice);
  $("rProfitTotal").textContent = money(r.profitTotal);
  $("rProfitUnit").textContent = money(r.profitUnit);
  $("rMargin").textContent = `${r.marginPercent.toFixed(1)}%`;

  $("statusBadge").textContent = r.badgeText;
  $("statusBadge").className = `badge ${r.status}`;
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
  localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 200)));
  renderHistory();
}

function clearHistory() {
  localStorage.removeItem(historyKey);
  renderHistory();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderHistory() {
  const history = getHistory();
  const search = text("historySearch").toLowerCase();
  const list = $("historyList");

  const filtered = history.filter((item) => {
    const haystack = [
      item.productName,
      item.date,
      item.badgeText,
      item.status,
      item.transportMode,
    ].join(" ").toLowerCase();

    return haystack.includes(search);
  });

  if (!filtered.length) {
    list.innerHTML = '<p class="muted">Aucun résultat dans l’historique.</p>';
    return;
  }

  list.innerHTML = filtered.map((item) => `
    <div class="history-item">
      <h3>${escapeHtml(item.productName)}</h3>
      <p><strong>Date :</strong> ${escapeHtml(item.date)}</p>
      <p><strong>Coût total :</strong> ${money(item.totalCost)}</p>
      <p><strong>Prix de vente :</strong> ${money(item.sellingPrice)}</p>
      <p><strong>Bénéfice total :</strong> ${money(item.profitTotal)}</p>
      <p><strong>Marge :</strong> ${item.marginPercent.toFixed(1)}%</p>
      <p><strong>Statut :</strong> ${escapeHtml(item.badgeText)}</p>
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
    "currency",
    "supplierAmount",
    "supplierDelivery",
    "quantity",
    "exchangeRate",
    "supplierFcfa",
    "transportMode",
    "transportCost",
    "taxes",
    "packaging",
    "otherFees",
    "localDelivery",
    "totalCost",
    "unitCost",
    "sellingPrice",
    "profitTotal",
    "profitUnit",
    "marginPercent",
    "status",
    "badgeText"
  ];

  const rows = history.map((item) =>
    headers.map((key) => JSON.stringify(item[key] ?? "")).join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "importcacultor-historique.csv";
  a.click();
  URL.revokeObjectURL(url);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  compute();
});

$("marginBtn").addEventListener("click", compute);

$("saveBtn").addEventListener("click", () => {
  const result = compute();
  saveHistory(result);
  alert("Calcul enregistré.");
});

$("resetBtn").addEventListener("click", resetForm);
$("exportBtn").addEventListener("click", exportCSV);
$("clearHistoryBtn").addEventListener("click", clearHistory);
$("historySearch").addEventListener("input", renderHistory);

toggleAdvancedBtn.addEventListener("click", toggleAdvancedPanel);
transportMode.addEventListener("change", updateTransportFields);

optionalMap.forEach(({ check }) => {
  $(check).addEventListener("change", () => {
    updateOptionalFields();
    updateResultVisibility();
  });
});

updateTransportFields();
updateOptionalFields();
updateResultVisibility();
renderHistory();
clearResults();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js")
    .then(() => console.log("Service Worker OK"))
    .catch(() => console.log("Service Worker erreur"));
}
