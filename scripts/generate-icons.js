#!/usr/bin/env node

/**
 * Script pour générer les icônes PWA pour ZenFacture
 * Alternative au générateur HTML
 *
 * Usage: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const SIZES = [192, 512];
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'icons');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background gradient (blue)
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#2563eb');
  gradient.addColorStop(1, '#1d4ed8');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Add subtle pattern
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < size; i += 20) {
    ctx.fillRect(i, 0, 1, size);
    ctx.fillRect(0, i, size, 1);
  }

  // Center circle background
  const centerX = size / 2;
  const centerY = size / 2;
  const circleRadius = size * 0.35;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
  ctx.fill();

  // Draw "Z" letter
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.5}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = size * 0.02;
  ctx.shadowOffsetY = size * 0.01;
  ctx.fillText('Z', centerX, centerY);

  // Add decorative circle
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = size * 0.015;
  ctx.beginPath();
  ctx.arc(centerX, centerY, circleRadius * 1.2, 0, Math.PI * 2);
  ctx.stroke();

  // Add accent dots
  ctx.fillStyle = '#fbbf24';
  const dotRadius = size * 0.025;
  const dotDistance = circleRadius * 1.5;

  ctx.beginPath();
  ctx.arc(centerX + dotDistance * 0.7, centerY - dotDistance * 0.7, dotRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(centerX - dotDistance * 0.7, centerY + dotDistance * 0.7, dotRadius, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

console.log('🎨 Génération des icônes PWA pour ZenFacture...\n');

SIZES.forEach(size => {
  try {
    const canvas = createIcon(size);
    const buffer = canvas.toBuffer('image/png');
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}.png`);

    fs.writeFileSync(outputPath, buffer);
    console.log(`✅ Icône ${size}x${size} créée : ${outputPath}`);
  } catch (error) {
    console.error(`❌ Erreur lors de la création de l'icône ${size}x${size}:`, error.message);
  }
});

console.log('\n✨ Génération terminée !');
console.log(`📁 Icônes sauvegardées dans : ${OUTPUT_DIR}`);
