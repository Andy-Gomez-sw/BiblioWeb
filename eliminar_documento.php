<?php
// ════════════════════════════════════════
//  eliminar_documento.php — Biblioweb
//  Elimina un documento del usuario
// ════════════════════════════════════════

require_once __DIR__ . '/../config.php';

header('Access-Control-Allow-Origin: https://bibliowebb.com.mx');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

function responder(bool $ok, string $msg): void {
    echo json_encode(['success' => $ok, 'message' => $msg]);
    exit;
}

$body       = json_decode(file_get_contents('php://input'), true);
$id         = (int) ($body['id']         ?? 0);
$usuario_id = (int) ($body['usuario_id'] ?? 0);

if (!$id || !$usuario_id) {
    responder(false, 'Datos incompletos.');
}

// ── CONEXION A BD ──
$pdo = getDB();

try {
    // Primero obtenemos el nombre del archivo para borrarlo del servidor
    $stmt = $pdo->prepare("SELECT nombre_archivo FROM documentos WHERE id = :id AND usuario_id = :uid");
    $stmt->execute([':id' => $id, ':uid' => $usuario_id]);
    $doc = $stmt->fetch();

    if (!$doc) {
        responder(false, 'Documento no encontrado o no tienes permiso.');
    }

    // Eliminar de BD
    $del = $pdo->prepare("DELETE FROM documentos WHERE id = :id AND usuario_id = :uid");
    $del->execute([':id' => $id, ':uid' => $usuario_id]);

    // Eliminar archivo físico
    $rutaArchivo = __DIR__ . '/../uploads/documentos/' . $doc['nombre_archivo'];
    if (file_exists($rutaArchivo)) {
        @unlink($rutaArchivo);
    }

    responder(true, 'Documento eliminado correctamente.');

} catch (PDOException $e) {
    responder(false, 'Error al eliminar: ' . $e->getMessage());
}
