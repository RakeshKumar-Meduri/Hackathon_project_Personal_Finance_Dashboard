// --- Data Logic ---
const exchangeRates = {
  USD: { USD: 1, EUR: 0.9, INR: 83 },
  EUR: { USD: 1.1, EUR: 1, INR: 92 },
  INR: { USD: 0.012, EUR: 0.011, INR: 1 }
};
let expenses = JSON.parse(localStorage.getItem("expenses") || "[]");
let savings = JSON.parse(localStorage.getItem("savings") || "[]");
let isProfit = true;

function saveData() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
  localStorage.setItem("savings", JSON.stringify(savings));
}

function renderSummary() {
  const baseCurrency = baseCurrencySelect.value;
  const totalExp = expenses.reduce(
    (sum, e) => sum + e.amount * exchangeRates[e.currency][baseCurrency], 0);
  const totalSav = savings.reduce(
    (sum, s) => sum + s.amount * exchangeRates[s.currency][baseCurrency], 0);
  const profit = totalSav - totalExp;
  isProfit = profit >= 0;
  let color = isProfit ? "#39ff84" : "#ff2f41";
  document.getElementById(
    "summary"
  ).innerHTML = `<span>Total Expenses: ${totalExp.toFixed(
    2
  )} ${baseCurrency}</span><span>Total Savings: ${totalSav.toFixed(
    2
  )} ${baseCurrency}</span><span>Balance: <b style="color:${color}">${profit.toFixed(
    2
  )} ${baseCurrency} ${
    isProfit ? "(Profit)" : "(Loss)"
  }</b></span>`;
}
function renderExpenses() {
  const baseCurrency = baseCurrencySelect.value;
  const group = {};
  expenses.forEach((e, i) => {
    if (!group[e.category]) group[e.category] = [];
    group[e.category].push({ ...e, idx: i });
  });
  let html = "";
  for (let cat in group) {
    html += `<div class="expense-category">${cat}</div><ul>`;
    group[cat].forEach((exp) => {
      const rate = exchangeRates[exp.currency][baseCurrency];
      const converted = (exp.amount * rate).toFixed(2);
      html += `<li>${exp.description}: ${converted} ${baseCurrency} <span style="font-size:0.85em; color:gray;">[${exp.amount} ${exp.currency}]</span> <button class="entry-delete" onclick="deleteExpense(${exp.idx})" aria-label="Delete expense ${exp.description}">🗑</button></li>`;
    });
    html += "</ul>";
  }
  document.getElementById("expenses").innerHTML =
    html || "<small>No expenses yet!</small>";
}
function renderSavings() {
  const baseCurrency = baseCurrencySelect.value;
  const group = {};
  savings.forEach((s, i) => {
    if (!group[s.category]) group[s.category] = [];
    group[s.category].push({ ...s, idx: i });
  });
  let html = "";
  for (let cat in group) {
    html += `<div class="savings-category">${cat}</div><ul>`;
    group[cat].forEach((sav) => {
      const rate = exchangeRates[sav.currency][baseCurrency];
      const converted = (sav.amount * rate).toFixed(2);
      html += `<li>${sav.description}: ${converted} ${baseCurrency} <span style="font-size:0.85em; color:gray;">[${sav.amount} ${sav.currency}]</span> <button class="entry-delete" onclick="deleteSavings(${sav.idx})" aria-label="Delete saving ${sav.description}">🗑</button></li>`;
    });
    html += "</ul>";
  }
  document.getElementById("savings").innerHTML =
    html || "<small>No savings yet!</small>";
}
window.deleteExpense = function(idx) {
  expenses.splice(idx, 1); saveData(); renderAll();
};
window.deleteSavings = function(idx) {
  savings.splice(idx, 1); saveData(); renderAll();
};
function renderAll() { renderExpenses(); renderSavings(); renderSummary(); }

const showTotalBtn = document.getElementById("show-summary-btn"),
  overlay = document.getElementById("total-overlay"),
  closeOverlay = document.getElementById("close-overlay"),
  totalDetails = document.getElementById("total-details");
showTotalBtn.addEventListener("click", () => {
  const baseCurrency = baseCurrencySelect.value;
  const totalExp = expenses.reduce(
    (sum, e) => sum + e.amount * exchangeRates[e.currency][baseCurrency], 0);
  const totalSav = savings.reduce(
    (sum, s) => sum + s.amount * exchangeRates[s.currency][baseCurrency], 0);
  const profit = totalSav - totalExp;
  let color = profit >= 0 ? "#39ff8a" : "#ff2f41";
  totalDetails.innerHTML = `
    <div style="margin-bottom:14px;">Total Expenses: <b>${totalExp.toFixed(
      2
    )} ${baseCurrency}</b></div>
    <div style="margin-bottom:14px;">Total Savings: <b>${totalSav.toFixed(
      2
    )} ${baseCurrency}</b></div>
    <div style="font-size:1.28rem;">
      Balance: <b style="color:${color}">${profit.toFixed(2)} ${baseCurrency} ${
    profit >= 0 ? "(Profit)" : "(Loss)"
  }</b>
    </div>
  `;
  overlay.classList.add("show");
});
closeOverlay.addEventListener("click", () => overlay.classList.remove("show"));
overlay.addEventListener("click", e => {
  if (e.target === overlay) overlay.classList.remove("show");
});
const form = document.getElementById("expense-form");
form.addEventListener("submit", e => {
  e.preventDefault();
  const expense = {
    description: document.getElementById("description").value,
    amount: parseFloat(document.getElementById("amount").value),
    currency: document.getElementById("currency").value,
    category: document.getElementById("category").value,
  };
  expenses.push(expense);
  saveData();
  renderAll();
  form.reset();
});
const savingsForm = document.getElementById("savings-form");
savingsForm.addEventListener("submit", e => {
  e.preventDefault();
  const saving = {
    description: document.getElementById("savings-description").value,
    amount: parseFloat(document.getElementById("savings-amount").value),
    currency: document.getElementById("savings-currency").value,
    category: document.getElementById("savings-category").value,
  };
  savings.push(saving);
  saveData();
  renderAll();
  savingsForm.reset();
});
const baseCurrencySelect = document.getElementById("base-currency");
baseCurrencySelect.addEventListener("change", renderAll);

// Trading Graph
const canvas = document.getElementById("bg-canvas"),
  ctx = canvas.getContext("2d");
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas); resizeCanvas();
const lineSpacing = 11, minY = 40,
  maxY = () => canvas.height - 58;
let priceData = [], priceVel = [];
function genPriceData(num) {
  priceData = [];
  priceVel = [];
  let y = Math.round(canvas.height * 0.5) + Math.round(Math.random() * 140) - 70;
  for (let i = 0; i < num; ++i) {
    priceData.push(y); priceVel.push(0.0);
  }
}
function updatePriceData() {
  const nPoints = Math.floor(canvas.width / lineSpacing) + 2;
  if (priceData.length !== nPoints) genPriceData(nPoints);
  for (let i = 1; i < priceData.length; ++i) {
    let leader = i === 1 ? canvas.height / 2 : priceData[i - 1];
    let diff = leader - priceData[i];
    priceVel[i] += diff * 0.018 + (Math.random() - 0.46) * 0.98;
    priceVel[i] *= 0.91;
    priceData[i] += priceVel[i] * 0.27;
    if (priceData[i] < minY && priceVel[i] < 0) priceVel[i] *= -0.8;
    if (priceData[i] > maxY() && priceVel[i] > 0) priceVel[i] *= -0.8;
    priceData[i] = Math.max(minY, Math.min(maxY(), priceData[i]));
  }
  priceData[0] += Math.sin(Date.now() / 9000) * 0.55 + (Math.random() - 0.5) * 0.45;
  priceData[0] = Math.max(minY, Math.min(maxY(), priceData[0]));
}
function drawTradingGraph() {
  updatePriceData();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  const baseLine = isProfit ? "#3cff71" : "#ff306a",
    baseGlow = isProfit ? "#7cf8b2" : "#ff5b8a";
  ctx.beginPath();
  ctx.moveTo(0, priceData[0]);
  for (let i = 1; i < priceData.length; ++i) ctx.lineTo(i * lineSpacing, priceData[i]);
  ctx.strokeStyle = baseLine;
  ctx.shadowColor = baseGlow;
  ctx.shadowBlur = 30;
  ctx.lineWidth = 5.0;
  ctx.globalAlpha = 0.8;
  ctx.stroke();
  ctx.restore();
  requestAnimationFrame(drawTradingGraph);
}
drawTradingGraph();

// Mouse trail
const mouseCanvas = document.getElementById("mouse-canvas"),
  mctx = mouseCanvas.getContext("2d");
function resizeMouseCanvas() {
  mouseCanvas.width = window.innerWidth;
  mouseCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeMouseCanvas); resizeMouseCanvas();
let mouseTrail = [], maxTrail = 36;
window.addEventListener("mousemove", (e) => {
  mouseTrail.push({ x: e.clientX, y: e.clientY });
  if (mouseTrail.length > maxTrail) mouseTrail.shift();
});
window.addEventListener("scroll", () => {
  mouseTrail.push({
    x: window.innerWidth / 2,
    y: window.scrollY + 140 + Math.random() * window.innerHeight * 0.6,
  });
  if (mouseTrail.length > maxTrail) mouseTrail.shift();
});
function drawNeonTrail() {
  mctx.clearRect(0, 0, mouseCanvas.width, mouseCanvas.height);
  if (mouseTrail.length < 2) return;
  mctx.save();
  for (let i = 1; i < mouseTrail.length; i++) {
    mctx.beginPath();
    mctx.moveTo(mouseTrail[i - 1].x, mouseTrail[i - 1].y);
    mctx.lineTo(mouseTrail[i].x, mouseTrail[i].y);
    let alpha = 0.17 + (0.26 * i) / maxTrail;
    let clr = isProfit ? "#35ffe3" : "#ff3a76";
    mctx.strokeStyle = clr;
    mctx.shadowColor = clr;
    mctx.lineWidth = 5 + Math.cos(i / 5) * 1.5;
    mctx.globalAlpha = alpha;
    mctx.shadowBlur = 9 + 13 * Math.pow(i / maxTrail, 1.3);
    mctx.stroke();
  }
  mctx.restore();
  requestAnimationFrame(drawNeonTrail);
}
drawNeonTrail();

// Scroll reveal
document.querySelectorAll('.section-animate').forEach(el => el.classList.remove('active'));
function revealOnScroll() {
  document.querySelectorAll('.section-animate').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 80 && rect.bottom > 0) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
}
window.addEventListener('scroll', revealOnScroll);
window.addEventListener('DOMContentLoaded', revealOnScroll);

// Diamonds
const diamondBg = document.getElementById('diamond-bg');
function spawnDiamond() {
  let d = document.createElement('div');
  d.className = 'diamond';
  const left = Math.random() * window.innerWidth;
  const size = 22 + Math.random() * 30;
  d.style.left = left + 'px';
  d.style.width = d.style.height = size + 'px';
  d.style.animationDuration = (8 + Math.random()*3) + 's';
  d.style.opacity = 0.14 + Math.random()*0.18;
  diamondBg.appendChild(d);
  setTimeout(() => {
    if (d.parentElement) d.parentElement.removeChild(d);
  }, 10000);
}
setInterval(spawnDiamond, 430);

// Neon floating circles (replace gold glitter)
const sparkleCanvas = document.getElementById('sparkle-canvas');
const sparkleCtx = sparkleCanvas.getContext('2d');
function resizeSparkleCanvas() {
  sparkleCanvas.width = window.innerWidth;
  sparkleCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeSparkleCanvas);
resizeSparkleCanvas();
const NUM_CIRCLES = 18;
let circles = [];
function randomCircle() {
  const x = Math.random() * sparkleCanvas.width;
  const y = sparkleCanvas.height + 40 + Math.random() * 60;
  const r = 24 + Math.random() * 40;
  const speed = 0.3 + Math.random()*0.7;
  const maxAlpha = 0.18 + Math.random()*0.17;
  return {
    x, y, r,
    alpha: 0,
    maxAlpha,
    phase: Math.random()*Math.PI*2,
    speed
  };
}
for (let i=0; i<NUM_CIRCLES; ++i) circles.push(randomCircle());
function drawCircles() {
  sparkleCtx.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height);
  for (let c of circles) {
    c.y -= c.speed;
    c.alpha = c.maxAlpha * (0.3 + 0.7*Math.abs(Math.sin(Date.now()/1800 + c.phase)));
    sparkleCtx.save();
    sparkleCtx.globalAlpha = c.alpha;
    let neon = 'rgba(38,255,230,0.8)';
    let neon2 = 'rgba(255,250,178,0.25)';
    let grad = sparkleCtx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r*1.2);
    grad.addColorStop(0, neon2);
    grad.addColorStop(0.17, neon);
    grad.addColorStop(1, 'rgba(38,255,230,0)');
    sparkleCtx.beginPath();
    sparkleCtx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    sparkleCtx.fillStyle = grad;
    sparkleCtx.shadowColor = "#26ffe6";
    sparkleCtx.shadowBlur = 34;
    sparkleCtx.fill();
    sparkleCtx.restore();
    if (c.y + c.r < 0) {
      Object.assign(c, randomCircle());
      c.y = sparkleCanvas.height + c.r;
    }
  }
  requestAnimationFrame(drawCircles);
}
drawCircles();

renderAll();
