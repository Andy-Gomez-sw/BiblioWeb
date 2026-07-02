<?php
// ════════════════════════════════════════
//  guardar_cita.php
// ════════════════════════════════════════

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config.php';

$input = json_decode(file_get_contents('php://input'), true);

// ── VALIDACIÓN BÁSICA ──
$usuario_id = (int) ($_GET['usuario_id'] ?? 0);

if (!$usuario_id) {
    responder(false, 'usuario_id requerido.');
}
$titulo    = trim($input['titulo'] ?? '');
$autor     = trim($input['autor'] ?? '');
$anio      = $input['anio'] ?? null;

if (!$usuario_id || $titulo === '' || $autor === '') {
    echo json_encode(['success' => false, 'message' => 'Faltan datos obligatorios (usuario, título o autor).']);
    exit;
}

$pdo = getDB();

try {
    $stmt = $pdo->prepare("
        INSERT INTO citas
            (usuario_id, tipo_documento, titulo, autor, anio, editorial, ciudad, doi, cita_formateada, nombre_archivo, extension)
        VALUES
            (:usuario_id, :tipo, :titulo, :autor, :anio, :editorial, :ciudad, :doi, :cita_formateada, :nombre_archivo, :extension)
    ");

    $stmt->execute([
        ':usuario_id'      => $usuario_id,
        ':tipo'            => $input['tipo'] ?? 'libro',
        ':titulo'          => $titulo,
        ':autor'           => $autor,
        ':anio'            => $anio ?: null,
        ':editorial'       => $input['editorial'] ?? null,
        ':ciudad'          => $input['ciudad'] ?? null,
        ':doi'             => $input['doi'] ?? null,
        ':cita_formateada' => $input['cita_formateada'] ?? '',
        ':nombre_archivo'  => $input['nombre_archivo'] ?? null,
        ':extension'       => $input['extension'] ?? null,
    ]);

    $citaId = $pdo->lastInsertId();

    // ── REGISTRAR LA CONSULTA (creación) ──
    $stmtLog = $pdo->prepare("
        INSERT INTO citas_consultas (cita_id, usuario_id, accion)
        VALUES (:cita_id, :usuario_id, 'generada')
    ");
    $stmtLog->execute([
        ':cita_id'    => $citaId,
        ':usuario_id' => $usuario_id,
    ]);

    echo json_encode(['success' => true, 'id' => $citaId]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error al guardar la cita.']);
    error_log('Error guardar_cita: ' . $e->getMessage());
}