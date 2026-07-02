<?php
// ════════════════════════════════════════
//  obtener_catalogo.php
// ════════════════════════════════════════

require_once __DIR__ . '/../config.php';

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
        SELECT id, tipo, titulo, autor, anio_publicacion, institucion_editorial,
               area_conocimiento, doi_isbn, resumen, acceso, ruta_pdf,
               tamano_archivo, estado, creado_en
        FROM documentos
        -- WHERE estado = 'aprobado'
        ORDER BY creado_en DESC
    ";
    $stmt = $pdo->query($sql);
    $documentos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Conteo por tipo,
    $conteo = ['tesis' => 0, 'articulo' => 0, 'libro' => 0];
    $sqlConteo = "SELECT tipo, COUNT(*) AS total FROM documentos GROUP BY tipo";
    $stmtConteo = $pdo->query($sqlConteo);
    foreach ($stmtConteo->fetchAll(PDO::FETCH_ASSOC) as $row) {
        if (isset($conteo[$row['tipo']])) {
            $conteo[$row['tipo']] = (int) $row['total'];
        }
    }

    responder(true, 'OK', [
        'documentos' => $documentos,
        'conteo' => $conteo
    ]);

} catch (PDOException $e) {
    responder(false, 'Error en Query de Base de Datos: ' . $e->getMessage());
}