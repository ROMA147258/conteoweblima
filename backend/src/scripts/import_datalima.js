const fs = require('fs');
const path = require('path');
const { query } = require('../infrastructure/database/postgresPool');

async function importData() {
  console.log('--- Iniciando Importación de datalima.md ---');
  const filePath = path.resolve(__dirname, '../../datalima.md');
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  console.log(`Leídas ${lines.length} líneas.`);

  // 1. Quitar la restricción única de colegio (porque un mismo nombre de colegio puede existir en diferentes distritos)
  await query('ALTER TABLE colegios DROP CONSTRAINT IF EXISTS colegios_colegio_key');

  // Asegurar columnas ubigeo, departamento, provincia, direccion
  await query(`ALTER TABLE colegios ADD COLUMN IF NOT EXISTS ubigeo VARCHAR(50)`);
  await query(`ALTER TABLE colegios ADD COLUMN IF NOT EXISTS departamento VARCHAR(100)`);
  await query(`ALTER TABLE colegios ADD COLUMN IF NOT EXISTS provincia VARCHAR(100)`);
  await query(`ALTER TABLE colegios ADD COLUMN IF NOT EXISTS direccion TEXT`);

  // Preservar coordenadas existentes por (distrito + colegio)
  const existingCoords = await query('SELECT LOWER(TRIM(distrito)) AS distrito, LOWER(TRIM(colegio)) AS colegio, latitud, longitud, coordenadas_gps FROM colegios WHERE latitud IS NOT NULL');
  const coordsMap = new Map();
  existingCoords.rows.forEach(r => {
    const key = `${r.distrito || ''}_${r.colegio || ''}`;
    if (r.latitud) {
      coordsMap.set(key, { lat: r.latitud, lng: r.longitud, gps: r.coordenadas_gps });
    }
  });
  console.log(`Guardadas ${coordsMap.size} coordenadas previas.`);

  // Vaciar tabla colegios y reinsertar los datos completos de datalima.md
  await query('TRUNCATE TABLE colegios RESTART IDENTITY CASCADE');

  let insertedCount = 0;
  let totalMesas = 0;

  // Insertar en lotes de 100
  const batchSize = 100;
  let valuesBatch = [];
  let paramsBatch = [];
  let pIdx = 1;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split('\t').map(s => s.trim());
    if (parts.length < 8) continue;

    const [num, ubigeo, dpto, prov, distrito, colegio, direccion, mesasStr] = parts;
    const numMesas = parseInt(mesasStr, 10) || 0;
    totalMesas += numMesas;

    const key = `${distrito.toLowerCase().trim()}_${colegio.toLowerCase().trim()}`;
    const savedCoord = coordsMap.get(key);
    const lat = savedCoord ? savedCoord.lat : null;
    const lng = savedCoord ? savedCoord.lng : null;
    const gps = savedCoord ? savedCoord.gps : (lat && lng ? `Lat: ${lat}, Lng: ${lng}` : '');

    valuesBatch.push(`($${pIdx}, $${pIdx+1}, $${pIdx+2}, $${pIdx+3}, $${pIdx+4}, $${pIdx+5}, $${pIdx+6}, $${pIdx+7}, $${pIdx+8}, $${pIdx+9})`);
    paramsBatch.push(ubigeo, dpto, prov, distrito, colegio, direccion, numMesas, lat, lng, gps);
    pIdx += 10;
    insertedCount++;

    if (valuesBatch.length >= batchSize || i === lines.length - 1) {
      const insertSql = `
        INSERT INTO colegios (ubigeo, departamento, provincia, distrito, colegio, direccion, num_mesas, latitud, longitud, coordenadas_gps)
        VALUES ${valuesBatch.join(', ')}
      `;
      await query(insertSql, paramsBatch);
      valuesBatch = [];
      paramsBatch = [];
      pIdx = 1;
    }
  }

  console.log(`\n========================================`);
  console.log(`✅ IMPORTACIÓN COMPLETADA:`);
  console.log(`- Locales / Colegios insertados: ${insertedCount}`);
  console.log(`- Total Mesas (Personeros esperados) sumados: ${totalMesas}`);
  console.log(`========================================\n`);

  // Verificar en base de datos
  const verifyRes = await query('SELECT COUNT(*) AS total_locales, SUM(num_mesas) AS total_mesas, COUNT(DISTINCT distrito) AS total_distritos FROM colegios');
  console.log('Verificación en BD:', verifyRes.rows[0]);

  process.exit(0);
}

importData().catch(err => {
  console.error('Error importando:', err);
  process.exit(1);
});
