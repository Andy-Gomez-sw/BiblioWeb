<?php
// ════════════════════════════════════════
//  obtener_recomendados.php — Documentos más vistos (populares)
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

$pdo = getDB();

try {
    $sql = "
        SELECT d.id, d.tipo, d.titulo, d.autor, d.anio_publicacion,
               COUNT(h.id) AS total_vistas
        FROM documentos d
        INNER JOIN historial_consultas h ON h.documento_id = d.id
        WHERE d.estado = 'publicado'
        GROUP BY d.id
        ORDER BY total_vistas DESC
        LIMIT 3
    ";
    $stmt = $pdo->query($sql);
    $recomendados = $stmt->fetchAll(PDO::FETCH_ASSOC);

    responder(true, 'OK', ['documentos' => $recomendados]);

} catch (PDOException $e) {
    responder(false, 'Error en Query de Base de Datos: ' . $e->getMessage());
}