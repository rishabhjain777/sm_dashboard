// ── Trade Plan Client Interactions ──────────────────────────────────
function updateActivePredictionBadge() {
    const table = document.getElementById("highScoreTable");
    const badge = document.getElementById("pred-badge");
    if (!table || !badge) return;
    const rows = table.querySelectorAll("tbody tr");
    let count = 0;
    rows.forEach(r => {
        if (r.cells && r.cells.length > 1 && !r.textContent.includes("No high conviction signals")) {
            count++;
        }
    });
    badge.textContent = count + " Active";
}

window.initTradePlanTab = function() {
    updateActivePredictionBadge();
};

if (document.getElementById("highScoreTable")) {
    updateActivePredictionBadge();
}