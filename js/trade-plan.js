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

// ── Prediction Table Date Filter Logic ──
function populatePredictionDateOptions() {
    const dateSelect = document.getElementById("predDateSelect");
    const table = document.getElementById("predictionTable");
    if (!dateSelect || !table) return;

    const existingVals = new Set(Array.from(dateSelect.options).map(o => o.value));
    const dates = new Set();
    table.querySelectorAll("tbody tr:not(.no-pred-row)").forEach(r => {
        const tDate = r.getAttribute("data-trigger-date") || (r.cells[12] ? r.cells[12].textContent.trim().slice(0, 10) : "");
        const eDate = r.getAttribute("data-entry-date") || (r.cells[4] ? r.cells[4].textContent.trim().slice(0, 10) : "");
        if (tDate && /^\d{4}-\d{2}-\d{2}$/.test(tDate)) dates.add(tDate);
        if (eDate && /^\d{4}-\d{2}-\d{2}$/.test(eDate)) dates.add(eDate);
    });

    const sortedDates = Array.from(dates).sort().reverse();
    const todayStr = new Date().toISOString().slice(0, 10);

    sortedDates.forEach(d => {
        if (!existingVals.has(d)) {
            const opt = document.createElement("option");
            opt.value = d;
            opt.textContent = (d === todayStr) ? `${d} (Today)` : d;
            dateSelect.appendChild(opt);
            existingVals.add(d);
        }
    });
}

function applyPredictionDateFilter() {
    const dateSelect = document.getElementById("predDateSelect");
    const customDate = document.getElementById("predCustomDate");
    const dateField = document.getElementById("predDateField");
    const table = document.getElementById("predictionTable");
    const summary = document.getElementById("predFilterSummary");
    if (!table) return;

    let selectedDate = dateSelect ? dateSelect.value : "ALL";
    const matchField = dateField ? dateField.value : "trigger";

    const rows = table.querySelectorAll("tbody tr:not(.no-pred-row)");
    let visibleCount = 0;
    let tgtCount = 0;
    let pbCount = 0;
    let exitProfitCount = 0;
    let exitLossCount = 0;
    let slCount = 0;
    let beCount = 0;

    rows.forEach(r => {
        const tDate = r.getAttribute("data-trigger-date") || (r.cells[12] ? r.cells[12].textContent.trim().slice(0, 10) : "");
        const eDate = r.getAttribute("data-entry-date") || (r.cells[4] ? r.cells[4].textContent.trim().slice(0, 10) : "");
        const out = r.getAttribute("data-outcome") || (r.cells[11] ? r.cells[11].textContent.trim() : "");

        let match = false;
        if (selectedDate === "ALL" || !selectedDate) {
            match = true;
        } else if (matchField === "trigger") {
            match = (tDate === selectedDate);
        } else if (matchField === "entry") {
            match = (eDate === selectedDate);
        } else if (matchField === "both") {
            match = (tDate === selectedDate || eDate === selectedDate);
        }

        if (match) {
            r.style.display = "";
            visibleCount++;

            // Categorize for live KPI update
            if (out.includes("50% BOOKED")) {
                pbCount++;
            } else if (out.includes("Exit at profit") || (out.toLowerCase().includes("exit") && out.toLowerCase().includes("profit"))) {
                exitProfitCount++;
            } else if (out.includes("Exit as loss") || (out.toLowerCase().includes("exit") && out.toLowerCase().includes("loss"))) {
                exitLossCount++;
            } else if (out.includes("SUCCESS")) {
                tgtCount++;
            } else if (out.includes("BREAK_EVEN") || out.includes("BREAK EVEN")) {
                beCount++;
            } else {
                slCount++;
            }
        } else {
            r.style.display = "none";
        }
    });

    // Handle empty state
    let noRow = table.querySelector(".no-pred-row");
    if (visibleCount === 0) {
        if (!noRow) {
            const tbody = table.querySelector("tbody");
            noRow = document.createElement("tr");
            noRow.className = "no-pred-row";
            noRow.innerHTML = `<td colspan="13" style="text-align:center; padding:24px; color:#64748b; font-size:13px;">No resolved predictions found for date: <b>${selectedDate}</b></td>`;
            if (tbody) tbody.appendChild(noRow);
        } else {
            noRow.style.display = "";
            const bEl = noRow.querySelector("b");
            if (bEl) bEl.textContent = selectedDate;
        }
    } else if (noRow) {
        noRow.style.display = "none";
    }

    // Update KPI Card Numbers Dynamically
    const winCount = tgtCount + pbCount + exitProfitCount;
    const winRate = visibleCount > 0 ? ((winCount / visibleCount) * 100).toFixed(1) : "0.0";

    const setKpi = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    };

    setKpi("kpi-total-val", `${visibleCount} <span style="font-size:12px;color:#888;">Calls</span>`);
    setKpi("kpi-winrate-val", `${winRate}%`);
    setKpi("kpi-winrate-sub", `${winCount} Won / ${visibleCount} Resolved`);
    setKpi("kpi-tgt-val", `${tgtCount} <span style="font-size:12px;color:#888;">Calls</span>`);
    setKpi("kpi-pb-val", `${pbCount} <span style="font-size:12px;color:#888;">Calls</span>`);
    setKpi("kpi-profit-val", `${exitProfitCount} <span style="font-size:12px;color:#888;">Calls</span>`);
    setKpi("kpi-loss-val", `${exitLossCount} <span style="font-size:12px;color:#888;">Calls</span>`);
    setKpi("kpi-sl-val", `${slCount} <span style="font-size:12px;color:#888;">Calls</span>`);

    // Update Summary Badge
    if (summary) {
        if (selectedDate === "ALL" || !selectedDate) {
            summary.textContent = `Showing all ${visibleCount} predictions`;
            summary.style.color = "#0284c7";
            summary.style.background = "#f0f9ff";
            summary.style.borderColor = "#bae6fd";
        } else {
            summary.textContent = `Showing ${visibleCount} of ${rows.length} predictions (${selectedDate})`;
            summary.style.color = "#15803d";
            summary.style.background = "#f0fdf4";
            summary.style.borderColor = "#bbf7d0";
        }
    }
}

function onPredictionCustomDateChange(val) {
    const dateSelect = document.getElementById("predDateSelect");
    if (!val) {
        if (dateSelect) dateSelect.value = "ALL";
    } else {
        if (dateSelect) {
            let found = false;
            for (let i = 0; i < dateSelect.options.length; i++) {
                if (dateSelect.options[i].value === val) {
                    dateSelect.selectedIndex = i;
                    found = true;
                    break;
                }
            }
            if (!found) {
                const opt = document.createElement("option");
                opt.value = val;
                opt.textContent = val;
                dateSelect.appendChild(opt);
                dateSelect.value = val;
            }
        }
    }
    applyPredictionDateFilter();
}

function resetPredictionDateFilter() {
    const dateSelect = document.getElementById("predDateSelect");
    const customDate = document.getElementById("predCustomDate");
    const dateField = document.getElementById("predDateField");
    if (dateSelect) dateSelect.value = "ALL";
    if (customDate) customDate.value = "";
    if (dateField) dateField.value = "trigger";
    applyPredictionDateFilter();
}

window.populatePredictionDateOptions = populatePredictionDateOptions;
window.applyPredictionDateFilter = applyPredictionDateFilter;
window.onPredictionCustomDateChange = onPredictionCustomDateChange;
window.resetPredictionDateFilter = resetPredictionDateFilter;

window.initTradePlanTab = function() {
    updateActivePredictionBadge();
    populatePredictionDateOptions();
    applyPredictionDateFilter();
};

if (document.getElementById("highScoreTable")) {
    updateActivePredictionBadge();
}
if (document.getElementById("predictionTable")) {
    populatePredictionDateOptions();
    applyPredictionDateFilter();
}