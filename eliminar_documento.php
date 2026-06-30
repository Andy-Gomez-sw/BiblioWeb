<?php
// ════════════════════════════════════════
//  eliminar_documento.php
// ════════════════════════════════════════

require_once __DIR__ . '/../config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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

$doc_id     = isset($_POST['id']) ? (int) $_POST['id'] : 0;
$usuario_id = isset($_POST['usuario_id']) ? (int) $_POST['usuario_id'] : 0;

if ($doc_id <= 0 || $usuario_id <= 0) {
    responder(false, 'Datos inválidos para eliminar.');
}

$pdo = getDB();

try {
    // 1. Verificar que el documento exista y pertenezca a este usuario
    $stmt = $pdo->prepare("SELECT ruta_pdf, usuario_id FROM documentos WHERE id = :id");
    $stmt->execute([':id' => $doc_id]);
    $doc = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$doc) {
        responder(false, 'El documento no existe.');
    }
    if ((int) $doc['usuario_id'] !== $usuario_id) {
        responder(false, 'No tienes permiso para eliminar este documento.');
    }

    // 2. Borrar el registro de la base de datos
    $del = $pdo->prepare("DELETE FROM documentos WHERE id = :id");
    $del->execute([':id' => $doc_id]);

    // 3. Borrar el archivo físico del servidor (Hostinger)
    if (!empty($doc['ruta_pdf'])) {
        $nombreArchivo = basename($doc['ruta_pdf']);
        $rutaFisica = __DIR__ . '/../uploads/documentos/' . $nombreArchivo;
        if (file_exists($rutaFisica)) {
            @unlink($rutaFisica);
        }
    }

    responder(true, 'Documento eliminado correctamente.');

} catch (PDOException $e) {
    responder(false, 'Error en Query de Base de Datos: ' . $e->getMessage());
}