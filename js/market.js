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

// ── 360° Stock Analyzer Modal & Sharing Controller ───────────────────
if (typeof loadScript === "function") {
    loadScript("js/analyzer.js").catch(() => {});
}

async function ensureAnalyzerLoaded() {
    if (typeof renderFullDossierHtml === "function" && window.ANALYZER_DATA && Object.keys(window.ANALYZER_DATA).length > 0) {
        return true;
    }
    if (typeof loadScript === "function") {
        try {
            await loadScript("js/analyzer.js");
            return true;
        } catch (e) {
            console.error("Failed to load analyzer.js:", e);
        }
    }
    return false;
}

function ensureAnalyzerModalInDOM() {
    let modal = document.getElementById("analyzerModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "analyzerModal";
        modal.className = "analyzer-modal-backdrop";
        modal.style.display = "none";
        modal.onclick = handleAnalyzerModalBackdrop;
        modal.innerHTML = `
          <div class="analyzer-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="analyzerModalTitle">
            <div class="analyzer-modal-header">
              <div class="analyzer-modal-title-wrap">
                <span class="analyzer-modal-icon">&#128373;</span>
                <div>
                  <h3 id="analyzerModalTitle" class="analyzer-modal-title">360° Stock Analysis Dossier</h3>
                  <div id="analyzerModalSubtitle" class="analyzer-modal-subtitle">Synthesized Multi-Factor Intelligence</div>
                </div>
              </div>
              <div class="analyzer-modal-actions">
                <button type="button" class="analyzer-modal-btn analyzer-modal-share-btn" onclick="shareStockAnalysis()" title="Share or Copy Analysis Summary">
                  &#128203; Share Result
                </button>
                <button type="button" class="analyzer-modal-close" onclick="closeStockAnalyzerModal()" title="Close (Esc)">
                  &times;
                </button>
              </div>
            </div>
            <div id="analyzerModalBody" class="analyzer-modal-body">
              <div class="tab-loading-spinner" style="padding:40px 20px;">
                <div class="tab-spinner"></div>
                <div>Synthesizing stock intelligence...</div>
              </div>
            </div>
          </div>
          <div id="analyzerShareToast" class="analyzer-toast" style="display:none;"></div>
        `;
        document.body.appendChild(modal);
    }
    return modal;
}

async function openStockAnalyzerModal(symbol) {
    const sym = (symbol || "").trim().toUpperCase();
    if (!sym) return;

    const modal = ensureAnalyzerModalInDOM();
    const modalBody = document.getElementById("analyzerModalBody");
    const modalTitle = document.getElementById("analyzerModalTitle");
    const modalSubtitle = document.getElementById("analyzerModalSubtitle");

    if (modalTitle) modalTitle.textContent = sym + " — 360° Stock Analysis";
    if (modalSubtitle) modalSubtitle.textContent = "Loading multi-factor confluence dossier...";
    if (modalBody) {
        modalBody.innerHTML = `
          <div class="tab-loading-spinner" style="padding:40px 20px;">
            <div class="tab-spinner"></div>
            <div>Synthesizing stock intelligence for ${sym}...</div>
          </div>
        `;
    }

    modal.style.display = "flex";
    modal.classList.add("open");
    document.body.style.overflow = "hidden";

    await ensureAnalyzerLoaded();

    const data = (window.ANALYZER_DATA && window.ANALYZER_DATA[sym]) ? window.ANALYZER_DATA[sym] : null;
    window._currentModalStockData = data;

    if (!data) {
        if (modalBody) {
            modalBody.innerHTML = `
              <div style="padding: 40px 20px; text-align: center; color: #64748b;">
                <div style="font-size: 32px; margin-bottom: 12px;">⚠️</div>
                <div style="font-size: 16px; font-weight: 700; color: #1e293b;">Stock '${sym}' not found in analyzer database</div>
                <div style="font-size: 13px; margin-top: 6px;">Multi-factor intelligence payload will update in the next sync cycle.</div>
              </div>
            `;
        }
        return;
    }

    const company = data.company_name || sym;
    if (modalTitle) modalTitle.textContent = sym + " (" + company + ")";
    if (modalSubtitle) modalSubtitle.textContent = "Synthesized Confluence: F&O Flow + Quality Scores + AI Quant + Actionable Verdict";

    if (typeof renderFullDossierHtml === "function") {
        modalBody.innerHTML = renderFullDossierHtml(data);
    } else {
        modalBody.innerHTML = `<pre style="padding:15px; font-size:12px;">` + JSON.stringify(data, null, 2) + `</pre>`;
    }
}

function closeStockAnalyzerModal() {
    const modal = document.getElementById("analyzerModal");
    if (modal) {
        modal.classList.remove("open");
        modal.style.display = "none";
    }
    document.body.style.overflow = "";
}

function handleAnalyzerModalBackdrop(event) {
    if (event.target && event.target.id === "analyzerModal") {
        closeStockAnalyzerModal();
    }
}

if (!window._analyzerEscAttached) {
    window._analyzerEscAttached = true;
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
            const modal = document.getElementById("analyzerModal");
            if (modal && modal.style.display !== "none") {
                closeStockAnalyzerModal();
            }
        }
    });
}

function shareStockAnalysis() {
    const d = window._currentModalStockData;
    if (!d) return;

    const sym = d.symbol;
    const spot = (d.spot && !isNaN(d.spot)) ? ("₹" + Number(d.spot).toFixed(2)) : (d.spot || "NA");
    const sig = d.fno ? d.fno.signal : "N/A";
    const sc = (d.score && d.score.total_score != null) ? (Number(d.score.total_score).toFixed(1) + "/10") : "N/A";
    const quant = (d.quant && d.quant.intraday_signal) ? (d.quant.intraday_signal + (d.quant.intraday_conf ? ` (${Number(d.quant.intraday_conf).toFixed(1)}%)` : "")) : "N/A";

    let verdictText = "N/A";
    let strategyText = "";
    if (typeof computeUnifiedVerdict === "function") {
        const v = computeUnifiedVerdict(d.fno, d.score, d.quant);
        verdictText = `${v.label} (${v.score}/100)`;
        strategyText = v.strategy;
    }

    const shareContent = [
        `📊 360° Stock Intelligence: ${sym}`,
        `• Spot: ${spot}`,
        `• Market Signal (F&O): ${sig}`,
        `• Stock Score (QGVT): ${sc}`,
        `• AI Quant Stance: ${quant}`,
        `• Composite Verdict: ${verdictText}`,
        strategyText ? `• Strategy: ${strategyText}` : "",
        `Generated from NSE F&O Market Dashboard`
    ].filter(Boolean).join("\n");

    if (navigator.share) {
        navigator.share({
            title: `360° Stock Analysis - ${sym}`,
            text: shareContent
        }).then(() => {
            showShareToast("Shared successfully!");
        }).catch(() => {
            copyShareText(shareContent);
        });
    } else {
        copyShareText(shareContent);
    }
}

function copyShareText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showShareToast("✅ Analysis summary copied to clipboard!");
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand("copy");
        showShareToast("✅ Analysis summary copied to clipboard!");
    } catch (e) {
        prompt("Copy stock analysis:", text);
    }
    document.body.removeChild(ta);
}

function showShareToast(msg) {
    let toast = document.getElementById("analyzerShareToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "analyzerShareToast";
        toast.className = "analyzer-toast";
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.display = "block";
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => { toast.style.display = "none"; }, 300);
    }, 2500);
}

window.initMarketTab = function() {
    applyFilters();
};

window.openStockAnalyzerModal = openStockAnalyzerModal;
window.closeStockAnalyzerModal = closeStockAnalyzerModal;
window.handleAnalyzerModalBackdrop = handleAnalyzerModalBackdrop;
window.shareStockAnalysis = shareStockAnalysis;

// Auto-run if table exists
if (document.getElementById("buyTable") || document.getElementById("mainTable")) {
    applyFilters();
}