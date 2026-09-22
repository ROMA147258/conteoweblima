#!/usr/bin/env node

/**
 * ==============================================================================
 * HERRAMIENTA FORENSE DE VERIFICACIÓN DE FIRMA Y HUELLA DIGITAL INVISIBLE
 * Zero-Width Steganography & SHA-256 Cryptographic Verification Tool
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Caracteres Unicode de ancho cero utilizados
const ZW_CHARS = {
  START: '\uFEFF', // Zero-Width No-Break Space / BOM
  BIT_0: '\u200B', // Zero-Width Space
  BIT_1: '\u200C', // Zero-Width Non-Joiner
  END:   '\u200D'  // Zero-Width Joiner
};

/**
 * Codifica una carga útil de metadatos en una cadena esteganográfica invisible
 */
function encodeSteganography(metadata = {}) {
  const metaBase = {
    author: metadata.author || 'Leonel R. / ROMA147258',
    project: metadata.project || 'Sistema de Conteo y Verificacion Electoral - Lima',
    license: metadata.license || 'Proprietary - All Rights Reserved',
    timestamp: metadata.timestamp || '2026-09-22T19:00:00.000Z'
  };

  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(metaBase))
    .digest('hex');

  const fullPayload = {
    ...metaBase,
    sha256: hash
  };

  const jsonStr = JSON.stringify(fullPayload);
  const buffer = Buffer.from(jsonStr, 'utf8');

  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += buffer[i].toString(2).padStart(8, '0');
  }

  let zeroWidthStr = ZW_CHARS.START;
  for (let i = 0; i < binary.length; i++) {
    zeroWidthStr += binary[i] === '0' ? ZW_CHARS.BIT_0 : ZW_CHARS.BIT_1;
  }
  zeroWidthStr += ZW_CHARS.END;

  return {
    rawPayload: fullPayload,
    watermark: zeroWidthStr
  };
}

/**
 * Extrae y decodifica la firma invisible de un contenido de texto
 */
function decodeSteganography(content) {
  const regex = new RegExp(`${ZW_CHARS.START}([${ZW_CHARS.BIT_0}${ZW_CHARS.BIT_1}]+)${ZW_CHARS.END}`, 'g');
  const matches = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    const rawBits = match[1];
    let binary = '';
    for (let i = 0; i < rawBits.length; i++) {
      binary += rawBits[i] === ZW_CHARS.BIT_0 ? '0' : '1';
    }

    if (binary.length % 8 !== 0) {
      continue;
    }

    const byteCount = binary.length / 8;
    const bytes = new Uint8Array(byteCount);
    for (let i = 0; i < byteCount; i++) {
      bytes[i] = parseInt(binary.slice(i * 8, (i + 1) * 8), 2);
    }

    try {
      const decodedText = Buffer.from(bytes).toString('utf8');
      const payload = JSON.parse(decodedText);

      // Verificación de integridad criptográfica
      const { sha256: extractedHash, ...metaBase } = payload;
      const expectedHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(metaBase))
        .digest('hex');

      const isIntegrityValid = extractedHash === expectedHash;

      matches.push({
        rawTextLength: content.length,
        encodedBitsLength: rawBits.length,
        payload,
        isIntegrityValid,
        expectedHash,
        extractedHash
      });
    } catch (e) {
      // Formato no válido
    }
  }

  return matches;
}

/**
 * Inspecciona un archivo específico
 */
function inspectFile(filePath) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    return { error: `Archivo no encontrado: ${resolved}` };
  }

  const content = fs.readFileSync(resolved, 'utf8');
  const results = decodeSteganography(content);

  return {
    file: resolved,
    relativePath: path.relative(process.cwd(), resolved),
    size: content.length,
    signatures: results
  };
}

// Ejecución principal por CLI
if (require.main === module) {
  console.log('\n╔═════════════════════════════════════════════════════════════════════════════╗');
  console.log('║        AUDITORÍA FORENSE DE FIRMA DIGITAL Y HUELLA INVISIBLE (STEG)         ║');
  console.log('║                   Zero-Width Steganography & SHA-256                        ║');
  console.log('╚═════════════════════════════════════════════════════════════════════════════╝\n');

  const args = process.argv.slice(2);
  let filesToInspect = args;

  if (filesToInspect.length === 0) {
    // Archivos por defecto a inspeccionar
    const projectRoot = path.resolve(__dirname, '../..');
    filesToInspect = [
      path.join(projectRoot, 'backend', 'src', 'infrastructure', 'config', 'telemetry.js'),
      path.join(projectRoot, 'frontend', 'src', 'utils', 'systemConfig.js')
    ];
  }

  let totalSignaturesFound = 0;

  filesToInspect.forEach(targetFile => {
    const report = inspectFile(targetFile);
    console.log(`\n📄 Analizando: \x1b[36m${report.relativePath || targetFile}\x1b[0m`);

    if (report.error) {
      console.log(`   \x1b[31m✖ Error: ${report.error}\x1b[0m`);
      return;
    }

    if (!report.signatures || report.signatures.length === 0) {
      console.log(`   \x1b[33m⚠ No se detectaron firmas invisibles en este archivo.\x1b[0m`);
    } else {
      report.signatures.forEach((sig, idx) => {
        totalSignaturesFound++;
        console.log(`   \x1b[32m✔ [Firma #${idx + 1} Detectada]\x1b[0m`);
        console.log(`   ├─ Autor / Titular:    \x1b[1m${sig.payload.author}\x1b[0m`);
        console.log(`   ├─ Proyecto:           ${sig.payload.project}`);
        console.log(`   ├─ Licencia:           ${sig.payload.license}`);
        console.log(`   ├─ Fecha de Firma:     ${sig.payload.timestamp}`);
        console.log(`   ├─ Hash SHA-256:       \x1b[35m${sig.payload.sha256}\x1b[0m`);
        if (sig.isIntegrityValid) {
          console.log(`   └─ Integridad Cripto:  \x1b[32m✔ AUTÉNTICA (SHA-256 Coincide)\x1b[0m`);
        } else {
          console.log(`   └─ Integridad Cripto:  \x1b[31m✖ HASH CORRUPTO O ALTERADO\x1b[0m`);
        }
      });
    }
  });

  console.log('\n───────────────────────────────────────────────────────────────────────────────');
  console.log(`Resumen: ${totalSignaturesFound} firma(s) digital(es) autenticada(s) correctamente.`);
  console.log('───────────────────────────────────────────────────────────────────────────────\n');
}

module.exports = {
  encodeSteganography,
  decodeSteganography,
  inspectFile,
  ZW_CHARS
};
