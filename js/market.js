// ── Market Signals Table Logic ──────────────────────────────────────
function applyFilters() {
    const search = (document.getElementById("search")?.value || "").toUpperCase().trim();
    const expiry = document.getElementById("expiryFilter")?.value || "CURRENT";
    const limit = document.getElementById("rowLimit")?.value || "5";

    const maxRows = limit === "ALL" ? Infinity : parseInt(limit, 10);

    const tables = document.querySelectorAll("#buyTable, #sellTable, #mainTable");
    tables.forEach(table => {
        let shownCount = 0;
        const rows = table.querySelectorAll("tbody tr");
        rows.forEach(r => {
            if (r.classList.contains("section-label")) {
                r.style.display = "";
                shownCount = 0;
                return;
            }

            const sym = (r.cells[0]?.textContent || "").toUpperCase().trim();
            const indexOnly = search === "INDEX";
            const matchesSearch = indexOnly
                ? r.dataset.isIndex === "true"
                : (!search || sym.includes(search));

            if (matchesSearch && shownCount < maxRows) {
                r.style.display = "";
                shownCount++;
            } else {
                r.style.display = "none";
            }
        });
    });

    // Expiry column visibility
    document.querySelectorAll(".next").forEach(x => {
        x.style.display = (expiry === "NEXT" || expiry === "ALL") ? "table-cell" : "none";
    });
    document.querySelectorAll(".far").forEach(x => {
        x.style.display = (expiry === "FAR" || expiry === "ALL") ? "table-cell" : "none";
    });
}

// ── 360° Stock Intelligence Modal & Share Controller ─────────────────
window.currentModalCommodity = "RELIANCE";
window.currentModalStock = "RELIANCE";

async function ensureAnalyzerDataLoaded() {
    if (window.ANALYZER_DATA && Object.keys(window.ANALYZER_DATA).length > 0 && typeof window.renderFullDossierHtml === "function") {
        return true;
    }
    if (typeof loadScript === "function") {
        try {
            await loadScript("js/analyzer.js");
            return true;
        } catch(e) {
            console.error("Failed to load js/analyzer.js", e);
        }
    }
    return false;
}

function getFirstVisibleStock() {
    const searchVal = (document.getElementById("search")?.value || "").trim().toUpperCase();
    if (searchVal && window.ANALYZER_DATA && window.ANALYZER_DATA[searchVal]) {
        return searchVal;
    }
    for (const tableId of ["buyTable", "sellTable", "mainTable"]) {
        const table = document.getElementById(tableId);
        if (!table) continue;
        const rows = table.querySelectorAll("tbody tr");
        for (const r of rows) {
            if (r.style.display !== "none" && r.cells.length > 0) {
                const sym = r.cells[0].textContent.trim().toUpperCase();
                if (sym && window.ANALYZER_DATA && window.ANALYZER_DATA[sym]) {
                    return sym;
                }
            }
        }
    }
    return "RELIANCE";
}
const getFirstVisibleCommodity = getFirstVisibleStock;

function populateModalCommodityControls() {
    if (!window.ANALYZER_DATA) return;
    const symbols = Object.keys(window.ANALYZER_DATA);
    if (!symbols.length) return;

    const sel = document.getElementById("modalCommoditySelect") || document.getElementById("modalStockSelect");
    if (sel && sel.options.length !== symbols.length) {
        sel.innerHTML = "";
        symbols.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s;
            opt.textContent = s;
            sel.appendChild(opt);
        });
    }

    const chipsWrap = document.getElementById("modalCommodityChips") || document.getElementById("modalStockChips");
    if (chipsWrap) {
        let displayList = symbols.slice(0, 18);
        if (activeSym && !displayList.includes(activeSym) && symbols.includes(activeSym)) {
            displayList = [activeSym, ...displayList.slice(0, 17)];
        }
        chipsWrap.innerHTML = "";
        displayList.forEach(s => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "modal-chip" + (s === activeSym ? " active" : "");
            btn.dataset.sym = s;
            btn.textContent = s;
            btn.onclick = () => switchModalCommodity(s);
            chipsWrap.appendChild(btn);
        });
    }
}
const populateModalStockControls = populateModalCommodityControls;

async function openMarketAnalyzerModal(symbol) {
    await ensureAnalyzerDataLoaded();

    let targetSym = symbol ? symbol.trim().toUpperCase() : getFirstVisibleStock();
    if (!window.ANALYZER_DATA || !window.ANALYZER_DATA[targetSym]) {
        if (window.ANALYZER_DATA) {
            const keys = Object.keys(window.ANALYZER_DATA);
            if (keys.length > 0) targetSym = keys[0];
        }
    }

    populateModalCommodityControls(targetSym);
    switchModalCommodity(targetSym);

    const modal = document.getElementById("marketAnalyzerModal") || document.getElementById("analyzerModal");
    if (modal) {
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
    }
}
const openStockAnalyzerModal = openMarketAnalyzerModal;

function switchModalCommodity(symbol) {
    if (!symbol) return;
    const sym = symbol.trim().toUpperCase();
    window.currentModalCommodity = sym;
    window.currentModalStock = sym;

    const sel = document.getElementById("modalCommoditySelect") || document.getElementById("modalStockSelect");
    if (sel && sel.value !== sym) sel.value = sym;

    let chipFound = false;
    document.querySelectorAll(".modal-chip").forEach(c => {
        if (c.dataset.sym === sym) {
            c.classList.add("active");
            chipFound = true;
        } else {
            c.classList.remove("active");
        }
    });
    if (!chipFound) {
        populateModalCommodityControls(sym);
    }

    const body = document.getElementById("modalDossierBody") || document.getElementById("analyzerModalBody");
    if (!body) return;

    const d = window.ANALYZER_DATA ? window.ANALYZER_DATA[sym] : null;
    if (d && typeof window.renderFullDossierHtml === "function") {
        body.innerHTML = window.renderFullDossierHtml(d);
    } else {
        body.innerHTML = '<div style="padding:40px; text-align:center; color:#888;">No analyzer intelligence available for ' + sym + '</div>';
    }
}
const switchModalStock = switchModalCommodity;

function openCurrentInAnalyzerTab() {
    const sym = window.currentModalCommodity || window.currentModalStock || "RELIANCE";
    closeMarketAnalyzerModal();
    if (typeof switchDashboardTab === "function") {
        switchDashboardTab("analyzer");
    }
    setTimeout(() => {
        if (typeof selectAnalyzerStock === "function") {
            selectAnalyzerStock(sym);
        }
    }, 150);
}
window.openCurrentInAnalyzerTab = openCurrentInAnalyzerTab;

function closeMarketAnalyzerModal(event) {
    if (event && event.target && event.target.id !== "marketAnalyzerModal" && event.target.id !== "analyzerModal" && !event.target.classList.contains("modal-close-btn") && !event.target.classList.contains("analyzer-modal-close")) {
        return;
    }
    const modal = document.getElementById("marketAnalyzerModal") || document.getElementById("analyzerModal");
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "";
    }
}
const closeStockAnalyzerModal = closeMarketAnalyzerModal;

function generateDossierShareText(sym) {
    const d = window.ANALYZER_DATA ? window.ANALYZER_DATA[sym] : null;
    if (!d) return "Stock " + sym + " intelligence not found.";

    const name = d.company_name || sym;
    const spot = (d.spot !== null && d.spot !== undefined && d.spot !== "NA" && !isNaN(d.spot))
        ? ("₹" + Number(d.spot).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}))
        : (d.spot || "NA");

    const fnoSig = d.fno ? d.fno.signal : "NA";
    const finalScore = d.fno && d.fno.final_score !== null ? d.fno.final_score : "—";
    const pivot = d.fno && d.fno.pivot !== null ? ("₹" + Number(d.fno.pivot).toFixed(2)) : "—";
    const r1 = d.fno && d.fno.r1 !== null ? ("₹" + Number(d.fno.r1).toFixed(2)) : "—";
    const s1 = d.fno && d.fno.s1 !== null ? ("₹" + Number(d.fno.s1).toFixed(2)) : "—";
    const oiYest = d.fno && d.fno.oi_yesterday !== null ? (d.fno.oi_yesterday + "%") : "—";
    const oiIntra = d.fno && d.fno.oi_last_query !== null ? (d.fno.oi_last_query + "%") : "—";

    const mcScore = d.score && d.score.total_score !== null ? (Number(d.score.total_score).toFixed(1) + "/10") : "—";
    const aiSig = d.quant && d.quant.intraday_signal ? d.quant.intraday_signal : "—";
    const aiConf = d.quant && d.quant.intraday_conf !== null ? (Number(d.quant.intraday_conf).toFixed(1) + "%") : "—";
    const risk = d.quant && d.quant.risk_level ? d.quant.risk_level : "—";

    let verdictLabel = "NEUTRAL";
    let verdictScore = 50;
    let strategy = "";
    if (typeof window.computeUnifiedVerdict === "function") {
        const v = window.computeUnifiedVerdict(d.fno, d.score, d.quant);
        verdictLabel = v.label;
        verdictScore = v.score;
        strategy = v.strategy;
    }

    const lines = [
        "📊 NSE 360° STOCK INTELLIGENCE: " + sym + (name !== sym ? (" (" + name + ")") : ""),
        "💰 Spot Price: " + spot,
        "--------------------------------------------------",
        "🎯 Composite Stance: " + verdictLabel + " (" + verdictScore + "/100)",
        "📈 F&O Market Signal: " + fnoSig + " | Final Score: " + finalScore + "/10",
        "⚡ AI Quant Model: " + aiSig + " (" + aiConf + " Confidence) | Risk: " + risk,
        "⭐ QGVT Stock Score: " + mcScore,
        "📍 Key Levels: Pivot " + pivot + " | R1: " + r1 + " | S1: " + s1,
        "🔄 OI Shifts: Yesterday " + oiYest + " | Intraday " + oiIntra,
        strategy ? ("💡 Actionable Strategy: " + strategy) : "",
        "--------------------------------------------------",
        "Live NSE F&O Dashboard: " + window.location.href.split("#")[0]
    ].filter(Boolean);

    return lines.join("\n");
}

async function shareCurrentModalDossier() {
    const sym = window.currentModalCommodity || window.currentModalStock || "RELIANCE";
    const text = generateDossierShareText(sym);

    if (navigator.share) {
        try {
            await navigator.share({
                title: "NSE 360° Dossier: " + sym,
                text: text
            });
            showShareToast("✓ Shared successfully!");
            return;
        } catch(e) {}
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            showShareToast("✓ Copied Dossier to clipboard!");
            return;
        } catch(e) {}
    }

    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    showShareToast("✓ Copied Dossier to clipboard!");
}
const shareStockAnalysis = shareCurrentModalDossier;

function showShareToast(msg) {
    let t = document.getElementById("shareToast") || document.getElementById("analyzerShareToast");
    if (!t) {
        t = document.createElement("div");
        t.id = "shareToast";
        t.className = "share-toast";
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => { t.classList.remove("show"); }, 2500);
}

document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
        const modal = document.getElementById("marketAnalyzerModal") || document.getElementById("analyzerModal");
        if (modal && modal.style.display !== "none") {
            closeMarketAnalyzerModal();
        }
    }
});

window.initMarketTab = function() {
    applyFilters();
};

window.openMarketAnalyzerModal = openMarketAnalyzerModal;
window.openStockAnalyzerModal = openStockAnalyzerModal;
window.closeMarketAnalyzerModal = closeMarketAnalyzerModal;
window.closeStockAnalyzerModal = closeStockAnalyzerModal;
window.switchModalCommodity = switchModalCommodity;
window.switchModalStock = switchModalStock;
window.shareCurrentModalDossier = shareCurrentModalDossier;
window.shareStockAnalysis = shareStockAnalysis;
window.openCurrentInAnalyzerTab = openCurrentInAnalyzerTab;

// Auto-run if table exists
if (document.getElementById("buyTable") || document.getElementById("mainTable")) {
    applyFilters();
}