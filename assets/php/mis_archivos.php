<?php
// ════════════════════════════════════════
//  mis_archivos.php — Biblioweb
//  Devuelve los documentos del usuario
// ════════════════════════════════════════

require_once __DIR__ . '/../../../config.php';

header('Access-Control-Allow-Origin: https://bibliowebb.com.mx');
header('Content-Type: application/json; charset=utf-8');

function responder(bool $ok, string $msg, array $extra = []): void {
    echo json_encode(array_merge(['success' => $ok, 'message' => $msg], $extra));
    exit;
}

$usuario_id = (int) ($_GET['usuario_id'] ?? 0);

if (!$usuario_id) {
    responder(false, 'usuario_id requerido.');
}

// ── CONEXION A BD ──
$pdo = getDB();

try {
    $stmt = $pdo->prepare("
        SELECT id, titulo, autor, anio, institucion, area, doi,
               tipo, acceso, palabras_clave, nombre_archivo,
               url_archivo, fecha_subida
        FROM documentos
        WHERE usuario_id = :uid
        ORDER BY fecha_subida DESC
    ");
    $stmt->execute([':uid' => $usuario_id]);
    $documentos = $stmt->fetchAll();

    responder(true, 'OK', ['documentos' => $documentos]);

} catch (PDOException $e) {
    responder(false, 'Error al obtener documentos: ' . $e->getMessage());
}
