<?php
// ════════════════════════════════════════
//  obtener_documento.php (uno solo, por ID)
// ════════════════════════════════════════

require_once __DIR__ . '/../../../config.php';

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

$doc_id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
if ($doc_id <= 0) {
    responder(false, 'ID de documento inválido.');
}

$pdo = getDB();

try {
    $sql = "
        SELECT id, usuario_id, tipo, titulo, autor, anio_publicacion, institucion_editorial,
               area_conocimiento, doi_isbn, resumen, acceso, ruta_pdf,
               tamano_archivo, estado, creado_en
        FROM documentos
        WHERE id = :id
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $doc_id]);
    $documento = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$documento) {
        responder(false, 'Documento no encontrado.');
    }

    responder(true, 'OK', ['documento' => $documento]);

} catch (PDOException $e) {
    responder(false, 'Error en Query de Base de Datos: ' . $e->getMessage());
}