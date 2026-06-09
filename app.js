/**
 * Amplitude Modulation (AM) Generation & Detection Lab
 * Core JavaScript Physics Engine and Canvas Plotter
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // DOM ELEMENTS
    // ==========================================================================
    
    // Nav Tabs
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Sliders & Values
    const inputAm = document.getElementById('input-am');
    const inputFm = document.getElementById('input-fm');
    const inputAc = document.getElementById('input-ac');
    const inputFc = document.getElementById('input-fc');
    const inputR = document.getElementById('input-r');
    const inputC = document.getElementById('input-c');
    
    const valAm = document.getElementById('am-val');
    const valFm = document.getElementById('fm-val');
    const valAc = document.getElementById('ac-val');
    const valFc = document.getElementById('fc-val');
    const valR = document.getElementById('r-val');
    const valC = document.getElementById('c-val');
    const valTau = document.getElementById('tau-val');
    
    // Telemetry Elements
    const muGauge = document.getElementById('mu-gauge');
    const muVal = document.getElementById('mu-val');
    const modState = document.getElementById('mod-state');
    const powerPc = document.getElementById('power-pc');
    const powerPs = document.getElementById('power-ps');
    const powerPt = document.getElementById('power-pt');
    const powerEfficiency = document.getElementById('power-efficiency');
    const equationDisplay = document.getElementById('equation-display');
    const advisorDisplay = document.getElementById('advisor-display');
    
    // Controls
    const btnPlay = document.getElementById('btn-play');
    const btnResetTime = document.getElementById('btn-reset-time');
    const btnToggleSplit = document.getElementById('btn-toggle-split');
    
    // Checkboxes
    const chMessage = document.getElementById('ch-message');
    const chCarrier = document.getElementById('ch-carrier');
    const chAm = document.getElementById('ch-am');
    const chRectified = document.getElementById('ch-rectified');
    const chDemodulated = document.getElementById('ch-demodulated');
    
    // Canvas
    const canvas = document.getElementById('oscCanvas');
    const ctx = canvas.getContext('2d');

    // ==========================================================================
    // STATE VARIABLES
    // ==========================================================================
    let isPlaying = true;
    let isSplitView = false;
    let timeOffset = 0; // Animates the wave scrolling
    let lastFrameTime = performance.now();
    
    // Physics parameters
    let Am = parseFloat(inputAm.value);
    let fm = parseFloat(inputFm.value);
    let Ac = parseFloat(inputAc.value);
    let fc = parseFloat(inputFc.value);
    let R = parseFloat(inputR.value); // Ohms
    let C = parseFloat(inputC.value);  // Microfarads
    
    // Screen scale parameters
    const totalTimeOnScreen = 2.0; // Visible time span in seconds

    // ==========================================================================
    // TAB NAVIGATION
    // ==========================================================================
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));
            
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            // Trigger redraw when returning to simulator to ensure canvas is properly sized
            if (tabId === 'simulator') {
                resizeCanvas();
                requestAnimationFrame(draw);
            }
        });
    });

    // ==========================================================================
    // SIMULATOR PARAMETER HANDLERS
    // ==========================================================================
    function updateParameters() {
        Am = parseFloat(inputAm.value);
        fm = parseFloat(inputFm.value);
        Ac = parseFloat(inputAc.value);
        fc = parseFloat(inputFc.value);
        R = parseFloat(inputR.value);
        C = parseFloat(inputC.value);
        
        // Update labels
        valAm.textContent = `${Am.toFixed(1)} V`;
        valFm.textContent = `${fm.toFixed(1)} Hz`;
        valAc.textContent = `${Ac.toFixed(1)} V`;
        valFc.textContent = `${fc} Hz`;
        valR.textContent = `${R} Ω`;
        valC.textContent = `${C.toFixed(1)} µF`;
        
        // Compute and show physical Time Constant τ = RC
        const currentTauMs = (R * C) / 1000;
        valTau.textContent = `${currentTauMs.toFixed(2)} ms`;
        
        updateTelemetry();
        if (!isPlaying) {
            requestAnimationFrame(draw);
        }
    }
    
    // Event listeners for inputs
    [inputAm, inputFm, inputAc, inputFc, inputR, inputC].forEach(input => {
        input.addEventListener('input', updateParameters);
    });

    // ==========================================================================
    // MATHEMATICAL MATH & TELEMETRY CALCULATIONS
    // ==========================================================================
    function updateTelemetry() {
        // Modulation Index μ
        const mu = Am / Ac;
        muVal.textContent = mu.toFixed(2);
        
        // Gauge visualization
        const gaugeWidth = Math.min(100, mu * 50); // Scale so μ=2.0 is 100%
        muGauge.style.width = `${gaugeWidth}%`;
        
        // Gauge color scheme based on modulation state
        if (mu > 1.0) {
            muGauge.style.background = 'var(--danger)';
            modState.textContent = `Over-modulation (μ = ${mu.toFixed(2)})`;
            modState.className = 'modulation-state-box overmodulated';
        } else if (Math.abs(mu - 1.0) < 0.05) {
            muGauge.style.background = 'var(--warning)';
            modState.textContent = 'Critical Modulation (μ ≈ 1)';
            modState.className = 'modulation-state-box critical';
        } else {
            muGauge.style.background = 'linear-gradient(90deg, var(--success) 70%, var(--warning) 100%)';
            modState.textContent = `Under-modulation (μ = ${mu.toFixed(2)})`;
            modState.className = 'modulation-state-box';
        }
        
        // Power calculations (assuming 1 ohm load impedance)
        // Pc = Ac^2 / 2
        // Ps = (mu^2 * Pc) / 2
        // Pt = Pc + Ps
        const Pc = (Ac * Ac) / 2;
        const Ps = (mu * mu * Pc) / 2;
        const Pt = Pc + Ps;
        const efficiency = (Ps / Pt) * 100;
        
        powerPc.textContent = `${Pc.toFixed(2)} W`;
        powerPs.textContent = `${Ps.toFixed(2)} W`;
        powerPt.textContent = `${Pt.toFixed(2)} W`;
        powerEfficiency.textContent = `${efficiency.toFixed(1)}%`;
        
        // Display Instantaneous Equation string
        equationDisplay.innerHTML = `s(t) = ${Ac.toFixed(2)}[1 + ${mu.toFixed(2)} cos(2π &times; ${fm.toFixed(1)}t)] cos(2π &times; ${fc.toFixed(0)}t)`;
        
        // Demodulator RC Checker (Advisor)
        // Ideal visual time constant scaling: τ_vis = R_kOhm * C_uF * 0.15 seconds
        // Visual Time constant value in seconds:
        const tauVis = (R / 1000) * C * 0.15; 
        
        // Message period Tm = 1/fm. Carrier period Tc = 1/fc.
        const Tc = 1 / fc;
        const Tm = 1 / fm;
        
        // Golden conditions: Tc << tau_vis << Tm
        // If tau_vis is too small: High ripple
        // If tau_vis is too large: Diagonal clipping
        const minIdealTau = 1.3 * Tc;
        const maxIdealTau = 0.85 / (2 * Math.PI * fm * Math.max(0.3, mu));
        
        if (tauVis < minIdealTau) {
            advisorDisplay.className = 'advisor-box warning';
            advisorDisplay.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <strong>Excessive Ripple:</strong> Time constant (τ = ${tauMs(R,C)}ms) is too small relative to carrier cycle (${(Tc*1000).toFixed(1)}ms). The capacitor discharges too rapidly, creating heavy ripple.`;
        } else if (tauVis > maxIdealTau) {
            advisorDisplay.className = 'advisor-box warning';
            advisorDisplay.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <strong>Diagonal Clipping:</strong> Time constant (τ = ${tauMs(R,C)}ms) is too large relative to the message envelope rate. Capacitor cannot decay fast enough, clipping the signal peaks.`;
        } else {
            advisorDisplay.className = 'advisor-box success';
            advisorDisplay.innerHTML = `<i class="fa-solid fa-circle-check"></i> <strong>Perfect Match:</strong> RC time constant is ideal. Ripple is filtered and diagonal clipping is avoided. Output tracks envelope beautifully.`;
        }
    }
    
    function tauMs(r, c) {
        return ((r * c) / 1000).toFixed(2);
    }

    // ==========================================================================
    // OSCILLOSCOPE CONTROL FUNCTIONS
    // ==========================================================================
    btnPlay.addEventListener('click', () => {
        isPlaying = !isPlaying;
        if (isPlaying) {
            btnPlay.innerHTML = '<i class="fa-solid fa-pause"></i>';
            lastFrameTime = performance.now();
            requestAnimationFrame(draw);
        } else {
            btnPlay.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    });
    
    btnResetTime.addEventListener('click', () => {
        timeOffset = 0;
        if (!isPlaying) {
            requestAnimationFrame(draw);
        }
    });
    
    btnToggleSplit.addEventListener('click', () => {
        isSplitView = !isSplitView;
        if (isSplitView) {
            btnToggleSplit.innerHTML = '<i class="fa-solid fa-square"></i> Combine Channels';
            btnToggleSplit.classList.add('btn-primary');
        } else {
            btnToggleSplit.innerHTML = '<i class="fa-solid fa-table-cells-large"></i> Split Channels';
            btnToggleSplit.classList.remove('btn-primary');
        }
        if (!isPlaying) {
            requestAnimationFrame(draw);
        }
    });
    
    // Checkbox toggles trigger redraw in static mode
    [chMessage, chCarrier, chAm, chRectified, chDemodulated].forEach(chk => {
        chk.addEventListener('change', () => {
            if (!isPlaying) {
                requestAnimationFrame(draw);
            }
        });
    });

    // ==========================================================================
    // CANVAS DRAWING & GRAPHICS ENGINE
    // ==========================================================================
    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        // Scale pixel density for high resolution screens (Retina)
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.resetTransform();
        ctx.scale(dpr, dpr);
    }
    
    // Initialize size and listener
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Main Animation Loop
    function draw() {
        const now = performance.now();
        if (isPlaying) {
            const dt = (now - lastFrameTime) / 1000;
            // Advance timeOffset based on time elapsed
            timeOffset += dt * 0.15; // Animation speed multiplier
            lastFrameTime = now;
        }
        
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);
        
        // Clear canvas
        ctx.fillStyle = '#050811';
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid layout
        if (isSplitView) {
            drawSplitScreen(width, height);
        } else {
            drawSingleScreen(width, height);
        }
        
        if (isPlaying) {
            requestAnimationFrame(draw);
        }
    }

    // Grid rendering parameters
    const GRID_SIZE = 40;
    
    function drawGrid(ctx, x, y, w, h) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.04)';
        ctx.lineWidth = 1;
        
        // Vertical grid lines
        for (let i = x; i < x + w; i += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(i, y);
            ctx.lineTo(i, y + h);
            ctx.stroke();
        }
        
        // Horizontal grid lines
        for (let j = y; j < y + h; j += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(x, j);
            ctx.lineTo(x + w, j);
            ctx.stroke();
        }
        
        // Center Axes (Oscilloscope zero references)
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.12)';
        ctx.lineWidth = 1.5;
        
        // Draw center horizontal line (can be multiple for split screen)
        ctx.restore();
    }

    // Draws all signals layered over each other
    function drawSingleScreen(width, height) {
        drawGrid(ctx, 0, 0, width, height);
        
        // Draw center reference axis
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Max range of combined waves (max amplitude of AM carrier is Ac + Am)
        // We set vertical scale so that 10V matches 85% of half screen height
        const verticalScale = (height * 0.4) / 10;
        const centerY = height / 2;
        
        // Calculations for waves
        const points = calculateWavePoints(width, centerY, verticalScale);
        
        // Plotting waves
        if (chCarrier.checked) drawSignalPath(points.carrier, 'var(--color-carrier)', 1.2);
        if (chRectified.checked) drawSignalPath(points.rectified, 'var(--color-rectified)', 1.2, true);
        if (chAm.checked) {
            // Envelope outline lines (Upper & Lower)
            drawSignalPath(points.envelopeUpper, 'var(--color-am)', 1, true, [5, 5]);
            drawSignalPath(points.envelopeLower, 'var(--color-am)', 1, true, [5, 5]);
            // Modulated Carrier wave
            drawSignalPath(points.am, 'var(--color-am)', 1.8);
        }
        if (chMessage.checked) drawSignalPath(points.message, 'var(--color-message)', 2.5);
        if (chDemodulated.checked) drawSignalPath(points.demodulated, 'var(--color-demod)', 2.5);
        
        // Draw Scale Info HUD overlay
        drawHUD(ctx, 15, 25, "Time Div: 200 ms/div", `μ = ${(Am/Ac).toFixed(2)}`, "Mode: Overlay");
    }

    // Draws signals split into channels:
    // Track 1: Message
    // Track 2: Carrier
    // Track 3: AM Modulated, Rectified, Demodulator
    function drawSplitScreen(width, height) {
        const trackHeight = height / 3;
        
        // Render 3 sub-grids
        for (let i = 0; i < 3; i++) {
            const yOffset = i * trackHeight;
            drawGrid(ctx, 0, yOffset, width, trackHeight);
            
            // Draw track reference line
            ctx.strokeStyle = 'rgba(0, 242, 254, 0.12)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(0, yOffset + trackHeight / 2);
            ctx.lineTo(width, yOffset + trackHeight / 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Add track borders
            if (i > 0) {
                ctx.strokeStyle = 'rgba(0, 242, 254, 0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, yOffset);
                ctx.lineTo(width, yOffset);
                ctx.stroke();
            }
        }
        
        // Calculate points with track-specific center offsets and scaled gains
        // We adjust vertical scale per track to fit waves nicely
        const scale1 = (trackHeight * 0.4) / 5; // Message track (max 5V)
        const scale2 = (trackHeight * 0.4) / 5; // Carrier track (max 5V)
        const scale3 = (trackHeight * 0.4) / 10; // AM track (max 10V)
        
        const center1 = trackHeight / 2;
        const center2 = trackHeight + trackHeight / 2;
        const center3 = 2 * trackHeight + trackHeight / 2;
        
        const points = calculateWavePoints(width, center1, scale1, center2, scale2, center3, scale3);
        
        // Plot Track 1: Message
        if (chMessage.checked) {
            drawSignalPath(points.message, 'var(--color-message)', 2);
            drawTrackLabel("CH1: Modulating Signal m(t)", 15, 20);
        } else {
            drawTrackLabel("CH1: Empty", 15, 20, true);
        }
        
        // Plot Track 2: Carrier
        if (chCarrier.checked) {
            drawSignalPath(points.carrier, 'var(--color-carrier)', 1.2);
            drawTrackLabel("CH2: Carrier Signal c(t)", 15, trackHeight + 20);
        } else {
            drawTrackLabel("CH2: Empty", 15, trackHeight + 20, true);
        }
        
        // Plot Track 3: AM Modulated, Rectified, Demodulator
        drawTrackLabel("CH3: RF Output & Detector", 15, 2 * trackHeight + 20);
        if (chRectified.checked) drawSignalPath(points.rectified, 'var(--color-rectified)', 1, true);
        if (chAm.checked) {
            drawSignalPath(points.envelopeUpper, 'var(--color-am)', 1, true, [4, 4]);
            drawSignalPath(points.envelopeLower, 'var(--color-am)', 1, true, [4, 4]);
            drawSignalPath(points.am, 'var(--color-am)', 1.5);
        }
        if (chDemodulated.checked) drawSignalPath(points.demodulated, 'var(--color-demod)', 2);
        
        // Overlay overall status HUD
        drawHUD(ctx, width - 180, 25, "Time Div: 200 ms", `μ = ${(Am/Ac).toFixed(2)}`, "Split Channels");
    }

    // ==========================================================================
    // MATHEMATICAL SIMULATOR MATH MODEL
    // ==========================================================================
    function calculateWavePoints(
        width, 
        centerY1, scale1, // For message, or default overlays
        centerY2, scale2, // For carrier split
        centerY3, scale3  // For AM/demod split
    ) {
        // Fallbacks for combined overlay mode
        const c1 = centerY1;
        const s1 = scale1;
        const c2 = centerY2 !== undefined ? centerY2 : centerY1;
        const s2 = scale2 !== undefined ? scale2 : scale1;
        const c3 = centerY3 !== undefined ? centerY3 : centerY1;
        const s3 = scale3 !== undefined ? scale3 : scale1;
        
        const messagePoints = [];
        const carrierPoints = [];
        const amPoints = [];
        const envelopeUpper = [];
        const envelopeLower = [];
        const rectifiedPoints = [];
        const demodPoints = [];
        
        // RC filter parameters
        // Visual tau constant. Coefficient 0.15 makes physical sliders map to visual time scales nicely.
        const tauVis = (R / 1000) * C * 0.15;
        
        // Initialize envelope voltage state
        let capVoltage = 0;
        
        for (let x = 0; x < width; x++) {
            // Map pixel x to simulation time t
            const screenT = (x / width) * totalTimeOnScreen; // 0 to 2 seconds
            const t = timeOffset + screenT;
            const dt = totalTimeOnScreen / width; // simulation step time
            
            // 1. Modulating (Message) Signal: Am * cos(2pi * fm * t)
            const msgVal = Am * Math.cos(2 * Math.PI * fm * t);
            messagePoints.push({ x, y: c1 - msgVal * s1 });
            
            // 2. Carrier Signal: Ac * cos(2pi * fc * t)
            const carrierVal = Ac * Math.cos(2 * Math.PI * fc * t);
            carrierPoints.push({ x, y: c2 - carrierVal * s2 });
            
            // 3. AM Wave: [Ac + m(t)] * cos(2pi * fc * t)
            const amVal = (Ac + msgVal) * Math.cos(2 * Math.PI * fc * t);
            amPoints.push({ x, y: c3 - amVal * s3 });
            
            // Envelope boundaries: Ac + m(t) and -(Ac + m(t))
            const envUpperVal = Ac + msgVal;
            const envLowerVal = -(Ac + msgVal);
            envelopeUpper.push({ x, y: c3 - envUpperVal * s3 });
            envelopeLower.push({ x, y: c3 - envLowerVal * s3 });
            
            // 4. Rectified Wave: max(0, AM Wave)
            const rectVal = Math.max(0, amVal);
            rectifiedPoints.push({ x, y: c3 - rectVal * s3 });
            
            // 5. Demodulated Wave (Envelope Detector Physical Simulation)
            // If input is greater than current capacitor charge, charge instantly (diode ON)
            if (rectVal > capVoltage) {
                capVoltage = rectVal;
            } else {
                // Diode OFF, capacitor discharges exponentially through resistor R: V_c(t) = V_c(t-dt) * e^(-dt/RC)
                // We add a tiny baseline offset so that it decays towards 0, not negative numbers.
                capVoltage = capVoltage * Math.exp(-dt / tauVis);
            }
            
            // Subtract DC offset to center the demodulated wave for visualization?
            // In a real envelope detector, there is a coupling capacitor that blocks DC: v_out(t) = v_cap(t) - Vdc
            // The DC component is roughly equal to the carrier amplitude Ac.
            // Let's subtract Ac to keep the demodulated signal centered exactly on top of the message signal!
            // This represents the AC coupling filter at the output stage of the demodulator.
            const demodVal = capVoltage - Ac;
            demodPoints.push({ x, y: c3 - demodVal * s3 });
        }
        
        return {
            message: messagePoints,
            carrier: carrierPoints,
            am: amPoints,
            envelopeUpper,
            envelopeLower,
            rectified: rectifiedPoints,
            demodulated: demodPoints
        };
    }

    // Helper: Draws lines along point arrays
    function drawSignalPath(points, strokeStyle, lineWidth = 2, isDashed = false, dashPattern = [5, 5]) {
        if (points.length === 0) return;
        
        ctx.save();
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        
        if (isDashed) {
            ctx.setLineDash(dashPattern);
        }
        
        // Add subtle neon glow to major waveforms
        if (!isDashed && lineWidth > 1.5) {
            ctx.shadowColor = strokeStyle;
            ctx.shadowBlur = 6;
        }
        
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        ctx.restore();
    }

    // HUD overlays on scope
    function drawHUD(ctx, x, y, line1, line2, line3) {
        ctx.save();
        ctx.fillStyle = 'rgba(10, 15, 30, 0.75)';
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.2)';
        ctx.lineWidth = 1;
        
        // Draw HUD container box
        ctx.beginPath();
        ctx.roundRect(x, y, 160, 75, 5);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillText(line1, x + 10, y + 20);
        ctx.fillText(line2, x + 10, y + 40);
        
        ctx.fillStyle = 'var(--text-accent)';
        ctx.fillText(line3, x + 10, y + 60);
        ctx.restore();
    }

    function drawTrackLabel(text, x, y, isEmpty = false) {
        ctx.save();
        ctx.font = '600 12px "Outfit", sans-serif';
        ctx.fillStyle = isEmpty ? 'var(--text-muted)' : 'var(--text-primary)';
        ctx.fillText(text, x, y);
        ctx.restore();
    }

    // Start rendering loops
    updateTelemetry();
    requestAnimationFrame(draw);
});
