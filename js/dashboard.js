// ── Master Dashboard Controller, Shared Utilities & Tab Lazy-Loader ──
let sortDirections = {};

function numericValue(value) {
    value = (value || "").replace(/[₹,%]/g, "").trim();
    if (value === "NA" || value === "" || value === "—") return null;
    let n = parseFloat(value);
    return isNaN(n) ? null : n;
}

function cellText(cell) {
    return cell ? cell.innerText.trim() : "";
}

function tableData(table) {
    let data = [];
    table.querySelectorAll("tbody tr").forEach(row => {
        let cells = [];
        row.querySelectorAll("td").forEach(c => cells.push(c));
        data.push({ row, cells });
    });
    return data;
}

function sortTable(header, colIndex) {
    const table = header.closest("table");
    if (!table) return;

    const key = (table.id || "table") + "_" + colIndex;
    let asc = sortDirections[key] !== true;
    sortDirections[key] = asc;

    table.querySelectorAll("th").forEach(th => {
        th.classList.remove("asc", "desc");
    });
    header.classList.add(asc ? "asc" : "desc");

    let data = tableData(table);
    data.sort((a, b) => {
        let vA = cellText(a.cells[colIndex]);
        let vB = cellText(b.cells[colIndex]);

        let nA = numericValue(vA);
        let nB = numericValue(vB);

        if (nA !== null && nB !== null) {
            return asc ? nA - nB : nB - nA;
        }
        return asc ? vA.localeCompare(vB) : vB.localeCompare(vA);
    });

    const tbody = table.querySelector("tbody");
    data.forEach(item => tbody.appendChild(item.row));
}

// ── Tab Registry & Configuration ─────────────────────────────────────
const TAB_CONFIG = {
    'market': { title: 'F&O Market Signals', path: 'tabs/market.html', script: 'js/market.js', init: 'initMarketTab' },
    'analyzer': { title: '360° Stock Analyzer', path: 'tabs/analyzer.html', script: 'js/analyzer.js', init: 'initAnalyzerTab' },
    'trade-plan': { title: 'Prediction Result & Trade Plan', path: 'tabs/trade-plan.html', script: 'js/trade-plan.js', init: 'initTradePlanTab' },
    'quality': { title: 'Stock Scores (Q / G / V / T)', path: 'tabs/quality.html', script: 'js/quality.js', init: 'initQualityTab' },
    'analytics': { title: 'AI Quant Predictions', path: 'tabs/analytics.html', script: 'js/analytics.js', init: 'initAnalyticsTab' },
    'retrospective': { title: 'Daily Retrospective', path: 'tabs/retrospective.html', script: 'js/analytics.js', init: 'initRetroTab' },
    'todos': { title: 'AI Improvement To-Dos', path: 'tabs/todos.html', script: 'js/analytics.js', init: 'initTodosTab' }
};

const TAB_ALIASES = {
    'fno': 'market',
    'prediction': 'trade-plan',
    'scores': 'quality',
    'predictions': 'analytics'
};

const CACHED_TABS = {};
const LOADED_SCRIPTS = {};

function loadScript(src) {
    if (!src || LOADED_SCRIPTS[src]) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.onload = () => { LOADED_SCRIPTS[src] = true; resolve(); };
        s.onerror = (e) => reject(e);
        document.body.appendChild(s);
    });
}

async function switchDashboardTab(rawTabId) {
    const tabId = TAB_ALIASES[rawTabId] || rawTabId;
    const cfg = TAB_CONFIG[tabId];
    if (!cfg) {
        console.warn("Unknown tab requested:", rawTabId);
        return;
    }

    // Update active nav button
    document.querySelectorAll(".tab-nav-btn").forEach(btn => btn.classList.remove("active"));
    const activeBtn = document.getElementById("tabBtn-" + tabId) || document.getElementById("tabBtn-" + rawTabId);
    if (activeBtn) activeBtn.classList.add("active");

    // Hide all existing tab panes
    document.querySelectorAll(".tab-content").forEach(p => {
        p.style.display = "none";
        p.classList.remove("active");
    });

    const containerId = "tabContent-" + tabId;
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement("div");
        container.id = containerId;
        container.className = "tab-content";
        document.getElementById("tab-container").appendChild(container);
    }

    // ── Cache Hit: Instant reveal without network request ───────────
    if (CACHED_TABS[tabId]) {
        container.style.display = "block";
        container.classList.add("active");
        container.querySelectorAll(".tab-content, [id^='tabContent-']").forEach(tc => {
            tc.classList.add("active");
            tc.style.display = "block";
        });
        if (cfg.init && typeof window[cfg.init] === "function") {
            window[cfg.init]();
        }
        try {
            localStorage.setItem("activeDashboardTab", tabId);
            window.location.hash = tabId;
        } catch(e) {}
        return;
    }

    // ── Cache Miss: Lazy Load Tab HTML & Associated JS ──────────────
    const loader = document.getElementById("tabLoading");
    if (loader) loader.style.display = "flex";

    try {
        let tabHtml = null;
        try {
            // Priority 1: Network fetch (always fresh on GitHub Pages)
            const fetchUrl = cfg.path + '?t=' + new Date().getTime();
            const resp = await fetch(fetchUrl);
            if (resp.ok) tabHtml = await resp.text();
        } catch(fetchErr) {
            console.warn("fetch failed for " + cfg.path, fetchErr);
        }

        // Priority 2: Offline fallback via embedded templates
        if (!tabHtml && window.TAB_TEMPLATES && window.TAB_TEMPLATES[tabId]) {
            tabHtml = window.TAB_TEMPLATES[tabId];
        }

        if (!tabHtml) {
            throw new Error("Unable to load content for " + cfg.title);
        }

        container.innerHTML = tabHtml;

        if (cfg.script) {
            await loadScript(cfg.script);
        }

        CACHED_TABS[tabId] = true;
        container.style.display = "block";
        container.classList.add("active");
        container.querySelectorAll(".tab-content, [id^='tabContent-']").forEach(tc => {
            tc.classList.add("active");
            tc.style.display = "block";
        });

        if (cfg.init && typeof window[cfg.init] === "function") {
            window[cfg.init]();
        }

        try {
            localStorage.setItem("activeDashboardTab", tabId);
            window.location.hash = tabId;
        } catch(e) {}
    } catch(err) {
        console.error("Failed to load tab:", tabId, err);
        container.innerHTML = '<div style="padding:40px; text-align:center; color:#b91c1c;">' +
            '<h3>Failed to load tab: ' + cfg.title + '</h3>' +
            '<p style="color:#64748b; font-size:12px;">' + err.message + '</p>' +
            '</div>';
        container.style.display = "block";
    } finally {
        if (loader) loader.style.display = "none";
    }
}

window.addEventListener("DOMContentLoaded", () => {
    let initialTab = "market";
    try {
        const hash = window.location.hash.replace("#", "");
        if (hash && (TAB_CONFIG[hash] || TAB_ALIASES[hash])) {
            initialTab = TAB_ALIASES[hash] || hash;
        } else {
            const saved = localStorage.getItem("activeDashboardTab");
            if (saved && (TAB_CONFIG[saved] || TAB_ALIASES[saved])) {
                initialTab = TAB_ALIASES[saved] || saved;
            }
        }
    } catch(e) {}
    switchDashboardTab(initialTab);
});