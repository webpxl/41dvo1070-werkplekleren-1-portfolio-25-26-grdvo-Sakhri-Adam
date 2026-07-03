/* Portfolio scripts: draws the two skill charts on canvas and keeps them crisp on resize. */
(function () {
    "use strict";

    var COLOR_BLUE = "#0274BD";
    var COLOR_TAUPE = "#A08E82";
    var COLOR_WHITE = "#FFFFFF";
    var COLOR_GRID = "rgba(255,255,255,0.12)";

    /* rounded rect, used for the value "pill" badges on both charts */
    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    function drawValuePill(ctx, cx, cy, text) {
        ctx.font = "800 17px 'Big Shoulders Display', sans-serif";
        var textW = ctx.measureText(text).width;
        var padX = 12, h = 26;
        var w = textW + padX * 2;
        ctx.fillStyle = COLOR_BLUE;
        roundRect(ctx, cx - w / 2, cy - h / 2, w, h, h / 2);
        ctx.fill();
        ctx.fillStyle = COLOR_WHITE;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, cx, cy + 1);
    }

    /* A few Dutch competency names are long compound words that don't fit on
       one line next to the chart — split them at their natural word boundary. */
    var LABEL_LINES = {
        "KLANTGERICHTHEID": ["KLANT", "GERICHTHEID"],
        "DOORZETTINGSVERMOGEN": ["DOORZETTINGS", "VERMOGEN"]
    };
    function getLines(label) {
        return LABEL_LINES[label] || [label];
    }
    function drawLabel(ctx, lines, x, y, align, baseline) {
        var lineHeight = 16;
        ctx.textAlign = align;
        var n = lines.length;
        for (var i = 0; i < n; i++) {
            var ly;
            if (baseline === "top") ly = y + i * lineHeight;
            else if (baseline === "bottom") ly = y - (n - 1 - i) * lineHeight;
            else ly = y - ((n - 1) * lineHeight) / 2 + i * lineHeight;
            ctx.textBaseline = baseline;
            ctx.fillText(lines[i], x, ly);
        }
    }

    /* ---------- Soft skills: radar chart ---------- */
    var softSkills = [
        { label: "Perfectie", value: 4 },
        { label: "Klantgerichtheid", value: 3 },
        { label: "Gemotiveerd", value: 5 },
        { label: "Hulpvaardig", value: 4 },
        { label: "Sociaal", value: 4 },
        { label: "Doorzettingsvermogen", value: 4 }
    ];

    function drawRadar() {
        var canvas = document.getElementById("radar-chart");
        if (!canvas) return;
        var ctx = canvas.getContext("2d");
        var w = canvas.width, h = canvas.height;
        var cx = w / 2, cy = h / 2;
        var maxR = Math.min(w, h) / 2 - 115;
        var levels = 5;
        var n = softSkills.length;
        var angleStep = (Math.PI * 2) / n;
        var i, a, x, y, r;

        ctx.clearRect(0, 0, w, h);

        ctx.strokeStyle = COLOR_GRID;
        ctx.lineWidth = 1;
        for (var lvl = 1; lvl <= levels; lvl++) {
            r = (maxR / levels) * lvl;
            ctx.beginPath();
            for (i = 0; i <= n; i++) {
                a = -Math.PI / 2 + angleStep * i;
                x = cx + r * Math.cos(a);
                y = cy + r * Math.sin(a);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        for (i = 0; i < n; i++) {
            a = -Math.PI / 2 + angleStep * i;
            x = cx + maxR * Math.cos(a);
            y = cy + maxR * Math.sin(a);
            ctx.strokeStyle = COLOR_GRID;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(x, y);
            ctx.stroke();

            var lx = cx + (maxR + 22) * Math.cos(a);
            var ly = cy + (maxR + 22) * Math.sin(a);
            var align = Math.cos(a) > 0.3 ? "left" : Math.cos(a) < -0.3 ? "right" : "center";
            var baseline = Math.sin(a) > 0.3 ? "top" : Math.sin(a) < -0.3 ? "bottom" : "middle";
            ctx.fillStyle = COLOR_TAUPE;
            ctx.font = "700 13px Inter, sans-serif";
            drawLabel(ctx, getLines(softSkills[i].label.toUpperCase()), lx, ly, align, baseline);
        }

        ctx.beginPath();
        for (i = 0; i <= n; i++) {
            var idx = i % n;
            a = -Math.PI / 2 + angleStep * idx;
            r = maxR * (softSkills[idx].value / levels);
            x = cx + r * Math.cos(a);
            y = cy + r * Math.sin(a);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = "rgba(2, 116, 189, 0.28)";
        ctx.fill();
        ctx.strokeStyle = COLOR_BLUE;
        ctx.lineWidth = 2;
        ctx.stroke();

        for (i = 0; i < n; i++) {
            a = -Math.PI / 2 + angleStep * i;
            r = maxR * (softSkills[i].value / levels);
            x = cx + r * Math.cos(a);
            y = cy + r * Math.sin(a);
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = COLOR_WHITE;
            ctx.fill();
            ctx.strokeStyle = COLOR_BLUE;
            ctx.lineWidth = 2;
            ctx.stroke();

            var pillR = Math.min(r + 24, maxR + 6);
            drawValuePill(ctx, cx + pillR * Math.cos(a), cy + pillR * Math.sin(a), softSkills[i].value + "/5");
        }
    }

    /* ---------- Hard skills: bar chart ---------- */
    var hardSkills = [
        { label: "Figma", value: 4 },
        { label: "Illustrator", value: 4 },
        { label: "Photoshop", value: 3.5 },
        { label: "HTML", value: 4 }
    ];

    function drawHardSkills() {
        var canvas = document.getElementById("hardskills-chart");
        if (!canvas) return;
        var ctx = canvas.getContext("2d");
        var w = canvas.width, h = canvas.height;
        var max = 5;
        var padTop = 70, padBottom = 90, padSide = 60;
        var chartH = h - padTop - padBottom;
        var chartW = w - padSide * 2;
        var n = hardSkills.length;
        var gap = 46;
        var barW = (chartW - gap * (n - 1)) / n;
        var baseY = padTop + chartH;

        ctx.clearRect(0, 0, w, h);

        ctx.strokeStyle = COLOR_GRID;
        ctx.lineWidth = 1;
        ctx.fillStyle = COLOR_TAUPE;
        ctx.font = "500 12px Inter, sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        for (var lvl = 0; lvl <= max; lvl++) {
            var gy = baseY - (chartH / max) * lvl;
            ctx.beginPath();
            ctx.moveTo(padSide, gy);
            ctx.lineTo(w - padSide, gy);
            ctx.stroke();
            ctx.fillText(String(lvl), padSide - 14, gy);
        }

        for (var i = 0; i < n; i++) {
            var skill = hardSkills[i];
            var bx = padSide + i * (barW + gap);
            var barH = (skill.value / max) * chartH;
            var by = baseY - barH;

            var grad = ctx.createLinearGradient(0, by, 0, baseY);
            grad.addColorStop(0, "#3aa3e0");
            grad.addColorStop(1, COLOR_BLUE);
            ctx.fillStyle = grad;
            ctx.fillRect(bx, by, barW, barH);

            ctx.fillStyle = COLOR_TAUPE;
            ctx.font = "700 14px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(skill.label.toUpperCase(), bx + barW / 2, baseY + 18);

            var label = (skill.value % 1 === 0 ? skill.value : skill.value.toFixed(1)) + "/5";
            drawValuePill(ctx, bx + barW / 2, by - 26, label);
        }
    }

    function drawCharts() {
        drawRadar();
        drawHardSkills();
    }

    /* Draw immediately, and keep crisp on resize (canvases use a fixed internal
       resolution but are scaled by CSS, so a redraw isn't strictly required —
       this just keeps text/line weight optically consistent at odd widths). */
    drawCharts();
    var resizeTimer;
    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(drawCharts, 200);
    });
})();