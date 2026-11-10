/* Kedi ve köpek misket karakterleri (Pati Yarışı ile aynı çizim). */
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = n >> 8 & 255, b = n & 255;
  const t = f < 0 ? 0 : 255, p = Math.abs(f);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return `rgb(${r},${g},${b})`;
}
function drawPet(ctx, x, y, r, ang, color, animal) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  const dark = shade(color, -0.35);
  // kulaklar (arkada)
  if (animal === 'kedi') {
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(s * r * 0.25, -r * 0.8); ctx.lineTo(s * r * 0.95, -r * 1.25); ctx.lineTo(s * r * 0.9, -r * 0.35); ctx.closePath();
      ctx.fillStyle = dark; ctx.fill();
      ctx.beginPath(); ctx.moveTo(s * r * 0.42, -r * 0.78); ctx.lineTo(s * r * 0.86, -r * 1.08); ctx.lineTo(s * r * 0.82, -r * 0.5); ctx.closePath();
      ctx.fillStyle = '#ffb3c7'; ctx.fill();
    }
  }
  // gövde
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
  g.addColorStop(0, shade(color, 0.45)); g.addColorStop(0.6, color); g.addColorStop(1, dark);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
  if (animal === 'kopek') {
    // sarkık kulaklar
    for (const s of [-1, 1]) {
      ctx.save(); ctx.translate(s * r * 0.82, -r * 0.15); ctx.rotate(s * 0.35);
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.32, r * 0.62, 0, 0, Math.PI * 2); ctx.fillStyle = dark; ctx.fill(); ctx.restore();
    }
    // ağız bölgesi
    ctx.beginPath(); ctx.ellipse(0, r * 0.38, r * 0.42, r * 0.3, 0, 0, Math.PI * 2); ctx.fillStyle = shade(color, 0.55); ctx.fill();
  }
  // gözler
  for (const s of [-1, 1]) {
    ctx.beginPath(); ctx.ellipse(s * r * 0.36, -r * 0.12, r * 0.16, r * 0.21, 0, 0, Math.PI * 2); ctx.fillStyle = '#1b1f33'; ctx.fill();
    ctx.beginPath(); ctx.arc(s * r * 0.36 + r * 0.05, -r * 0.2, r * 0.06, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
  }
  if (animal === 'kedi') {
    ctx.beginPath(); ctx.moveTo(-r * 0.1, r * 0.17); ctx.lineTo(r * 0.1, r * 0.17); ctx.lineTo(0, r * 0.3); ctx.closePath(); ctx.fillStyle = '#ff7aa2'; ctx.fill();
    ctx.strokeStyle = 'rgba(27,31,51,.55)'; ctx.lineWidth = Math.max(1, r * 0.06);
    for (const s of [-1, 1]) for (const k of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(s * r * 0.25, r * 0.3); ctx.lineTo(s * r * 0.85, r * (0.25 + k * 0.14)); ctx.stroke() }
  } else {
    ctx.beginPath(); ctx.ellipse(0, r * 0.22, r * 0.17, r * 0.12, 0, 0, Math.PI * 2); ctx.fillStyle = '#1b1f33'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, r * 0.6, r * 0.12, r * 0.16, 0, 0, Math.PI); ctx.fillStyle = '#ff6b8a'; ctx.fill();
  }
  ctx.restore();
}
