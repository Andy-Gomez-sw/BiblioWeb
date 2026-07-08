<?php
// ════════════════════════════════════════
//  obtener_documentos.php
// ════════════════════════════════════════

require_once __DIR__ . '/../../config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function responder(bool $ok, string $msg, array $extra = []): void {
    echo json_encode(array_merge(['success' => $ok, 'message' => $msg], $extra));
    exit;
}

$usuario_id = isset($_GET['usuario_id']) ? (int) $_GET['usuario_id'] : 0;
if ($usuario_id <= 0) {
    responder(false, 'Error: Sesión de usuario inválida.');
}

$pdo = getDB();

try {
    $sql = "
        SELECT id, tipo, titulo, autor, anio_publicacion, institucion_editorial,
               area_conocimiento, doi_isbn, resumen, acceso, ruta_pdf,
               tamano_archivo, estado, creado_en
        FROM documentos
        WHERE usuario_id = :usuario_id
        ORDER BY creado_en DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':usuario_id' => $usuario_id]);
    $documentos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    responder(true, 'OK', ['documentos' => $documentos]);

} catch (PDOException $e) {
    responder(false, 'Error en Query de Base de Datos: ' . $e->getMessage());
}