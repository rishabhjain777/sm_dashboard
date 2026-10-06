// ── Market Signals Table Logic ──────────────────────────────────────
function applyFilters() {
    const search = (document.getElementById("search")?.value || "").toUpperCase();
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

            const sym = (r.cells[0]?.textContent || "").toUpperCase();
                const indexOnly = search.trim() === "INDEX";
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

window.initMarketTab = function() {
    applyFilters();
};

// Auto-run if table exists
if (document.getElementById("buyTable") || document.getElementById("mainTable")) {
    applyFilters();
}