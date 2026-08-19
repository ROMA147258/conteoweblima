const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5181;

// ── CREDENCIALES ADMIN ──
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin2024';
const SECRET_TOKEN = 'votoreal-secret-' + Date.now();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configuración de Conexión a SQL Server Management Studio 2022
const sqlConfig = {
  user: process.env.DB_USER || 'data',
  password: process.env.DB_PASSWORD || 'TECNOlogia2026.$',
  server: process.env.DB_SERVER || 'localhost', // Servidor de SQL Server (ej: localhost o localhost\\SQLEXPRESS)
  database: process.env.DB_NAME || 'conteo',   // Base de datos "conteo"
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

let mssql = null;
let poolPromise = null;

try {
  mssql = require('mssql');
  poolPromise = new mssql.ConnectionPool(sqlConfig)
    .connect()
    .then(pool => {
      console.log('\n======================================================');
      console.log('✅ [SQL Server 2022] Conectado exitosamente a la base de datos "conteo".');
      console.log('======================================================\n');
      return pool;
    })
    .catch(err => {
      console.warn('\n======================================================');
      console.warn('⚠️ [SQL Server 2022] No se pudo conectar a la BD "conteo":');
      console.warn('   ' + err.message);
      console.warn('------------------------------------------------------');
      console.warn('📌 CÓMO SOLUCIONARLO EN 1 PASO:');
      console.warn(' 1. Abre server.js y coloca las credenciales correctas de tu SQL Server:');
      console.warn('    user: "' + sqlConfig.user + '"');
      console.warn('    password: "TU_CONTRASEÑA_DE_SQL_SERVER"');
      console.warn(' O ejecuta esto en SSMS para habilitar el usuario sa con la clave 123456:');
      console.warn('    ALTER LOGIN sa WITH PASSWORD = \'123456\';');
      console.warn('    ALTER LOGIN sa ENABLE;');
      console.warn('======================================================\n');
      return null;
    });
} catch (e) {
  console.warn('ℹ️ [NPM] El paquete "mssql" no está instalado. Ejecuta: npm install mssql');
}

// --- PROCESADOR DE ACCIONES PARA SQL SERVER (BD: conteo) ---
async function handleSqlAction(data) {
  const action = data.action;
  if (!poolPromise) {
    return { success: false, message: 'SQL Server no está conectado en el servidor.' };
  }
  const pool = await poolPromise;
  if (!pool) {
    return { success: false, message: 'Base de datos "conteo" no disponible.' };
  }

  try {
    // LOGIN: Busca en tiempo real en Usuarios (Personeros) y Usuarios1 (Coordinadores)
    if (action === 'login') {
      const rawDni = (data.dni || '').toString().trim();
      const rawNombre = (data.nombre || '').toString().trim();

      if (rawDni === '__warmup__' || rawNombre === '__warmup__') {
        return { success: true, status: 'success', message: 'Warmup exitoso' };
      }

      if (!rawDni && !rawNombre) {
        return { success: false, status: 'error', message: 'Se requiere DNI o Nombre para iniciar sesión' };
      }

      const tieneDni = rawDni.length > 0;
      const tieneNombre = rawNombre.length > 0;

      function buildWhereClause(tieneDni, tieneNombre) {
        if (tieneDni && tieneNombre) {
          return 'dni = @dni AND nombre LIKE @nombre';
        } else if (tieneDni) {
          return 'dni = @dni';
        } else {
          return 'nombre LIKE @nombre';
        }
      }

      const whereClause = buildWhereClause(tieneDni, tieneNombre);

      // 1. Buscar en Usuarios (Personeros y Admins)
      let req = pool.request();
      if (tieneDni) req.input('dni', mssql.VarChar, rawDni);
      if (tieneNombre) req.input('nombre', mssql.VarChar, `%${rawNombre}%`);

      let res = await req.query(`
        SELECT TOP 1 * FROM dbo.Usuarios 
        WHERE ${whereClause}
      `);

      if (res.recordset.length > 0) {
        const u = res.recordset[0];
        u.origenHoja = 'Usuarios';
        return { success: true, status: 'success', usuario: u, user: u, data: u };
      }

      // 2. Buscar en Usuarios1 (Coordinadores)
      req = pool.request();
      if (tieneDni) req.input('dni', mssql.VarChar, rawDni);
      if (tieneNombre) req.input('nombre', mssql.VarChar, `%${rawNombre}%`);

      res = await req.query(`
        SELECT TOP 1 * FROM dbo.Usuarios1 
        WHERE ${whereClause}
      `);

      if (res.recordset.length > 0) {
        const u = res.recordset[0];
        u.origenHoja = 'Usuarios1';
        return { success: true, status: 'success', usuario: u, user: u, data: u };
      }

      return { success: false, status: 'error', message: 'Usuario no encontrado. Verifica tu DNI y nombre.' };
    }

    // REGISTRAR VOTOS: Guarda en tabla Votos_Detalle
    if (action === 'registrar_votos') {
      const mesaStr = (data.mesa || '').toString().trim();
      const origenStr = (data.origen || 'MANUAL').toString().trim().toUpperCase();
      const prov = data.votos ? (data.votos.provincial || {}) : {};
      const dist = data.votos ? (data.votos.distrital || {}) : {};

      const req = pool.request()
        .input('personero', mssql.VarChar, data.brigadista || '')
        .input('dni', mssql.VarChar, data.dni || '')
        .input('departamento', mssql.VarChar, data.departamento || 'Lima')
        .input('provincia', mssql.VarChar, data.provincia || 'Lima')
        .input('ubicacion', mssql.VarChar, data.ubicacion || '')
        .input('colegio', mssql.VarChar, data.colegio || '')
        .input('numero_mesa', mssql.VarChar, mesaStr)
        .input('origen', mssql.VarChar, origenStr)

        // Provincial
        .input('p_fp_cand', mssql.VarChar, prov.FP ? prov.FP.candidato : '')
        .input('p_fp_votos', mssql.Int, prov.FP ? (parseInt(prov.FP.votos) || 0) : 0)
        .input('p_jp_cand', mssql.VarChar, prov.JP ? prov.JP.candidato : '')
        .input('p_jp_votos', mssql.Int, prov.JP ? (parseInt(prov.JP.votos) || 0) : 0)
        .input('p_sp_cand', mssql.VarChar, prov["SOMOS PERU"] ? prov["SOMOS PERU"].candidato : '')
        .input('p_sp_votos', mssql.Int, prov["SOMOS PERU"] ? (parseInt(prov["SOMOS PERU"].votos) || 0) : 0)
        .input('p_frepap_cand', mssql.VarChar, prov.FREPAP ? prov.FREPAP.candidato : '')
        .input('p_frepap_votos', mssql.Int, prov.FREPAP ? (parseInt(prov.FREPAP.votos) || 0) : 0)
        .input('p_verde_cand', mssql.VarChar, prov.VERDE ? prov.VERDE.candidato : '')
        .input('p_verde_votos', mssql.Int, prov.VERDE ? (parseInt(prov.VERDE.votos) || 0) : 0)
        .input('p_morado_cand', mssql.VarChar, prov.MORADO ? prov.MORADO.candidato : '')
        .input('p_morado_votos', mssql.Int, prov.MORADO ? (parseInt(prov.MORADO.votos) || 0) : 0)
        .input('p_nulos', mssql.Int, parseInt(data.votos_nulos) || 0)
        .input('p_vacios', mssql.Int, parseInt(data.votos_vacios) || 0)

        // Distrital
        .input('d_fp_cand', mssql.VarChar, dist.FP ? dist.FP.candidato : '')
        .input('d_fp_votos', mssql.Int, dist.FP ? (parseInt(dist.FP.votos) || 0) : 0)
        .input('d_jp_cand', mssql.VarChar, dist.JP ? dist.JP.candidato : '')
        .input('d_jp_votos', mssql.Int, dist.JP ? (parseInt(dist.JP.votos) || 0) : 0)
        .input('d_sp_cand', mssql.VarChar, dist["SOMOS PERU"] ? dist["SOMOS PERU"].candidato : '')
        .input('d_sp_votos', mssql.Int, dist["SOMOS PERU"] ? (parseInt(dist["SOMOS PERU"].votos) || 0) : 0)
        .input('d_frepap_cand', mssql.VarChar, dist.FREPAP ? dist.FREPAP.candidato : '')
        .input('d_frepap_votos', mssql.Int, dist.FREPAP ? (parseInt(dist.FREPAP.votos) || 0) : 0)
        .input('d_verde_cand', mssql.VarChar, dist.VERDE ? dist.VERDE.candidato : '')
        .input('d_verde_votos', mssql.Int, dist.VERDE ? (parseInt(dist.VERDE.votos) || 0) : 0)
        .input('d_morado_cand', mssql.VarChar, dist.MORADO ? dist.MORADO.candidato : '')
        .input('d_morado_votos', mssql.Int, dist.MORADO ? (parseInt(dist.MORADO.votos) || 0) : 0)
        .input('d_nulos', mssql.Int, parseInt(data.votos_dist_nulos) || 0)
        .input('d_vacios', mssql.Int, parseInt(data.votos_dist_vacios) || 0);

      await req.query(`
        MERGE dbo.Votos_Detalle AS target
        USING (SELECT @numero_mesa AS mesa, @origen AS origen) AS source
        ON (target.numero_mesa = source.mesa AND target.origen = source.origen)
        WHEN MATCHED THEN
          UPDATE SET 
            personero = @personero, dni = @dni, departamento = @departamento, provincia = @provincia,
            ubicacion = @ubicacion, colegio = @colegio, fecha_hora = GETDATE(),
            p_fp_candidato = @p_fp_cand, p_fp_votos = @p_fp_votos,
            p_jp_candidato = @p_jp_cand, p_jp_votos = @p_jp_votos,
            p_sp_candidato = @p_sp_cand, p_sp_votos = @p_sp_votos,
            p_frepap_candidato = @p_frepap_cand, p_frepap_votos = @p_frepap_votos,
            p_verde_candidato = @p_verde_cand, p_verde_votos = @p_verde_votos,
            p_morado_candidato = @p_morado_cand, p_morado_votos = @p_morado_votos,
            p_nulos = @p_nulos, p_vacios = @p_vacios,
            p_total_votos = (@p_fp_votos + @p_jp_votos + @p_sp_votos + @p_frepap_votos + @p_verde_votos + @p_morado_votos + @p_nulos + @p_vacios),
            d_fp_candidato = @d_fp_cand, d_fp_votos = @d_fp_votos,
            d_jp_candidato = @d_jp_cand, d_jp_votos = @d_jp_votos,
            d_sp_candidato = @d_sp_cand, d_sp_votos = @d_sp_votos,
            d_frepap_candidato = @d_frepap_cand, d_frepap_votos = @d_frepap_votos,
            d_verde_candidato = @d_verde_cand, d_verde_votos = @d_verde_votos,
            d_morado_candidato = @d_morado_cand, d_morado_votos = @d_morado_votos,
            d_nulos = @d_nulos, d_vacios = @d_vacios,
            d_total_votos = (@d_fp_votos + @d_jp_votos + @d_sp_votos + @d_frepap_votos + @d_verde_votos + @d_morado_votos + @d_nulos + @d_vacios)
        WHEN NOT MATCHED THEN
          INSERT (
            personero, dni, departamento, provincia, ubicacion, colegio, numero_mesa, origen,
            p_fp_candidato, p_fp_votos, p_jp_candidato, p_jp_votos, p_sp_candidato, p_sp_votos,
            p_frepap_candidato, p_frepap_votos, p_verde_candidato, p_verde_votos, p_morado_candidato, p_morado_votos,
            p_nulos, p_vacios, p_total_votos,
            d_fp_candidato, d_fp_votos, d_jp_candidato, d_jp_votos, d_sp_candidato, d_sp_votos,
            d_frepap_candidato, d_frepap_votos, d_verde_candidato, d_verde_votos, d_morado_candidato, d_morado_votos,
            d_nulos, d_vacios, d_total_votos
          )
          VALUES (
            @personero, @dni, @departamento, @provincia, @ubicacion, @colegio, @numero_mesa, @origen,
            @p_fp_cand, @p_fp_votos, @p_jp_cand, @p_jp_votos, @p_sp_cand, @p_sp_votos,
            @p_frepap_cand, @p_frepap_votos, @p_verde_cand, @p_verde_votos, @p_morado_cand, @p_morado_votos,
            @p_nulos, @p_vacios, (@p_fp_votos + @p_jp_votos + @p_sp_votos + @p_frepap_votos + @p_verde_votos + @p_morado_votos + @p_nulos + @p_vacios),
            @d_fp_cand, @d_fp_votos, @d_jp_cand, @d_jp_votos, @d_sp_cand, @d_sp_votos,
            @d_frepap_cand, @d_frepap_votos, @d_verde_cand, @d_verde_votos, @d_morado_cand, @d_morado_votos,
            @d_nulos, @d_vacios, (@d_fp_votos + @d_jp_votos + @d_sp_votos + @d_frepap_votos + @d_verde_votos + @d_morado_votos + @d_nulos + @d_vacios)
          );
      `);
      return { success: true, message: 'Votos registrados correctamente en la base de datos "conteo".' };
    }

    // REGISTRAR ASISTENCIA: UPSERT en tabla Asistencia
    if (action === 'registrar_asistencia') {
      await pool.request()
        .input('nombre', mssql.VarChar, data.nombre || '')
        .input('dni', mssql.VarChar, data.dni || '')
        .input('distrito', mssql.VarChar, data.distrito || '')
        .input('local', mssql.VarChar, data.local || '')
        .input('mesa', mssql.VarChar, data.mesa || '')
        .input('confirmacion', mssql.VarChar, data.confirmacion || 'SI')
        .input('foto_url', mssql.NVarChar, data.fotoBase64 || '')
        .input('ubicacion_gps', mssql.VarChar, data.ubicacionGps || '')
        .query(`
          MERGE dbo.Asistencia AS target
          USING (SELECT @dni AS dni) AS source
          ON (target.dni = source.dni)
          WHEN MATCHED THEN
            UPDATE SET
              nombre        = @nombre,
              distrito      = @distrito,
              local         = @local,
              mesa          = @mesa,
              confirmacion  = @confirmacion,
              foto_url      = CASE WHEN @foto_url != '' THEN @foto_url ELSE target.foto_url END,
              ubicacion_gps = CASE WHEN @ubicacion_gps != '' THEN @ubicacion_gps ELSE target.ubicacion_gps END,
              fecha_hora    = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (nombre, dni, distrito, local, mesa, confirmacion, foto_url, ubicacion_gps)
            VALUES (@nombre, @dni, @distrito, @local, @mesa, @confirmacion, @foto_url, @ubicacion_gps);
        `);
      return { success: true, message: 'Asistencia registrada correctamente.' };
    }

    // CONFIRMAR LLEGADA
    if (action === 'confirmar_asistencia_llegada') {
      await pool.request()
        .input('nombre', mssql.VarChar, data.nombre || '')
        .input('dni', mssql.VarChar, data.dni || '')
        .input('distrito', mssql.VarChar, data.distrito || '')
        .input('colegio', mssql.VarChar, data.colegio || data.local || '')
        .input('mesa', mssql.VarChar, data.mesa || '')
        .input('latitud', mssql.VarChar, (data.lat || '').toString())
        .input('longitud', mssql.VarChar, (data.lon || '').toString())
        .query(`
          INSERT INTO dbo.AsistenciaLlegada (nombre, dni, distrito, colegio, mesa, latitud, longitud)
          VALUES (@nombre, @dni, @distrito, @colegio, @mesa, @latitud, @longitud)
        `);
      return { success: true, message: 'Llegada registrada correctamente.' };
    }

    // CONFIRMAR COORDINADOR: UPSERT en tabla Coordinadores
    if (action === 'confirmar_coordinador') {
      await pool.request()
        .input('p_nom', mssql.VarChar, data.personeroNombre || '')
        .input('p_dni', mssql.VarChar, data.personeroDni || '')
        .input('distrito', mssql.VarChar, data.distrito || '')
        .input('local', mssql.VarChar, data.local || '')
        .input('c_nom', mssql.VarChar, data.coordinadorNombre || '')
        .input('c_dni', mssql.VarChar, data.coordinadorDni || '')
        .input('confirmacion', mssql.VarChar, data.confirmacion || 'SI')
        .input('foto_url', mssql.NVarChar, data.fotoBase64 || '')
        .query(`
          MERGE dbo.Coordinadores AS target
          USING (SELECT @p_dni AS personero_dni) AS source
          ON (target.personero_dni = source.personero_dni)
          WHEN MATCHED THEN
            UPDATE SET
              confirmacion       = @confirmacion,
              personero_nombre   = @p_nom,
              coordinador_nombre = @c_nom,
              coordinador_dni    = @c_dni,
              distrito           = @distrito,
              local              = @local,
              foto_url           = @foto_url,
              fecha_hora         = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (personero_nombre, personero_dni, distrito, local, coordinador_nombre, coordinador_dni, confirmacion, foto_url)
            VALUES (@p_nom, @p_dni, @distrito, @local, @c_nom, @c_dni, @confirmacion, @foto_url);
        `);
      return { success: true, message: 'Verificación de coordinador guardada.' };
    }

    // OBTENER USUARIOS: Consolida Usuarios (Personeros) y Usuarios1 (Coordinadores)
    if (action === 'obtener_usuarios' || action === 'read') {
      const res = await pool.request().query(`
        SELECT dni, nombre, rol, ubicacion, colegio, mesa, 'Usuarios' AS origenHoja FROM dbo.Usuarios
        UNION ALL
        SELECT dni, nombre, rol, ubicacion, colegio, mesa, 'Usuarios1' AS origenHoja FROM dbo.Usuarios1
        ORDER BY nombre ASC
      `);
      return { success: true, usuarios: res.recordset, data: res.recordset };
    }

    // OBTENER ASISTENCIA (Personeros: padrón Usuarios + registros Asistencia)
    if (action === 'obtener_asistencia') {
      try {
        const res = await pool.request().query(`
          SELECT 
            u.dni, 
            u.nombre, 
            u.ubicacion AS distrito, 
            u.colegio AS [local], 
            u.mesa, 
            a.fecha_hora AS fechaHora, 
            a.foto_url AS foto, 
            a.ubicacion_gps AS ubicacionGps,
            ISNULL(a.confirmacion, 'PENDIENTE') AS confirmacion,
            ISNULL(a.confirmacion, 'PENDIENTE') AS confirmacion1,
            'PENDIENTE' AS confirmacion2
          FROM dbo.Usuarios u
          LEFT JOIN dbo.Asistencia a ON u.dni = a.dni
          UNION
          SELECT 
            a.dni, 
            a.nombre, 
            a.distrito, 
            a.[local], 
            a.mesa, 
            a.fecha_hora AS fechaHora, 
            a.foto_url AS foto, 
            a.ubicacion_gps AS ubicacionGps, 
            a.confirmacion, 
            a.confirmacion AS confirmacion1, 
            'PENDIENTE' AS confirmacion2
          FROM dbo.Asistencia a
          WHERE NOT EXISTS (SELECT 1 FROM dbo.Usuarios u WHERE u.dni = a.dni)
          ORDER BY nombre ASC
        `);
        return { success: true, asistencia: res.recordset, data: res.recordset };
      } catch (e) {
        const resFallback = await pool.request().query('SELECT * FROM dbo.Asistencia ORDER BY fecha_hora DESC');
        return { success: true, asistencia: resFallback.recordset, data: resFallback.recordset };
      }
    }

    // OBTENER COORDINADORES (Coordinadores + Personeros asignados del mismo colegio)
    if (action === 'obtener_coordinadores') {
      try {
        const coordsRes = await pool.request().query(`
          SELECT 
            ISNULL(c.id, ROW_NUMBER() OVER(ORDER BY coord.nombre, u.nombre)) AS id,
            ISNULL(c.fecha_hora, a.fecha_hora) AS fechaHora,
            u.nombre AS personeroNombre,
            u.dni AS personeroDni,
            ISNULL(u.ubicacion, coord.ubicacion) AS distrito,
            ISNULL(u.colegio, coord.colegio) AS [local],
            coord.nombre AS coordinadorNombre,
            coord.dni AS coordinadorDni,
            ISNULL(u.mesa, a.mesa) AS mesa,
            ISNULL(c.confirmacion, ISNULL(a.confirmacion, 'PENDIENTE')) AS confirmacion,
            ISNULL(c.foto_url, a.foto_url) AS foto_url
          FROM dbo.Usuarios1 coord
          INNER JOIN dbo.Usuarios u ON (
            LTRIM(RTRIM(LOWER(coord.colegio))) = LTRIM(RTRIM(LOWER(u.colegio)))
            OR (ISNULL(coord.colegio, '') = '' AND LTRIM(RTRIM(LOWER(coord.ubicacion))) = LTRIM(RTRIM(LOWER(u.ubicacion))))
          )
          LEFT JOIN dbo.Asistencia a ON u.dni = a.dni
          LEFT JOIN dbo.Coordinadores c ON u.dni = c.personero_dni
          UNION
          SELECT 
            c.id,
            c.fecha_hora AS fechaHora,
            c.personero_nombre AS personeroNombre,
            c.personero_dni AS personeroDni,
            c.distrito,
            c.[local],
            c.coordinador_nombre AS coordinadorNombre,
            c.coordinador_dni AS coordinadorDni,
            a.mesa,
            c.confirmacion,
            c.foto_url
          FROM dbo.Coordinadores c
          LEFT JOIN dbo.Asistencia a ON c.personero_dni = a.dni
          WHERE NOT EXISTS (
            SELECT 1 FROM dbo.Usuarios u 
            INNER JOIN dbo.Usuarios1 coord ON LTRIM(RTRIM(LOWER(coord.colegio))) = LTRIM(RTRIM(LOWER(u.colegio)))
            WHERE u.dni = c.personero_dni
          )
          ORDER BY coordinadorNombre ASC, personeroNombre ASC
        `);
        return { success: true, coordinadores: coordsRes.recordset, data: coordsRes.recordset };
      } catch (e) {
        const resFallback = await pool.request().query('SELECT * FROM dbo.Coordinadores ORDER BY fecha_hora DESC');
        return { success: true, coordinadores: resFallback.recordset, data: resFallback.recordset };
      }
    }

    // SINCRONIZACIÓN RÁPIDA PERSONERO
    if (action === 'obtener_asistencia_por_dni') {
      const dniQuery = (data.dni || '').toString().trim();
      if (!dniQuery) return { success: false, message: 'Se requiere DNI' };
      const res = await pool.request()
        .input('dni', mssql.VarChar, dniQuery)
        .query('SELECT TOP 1 * FROM dbo.Asistencia WHERE dni = @dni ORDER BY fecha_hora DESC');
      return { success: true, asistencia: res.recordset[0] || null };
    }

    // SINCRONIZACIÓN RÁPIDA COORDINADOR POR COLEGIO (Todos los personeros del mismo colegio)
    if (action === 'obtener_confirmaciones_por_colegio') {
      const colegioQuery = (data.colegio || '').toString().trim();
      if (!colegioQuery) return { success: false, message: 'Se requiere colegio' };
      const res = await pool.request()
        .input('local', mssql.VarChar, colegioQuery)
        .query(`
          SELECT 
            u.dni AS personero_dni,
            u.nombre AS personero_nombre,
            u.ubicacion AS distrito,
            u.colegio AS [local],
            u.mesa AS personero_mesa,
            ISNULL(c.confirmacion, ISNULL(a.confirmacion, 'PENDIENTE')) AS confirmacion,
            ISNULL(c.foto_url, a.foto_url) AS foto_url,
            ISNULL(c.coordinador_nombre, '') AS coordinador_nombre,
            ISNULL(c.coordinador_dni, '') AS coordinador_dni,
            ISNULL(c.fecha_hora, a.fecha_hora) AS fecha_hora
          FROM dbo.Usuarios u
          LEFT JOIN dbo.Asistencia a ON u.dni = a.dni
          LEFT JOIN dbo.Coordinadores c ON u.dni = c.personero_dni
          WHERE LTRIM(RTRIM(LOWER(u.colegio))) = LTRIM(RTRIM(LOWER(@local)))
             OR LTRIM(RTRIM(LOWER(a.[local]))) = LTRIM(RTRIM(LOWER(@local)))
             OR LTRIM(RTRIM(LOWER(c.[local]))) = LTRIM(RTRIM(LOWER(@local)))
          ORDER BY u.nombre ASC
        `);
      return { success: true, confirmaciones: res.recordset };
    }

    // OBTENER MESAS DE ESTRUCTURA Y DE VOTOS
    if (action === 'obtener_mesas') {
      const res = await pool.request().query(`
        SELECT DISTINCT numero_mesa AS mesa, ubicacion AS distrito, colegio FROM dbo.Votos_Detalle WHERE numero_mesa IS NOT NULL AND numero_mesa != ''
        UNION
        SELECT DISTINCT numero_mesa AS mesa, distrito, colegio FROM dbo.Mesas WHERE numero_mesa IS NOT NULL AND numero_mesa != ''
        UNION
        SELECT DISTINCT mesa, ubicacion AS distrito, colegio FROM dbo.Usuarios WHERE mesa IS NOT NULL AND mesa != ''
      `);
      return { success: true, mesas: res.recordset };
    }

    // OBTENER REPORTE
    if (action === 'obtener_reporte' || action === 'read_reporte') {
      const reportRes = await pool.request().query(`
        SELECT 
          ISNULL(SUM(p_fp_votos), 0) AS FP, ISNULL(SUM(p_jp_votos), 0) AS JP, ISNULL(SUM(p_sp_votos), 0) AS [SOMOS PERU], 
          ISNULL(SUM(p_frepap_votos), 0) AS FREPAP, ISNULL(SUM(p_verde_votos), 0) AS VERDE, ISNULL(SUM(p_morado_votos), 0) AS MORADO,
          ISNULL(SUM(p_nulos), 0) AS NULOS, ISNULL(SUM(p_vacios), 0) AS VACIOS
        FROM dbo.Votos_Detalle
      `);

      const distRes = await pool.request().query(`
        SELECT 
          ISNULL(SUM(d_fp_votos), 0) AS FP, ISNULL(SUM(d_jp_votos), 0) AS JP, ISNULL(SUM(d_sp_votos), 0) AS [SOMOS PERU], 
          ISNULL(SUM(d_frepap_votos), 0) AS FREPAP, ISNULL(SUM(d_verde_votos), 0) AS VERDE, ISNULL(SUM(d_morado_votos), 0) AS MORADO,
          ISNULL(SUM(d_nulos), 0) AS NULOS, ISNULL(SUM(d_vacios), 0) AS VACIOS
        FROM dbo.Votos_Detalle
      `);

      const mesasRes = await pool.request().query(`
        SELECT 
          numero_mesa AS mesa, 
          origen, 
          ubicacion, 
          colegio, 
          personero AS brigadista,
          fecha_hora AS fecha,
          p_fp_votos, p_jp_votos, p_sp_votos, p_frepap_votos, p_verde_votos, p_morado_votos, p_nulos, p_vacios,
          d_fp_votos, d_jp_votos, d_sp_votos, d_frepap_votos, d_verde_votos, d_morado_votos, d_nulos, d_vacios
        FROM dbo.Votos_Detalle
      `);

      // Formatear filas de mesas para la vista web
      const mesasFormatted = (mesasRes.recordset || []).map(r => ({
        mesa: r.mesa,
        origen: r.origen,
        ubicacion: r.ubicacion,
        colegio: r.colegio,
        brigadista: r.brigadista,
        fecha: r.fecha,
        votos_provincial: {
          FP: r.p_fp_votos, JP: r.p_jp_votos, SP: r.p_sp_votos,
          FREPAP: r.p_frepap_votos, VERDE: r.p_verde_votos, MORADO: r.p_morado_votos,
          votos_nulos: r.p_nulos, votos_vacios: r.p_vacios
        },
        votos_distrital: {
          FP: r.d_fp_votos, JP: r.d_jp_votos, SP: r.d_sp_votos,
          FREPAP: r.d_frepap_votos, VERDE: r.d_verde_votos, MORADO: r.d_morado_votos,
          votos_dist_nulos: r.d_nulos, votos_dist_vacios: r.d_vacios
        }
      }));

      let mesasEstructura = [];
      try {
        const estRes = await pool.request().query(`
          SELECT DISTINCT numero_mesa AS mesa, ubicacion AS distrito, provincia, colegio FROM dbo.Votos_Detalle WHERE numero_mesa IS NOT NULL AND numero_mesa != ''
          UNION
          SELECT DISTINCT numero_mesa AS mesa, distrito, provincia, colegio FROM dbo.Mesas WHERE numero_mesa IS NOT NULL AND numero_mesa != ''
          UNION
          SELECT DISTINCT mesa, ubicacion AS distrito, 'Lima' AS provincia, colegio FROM dbo.Usuarios WHERE mesa IS NOT NULL AND mesa != ''
          UNION
          SELECT DISTINCT mesa, ubicacion AS distrito, 'Lima' AS provincia, colegio FROM dbo.Usuarios1 WHERE mesa IS NOT NULL AND mesa != ''
        `);
        mesasEstructura = estRes.recordset || [];
      } catch (_) {
        try {
          const estRes2 = await pool.request().query('SELECT numero_mesa AS mesa, distrito, provincia, colegio FROM dbo.Mesas');
          mesasEstructura = estRes2.recordset || [];
        } catch (_) {}
      }

      return {
        success: true,
        totales_provincial: reportRes.recordset[0] || {},
        totales_distrital: distRes.recordset[0] || {},
        mesas: mesasFormatted,
        mesas_estructura: mesasEstructura,
        mesas_escrutadas: mesasFormatted.length
      };
    }

    return { success: false, message: `Acción '${action}' no reconocida` };
  } catch (err) {
    console.error(`[SQL Error] Error ejecutando '${action}':`, err);
    return { success: false, message: 'Error en SQL Server: ' + err.message };
  }
}

// ── RUTAS PRINCIPALES DE LA APLICACIÓN WEB ──
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'login.html'));
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'index.html'));
});

app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'settings.html'));
});

// ── API AUTH ──
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true, token: SECRET_TOKEN, user: 'Administrador' });
  } else {
    res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
  }
});

app.post('/api/logout', (req, res) => {
  res.json({ success: true });
});

// ── API CONFIG ──
app.get('/api/config', (req, res) => {
  const configPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      res.json(JSON.parse(fs.readFileSync(configPath, 'utf8')));
      return;
    } catch (_) {}
  }
  res.json({ apiUrl: `/api/voto-real`, theme: 'dark', dashboardLayout: [] });
});

app.post('/api/config', (req, res) => {
  const configPath = path.join(__dirname, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

// ── ENDPOINTS DE ACCIONES SQL SERVER (Aceptan GET y POST) ──
const handleApiRequest = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  let payload = {};

  if (req.method === 'GET') {
    payload = req.query || {};
  } else {
    payload = Object.assign({}, req.query || {}, req.body || {});
  }

  if (!payload.action) {
    payload.action = 'obtener_reporte';
  }

  try {
    const result = await handleSqlAction(payload);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ success: false, status: 'error', message: 'Error interno: ' + e.message });
  }
};

app.all('/api/voto-real', handleApiRequest);
app.all('/api/voto-real/', handleApiRequest);
app.all('/api/sheets/sync', handleApiRequest);
app.all('/api/sql', handleApiRequest);

// ── ARCHIVOS ESTÁTICOS ──
app.use(express.static(path.join(__dirname, 'web')));

// ── ARRANCAR SERVIDOR ──
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n======================================================');
  console.log('🗳️  Servidor SQL Server 2022 (BD: conteo) - Puerto ' + PORT);
  console.log('======================================================\n');
  console.log(`💻 Endpoint SQL Server: http://localhost:${PORT}/api/voto-real`);
  console.log(`📱 Panel Web Electoral: http://localhost:${PORT}/app\n`);
  console.log('======================================================\n');
});
