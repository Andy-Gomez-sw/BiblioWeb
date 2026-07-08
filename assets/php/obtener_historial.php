<?php
// ════════════════════════════════════════
//  obtener_historial.php
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
    // Trae la consulta MÁS RECIENTE de cada documento (evita duplicados si lo viste varias veces)
    $sql = "
        SELECT d.id, d.tipo, d.titulo, d.autor, d.anio_publicacion, d.institucion_editorial,
               d.area_conocimiento, d.doi_isbn, d.resumen, d.acceso, d.ruta_pdf,
               d.tamano_archivo, d.estado, MAX(h.consultado_en) AS consultado_en
        FROM historial_consultas h
        INNER JOIN documentos d ON d.id = h.documento_id
        WHERE h.usuario_id = :uid
        GROUP BY d.id
        ORDER BY consultado_en DESC
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':uid' => $usuario_id]);
    $historial = $stmt->fetchAll(PDO::FETCH_ASSOC);

    responder(true, 'OK', ['documentos' => $historial]);

} catch (PDOException $e) {
    responder(false, 'Error en Query de Base de Datos: ' . $e->getMessage());
}