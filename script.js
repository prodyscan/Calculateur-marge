const $ = (id) => document.getElementById(id);

const historyKey = "importcacultorHistory";

const form = $("calcForm");
const transportMode = $("transportMode");

const pricePerKgWrap = $("pricePerKgWrap");
const pricePerCbmWrap = $("pricePerCbmWrap");
const fixedTransportWrap = $("fixedTransportWrap");
const weightWrap = $("weightWrap");
const cbmWrap = $("cbmWrap");

const toggleAdvancedBtn = $("toggleAdvancedBtn");
const advancedPanel = $("advancedPanel");

const optionalMap = [
  { check: "chkSupplierDelivery", wrap: "supplierDeliveryWrap" },
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
    const checked = $(check).checked;
    $(wrap).classList.toggle("hidden", !checked);
  });
}

function resetForm() {
  form.reset();

  $("quantity").value = 1;
  $("exchangeRate").value = 1;
  $("currency").value = "USD";
  $("transportMode").value = "kg";

  ["supplierDelivery", "taxPercent", "packaging", "otherFees", "localDelivery", "sellingPrice"].forEach((id) => {
    if ($(id)) $(id).value = 0;
  });

  updateTransportFields();
  updateOptionalFields();
  clearResults();
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

  const badge = $("statusBadge");
  badge.textContent = "En attente";
  badge.className = "badge neutral";
  $("statusMessage").textContent = "Fais un calcul pour voir le résultat.";
}

function compute() {
  const productName = text("productName") || "Produit";
  const currency = text("currency") || "USD";
  const supplierAmount = num("supplierAmount");
  const quantity = Math.max(1, num("quantity"));
  const exchangeRate = Math.max(0, num("exchangeRate")) || 1;

  const hasSupplierDelivery = $("chkSupplierDelivery").checked;
  const hasTaxes = $("chkTaxes").checked;
  const hasPackaging = $("chkPackaging").checked;
  const hasOtherFees = $("chkOtherFees").checked;
  const hasLocalDelivery = $("chkLocalDelivery").checked;
  const hasSellingPrice = $("chkSellingPrice").checked;

  const supplierDelivery = hasSupplierDelivery ? num("supplierDelivery") : 0;
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
    quantity,
    exchangeRate,
    supplierFcfa,
    supplierDelivery,
    transportMode: transportLabel,
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
    message,
  };

  renderResult(result);
  return result;
}

function renderResult(r) {
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
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(search);
  });

  if (!filtered.length) {
    list.innerHTML = '<p class="muted">Aucun résultat dans l’historique.</p>';
    return;
  }

  list.innerHTML = filtered
    .map(
      (item) => `
      <div class="history-item">
        <h3>${escapeHtml(item.productName)}</h3>
        <p><strong>Date :</strong> ${escapeHtml(item.date)}</p>
        <p><strong>Coût total :</strong> ${money(item.totalCost)}</p>
        <p><strong>Prix de vente :</strong> ${money(item.sellingPrice)}</p>
        <p><strong>Bénéfice total :</strong> ${money(item.profitTotal)}</p>
        <p><strong>Marge :</strong> ${item.marginPercent.toFixed(1)}%</p>
        <p><strong>Statut :</strong> ${escapeHtml(item.badgeText)}</p>
      </div>
    `
    )
    .join("");
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
    "quantity",
    "exchangeRate",
    "supplierFcfa",
    "supplierDelivery",
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
    "badgeText",
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

$("marginBtn").addEventListener("click", () => {
  compute();
});

$("saveBtn").addEventListener("click", () => {
  const result = compute();
  saveHistory(result);
  alert("Calcul enregistré.");
});

$("resetBtn").addEventListener("click", resetForm);
$("exportBtn").addEventListener("click", exportCSV);
$("clearHistoryBtn").addEventListener("click", clearHistory);
$("historySearch").addEventListener("input", renderHistory);

toggleAdvancedBtn.addEventListener("click", () => {
  advancedPanel.classList.toggle("hidden");
});

transportMode.addEventListener("change", updateTransportFields);

optionalMap.forEach(({ check }) => {
  $(check).addEventListener("change", updateOptionalFields);
});

updateTransportFields();
updateOptionalFields();
renderHistory();
clearResults();
