// ── Market Signals Table Logic ──────────────────────────────────────
function applyFilters() {
    const search = (document.getElementById("search")?.value || "").toUpperCase();
    const expiry = document.getElementById("expiryFilter")?.value || "CURRENT";
    const limit = document.getElementById("rowLimit")?.value || "5";

    let shownCount = 0;
    const maxRows = limit === "ALL" ? Infinity : parseInt(limit, 10);

    const rows = document.querySelectorAll("#mainTable tbody tr");

    rows.forEach(r => {
        // Section-label rows: always visible, reset counter for each section
        if (r.classList.contains("section-label")) {
            r.style.display = "";
            shownCount = 0; // Reset row counter for BUY SIDE and SELL SIDE
            return;
        }

        const sym = (r.cells[0]?.textContent || "").toUpperCase();
        const matchesSearch = !search || sym.includes(search);

        if (matchesSearch && shownCount < maxRows) {
            r.style.display = "";
            shownCount++;
        } else {
            r.style.display = "none";
        }
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
if (document.getElementById("mainTable")) {
    applyFilters();
}