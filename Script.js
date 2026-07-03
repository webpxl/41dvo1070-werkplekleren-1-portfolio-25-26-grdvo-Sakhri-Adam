(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- Radar chart (competenties) ---------- */
    var competenties = [
        { label: "Perfectie", value: 4 },
        { label: "Klantgerichtheid", value: 3 },
        { label: "Gemotiveerd", value: 5 },
        { label: "Hulpvaardig", value: 4 },
        { label: "Sociaal", value: 4 },
        { label: "Doorzettingsvermogen", value: 4 }
    ];

    var canvas = document.getElementById("radar-chart");
    var ctx = canvas ? canvas.getContext("2d") : null;
    var radarDrawn = false;

    function drawRadar(progress) {
        if (!ctx) return;
        var w = canvas.width, h = canvas.height;
        var cx = w / 2, cy = h / 2;
        var maxR = Math.min(w, h) / 2 - 70;
        var levels = 5;
        var n = competenties.length;
        var angleStep = (Math.PI * 2) / n;

        ctx.clearRect(0, 0, w, h);

        // rings
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 1;
        for (var lvl = 1; lvl <= levels; lvl++) {
            var r = (maxR / levels) * lvl;
            ctx.beginPath();
            for (var i = 0; i <= n; i++) {
                var a = -Math.PI / 2 + angleStep * i;
                var x = cx + r * Math.cos(a);
                var y = cy + r * Math.sin(a);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // axes + labels
        ctx.fillStyle = "#A08E82";
        ctx.font = "600 15px Inter, sans-serif";
        for (i = 0; i < n; i++) {
            a = -Math.PI / 2 + angleStep * i;
            x = cx + maxR * Math.cos(a);
            y = cy + maxR * Math.sin(a);
            ctx.strokeStyle = "rgba(255,255,255,0.12)";
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(x, y);
            ctx.stroke();

            var lx = cx + (maxR + 34) * Math.cos(a);
            var ly = cy + (maxR + 34) * Math.sin(a);
            ctx.textAlign = Math.cos(a) > 0.3 ? "left" : Math.cos(a) < -0.3 ? "right" : "center";
            ctx.textBaseline = Math.sin(a) > 0.3 ? "top" : Math.sin(a) < -0.3 ? "bottom" : "middle";
            ctx.fillText(competenties[i].label, lx, ly);
            ctx.fillStyle = "#A08E82";

            // value markers on top ring
            ctx.fillStyle = "rgba(255,255,255,0.4)";
            ctx.font = "500 10px Inter, sans-serif";
        }

        // data polygon (animated by progress 0..1)
        ctx.beginPath();
        for (i = 0; i <= n; i++) {
            var idx = i % n;
            a = -Math.PI / 2 + angleStep * idx;
            var val = (competenties[idx].value / levels) * progress;
            r = maxR * val;
            x = cx + r * Math.cos(a);
            y = cy + r * Math.sin(a);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = "rgba(2, 116, 189, 0.28)";
        ctx.fill();
        ctx.strokeStyle = "#0274BD";
        ctx.lineWidth = 2;
        ctx.stroke();

        // points + value labels
        for (i = 0; i < n; i++) {
            a = -Math.PI / 2 + angleStep * i;
            val = (competenties[i].value / levels) * progress;
            r = maxR * val;
            x = cx + r * Math.cos(a);
            y = cy + r * Math.sin(a);
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = "#FFFFFF";
            ctx.fill();
            ctx.strokeStyle = "#0274BD";
            ctx.lineWidth = 2;
            ctx.stroke();

            if (progress > 0.85) {
                ctx.fillStyle = "#FFFFFF";
                ctx.font = "700 13px Inter, sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(competenties[i].value + "/5", x, y - 14);
            }
        }
    }

    function animateRadar() {
        if (radarDrawn || !canvas) return;
        radarDrawn = true;
        if (reduceMotion) {
            drawRadar(1);
            return;
        }
        var start = null;
        var duration = 900;
        function step(ts) {
            if (!start) start = ts;
            var t = Math.min(1, (ts - start) / duration);
            var eased = 1 - Math.pow(1 - t, 3);
            drawRadar(eased);
            if (t < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    // static draw immediately so canvas isn't blank before scroll
    if (ctx) drawRadar(1);

    /* ---------- Scroll reveals ---------- */
    var revealTargets = document.querySelectorAll(".timeline li, .radar-wrap");

    if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("in-view");
                    if (entry.target.id === "radar-chart" || entry.target.classList.contains("radar-wrap")) {
                        animateRadar();
                    }
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        revealTargets.forEach(function (el) { io.observe(el); });

        var barIo = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var block = entry.target;
                    block.querySelectorAll(".bar-row").forEach(function (row) {
                        var value = parseFloat(row.getAttribute("data-value")) || 0;
                        var pct = (value / 5) * 100;
                        var fill = row.querySelector(".bar-fill");
                        if (fill) fill.style.width = pct + "%";
                    });
                    barIo.unobserve(block);
                }
            });
        }, { threshold: 0.25 });

        document.querySelectorAll(".lang-block").forEach(function (block) {
            barIo.observe(block);
        });
    } else {
        // fallback: reveal everything immediately
        revealTargets.forEach(function (el) { el.classList.add("in-view"); });
        document.querySelectorAll(".bar-row").forEach(function (row) {
            var value = parseFloat(row.getAttribute("data-value")) || 0;
            var fill = row.querySelector(".bar-fill");
            if (fill) fill.style.width = (value / 5) * 100 + "%";
        });
        animateRadar();
    }

    /* ---------- Redraw radar crisply on resize ---------- */
    var resizeTimer;
    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            if (ctx) drawRadar(1);
        }, 200);
    });
})();