<?php
// ════════════════════════════════════════
//  citas.php
// ════════════════════════════════════════

header('Content-Type: application/json; charset=utf-8');

// ── VALIDACIÓN BÁSICA ──
if (!isset($_FILES['archivo']) || $_FILES['archivo']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'No se recibió ningún archivo válido.']);
    exit;
}

$archivo   = $_FILES['archivo'];
$tipoDoc   = $_POST['tipo'] ?? 'libro';
$extension = strtolower(pathinfo($archivo['name'], PATHINFO_EXTENSION));
$tmpPath   = $archivo['tmp_name'];

if (!in_array($extension, ['pdf', 'docx'])) {
    echo json_encode(['success' => false, 'message' => 'Formato no soportado. Usa PDF o DOCX.']);
    exit;
}

if ($archivo['size'] > 50 * 1024 * 1024) {
    echo json_encode(['success' => false, 'message' => 'El archivo excede el límite de 50 MB.']);
    exit;
}

require __DIR__ . '/vendor/autoload.php'; // Composer: smalot/pdfparser

// ── EXTRAER TEXTO SEGÚN EL TIPO DE ARCHIVO ──
function extraerTextoPDF($path) {
    try {
        $parser    = new \Smalot\PdfParser\Parser();
        $documento = $parser->parseFile($path);

        $paginas = $documento->getPages();
        $texto   = '';
        foreach (array_slice($paginas, 0, 3) as $pagina) {
            $texto .= $pagina->getText() . "\n";
        }
        return $texto;
    } catch (\Exception $e) {
        return '';
    }
}

function extraerTextoDOCX($path) {
    // DOCX es un ZIP; el texto principal vive en word/document.xml
    $zip = new ZipArchive();
    if ($zip->open($path) !== true) return '';

    $xml = $zip->getFromName('word/document.xml');
    $zip->close();
    if (!$xml) return '';

    $texto = strip_tags(str_replace('</w:p>', "\n", $xml));
    return html_entity_decode($texto, ENT_QUOTES, 'UTF-8');
}

$textoCompleto = $extension === 'pdf' ? extraerTextoPDF($tmpPath) : extraerTextoDOCX($tmpPath);

if (trim($textoCompleto) === '') {
    echo json_encode([
        'success' => false,
        'message' => 'No se pudo extraer texto del documento (¿es un escaneo sin OCR?).'
    ]);
    exit;
}

// Solo analizamos las primeras ~4000 caracteres: portada y datos editoriales
$textoInicio = mb_substr($textoCompleto, 0, 4000);
$lineas      = array_values(array_filter(array_map('trim', explode("\n", $textoInicio))));

// ── HEURÍSTICAS DE DETECCIÓN ──

function detectarAnio($texto) {
    // Busca un año de 4 dígitos razonable (1900-2029), prioriza el primero que aparezca
    if (preg_match('/\b(19[5-9]\d|20[0-2]\d)\b/', $texto, $m)) {
        return $m[1];
    }
    return null;
}

function detectarDOI($texto) {
    if (preg_match('/\b(10\.\d{4,9}\/[^\s"<>]+)/i', $texto, $m)) {
        return rtrim($m[1], '.,;)');
    }
    return null;
}

function detectarISBN($texto) {
    if (preg_match('/\bISBN[:\s-]*((?:97[89][-\s]?)?\d[\d\-\s]{8,16}\d)\b/i', $texto, $m)) {
        return preg_replace('/[\s-]/', '', $m[1]);
    }
    return null;
}

function detectarTitulo($lineas) {
    // Heurística simple: la primera línea "larga" (evita encabezados cortos,
    // números de página sueltos o membretes de una sola palabra)
    foreach ($lineas as $linea) {
        $len = mb_strlen($linea);
        if ($len >= 15 && $len <= 200 && !preg_match('/^\d+$/', $linea)) {
            return $linea;
        }
    }
    return null;
}

function detectarAutor($lineas) {
    // Busca patrones típicos: "Por: Nombre Apellido" o una línea corta
    // cerca del inicio que parezca un nombre propio (2-4 palabras, con mayúsculas)
    foreach ($lineas as $linea) {
        if (preg_match('/^(?:por|autor(?:a)?|de)\s*[:.]?\s*(.+)$/i', $linea, $m)) {
            return trim($m[1]);
        }
    }
    foreach (array_slice($lineas, 0, 15) as $linea) {
        if (preg_match('/^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3})$/u', $linea)) {
            return $linea;
        }
    }
    return null;
}

function detectarEditorial($texto) {
    // Lista corta de editoriales comunes en habla hispana; amplíala según tu público
    $conocidas = [
        'Fondo de Cultura Económica', 'Siglo XXI', 'Alianza Editorial',
        'Planeta', 'Anagrama', 'Tusquets', 'Debate', 'Paidós',
        'Universidad Nacional Autónoma de México', 'UNAM'
    ];
    foreach ($conocidas as $ed) {
        if (stripos($texto, $ed) !== false) return $ed;
    }
    return null;
}

function detectarCiudad($texto) {
    $ciudades = ['Ciudad de México', 'Madrid', 'Barcelona', 'Buenos Aires', 'Bogotá', 'Lima', 'Santiago'];
    foreach ($ciudades as $c) {
        if (stripos($texto, $c) !== false) return $c;
    }
    return null;
}

// ── CONSULTA A CROSSREF (metadatos oficiales verificados a partir del DOI) ──
function consultarCrossRef($doi) {
    if (!$doi) return null;

    $url = 'https://api.crossref.org/works/' . rawurlencode($doi);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 6,
        // CrossRef pide un User-Agent identificable + mailto para la "polite pool" (respuestas más rápidas)
        CURLOPT_HTTPHEADER     => ['User-Agent: BiblioWebb/1.0 (mailto:contacto@bibliowebb.com.mx)'],
    ]);
    $respuesta = curl_exec($ch);
    $codigo    = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($codigo !== 200 || !$respuesta) return null;

    $data = json_decode($respuesta, true);
    $item = $data['message'] ?? null;
    if (!$item) return null;

    // Autor: "Apellido, Inicial." del primer autor listado
    $autor = null;
    if (!empty($item['author'][0])) {
        $a = $item['author'][0];
        $inicial = isset($a['given']) ? mb_substr($a['given'], 0, 1) . '.' : '';
        $autor = trim(($a['family'] ?? '') . ($inicial ? ', ' . $inicial : ''));
    }

    // Año: puede venir en published-print o published-online
    $anio = $item['published-print']['date-parts'][0][0]
        ?? $item['published-online']['date-parts'][0][0]
        ?? $item['created']['date-parts'][0][0]
        ?? null;

    return [
        'titulo'    => $item['title'][0] ?? null,
        'autor'     => $autor,
        'anio'      => $anio ? (string) $anio : null,
        'editorial' => $item['publisher'] ?? null,
        'ciudad'    => null, // CrossRef no suele reportar ciudad de publicación
        'doi'       => $item['DOI'] ?? $doi,
    ];
}

// ── ARMAR RESPUESTA ──
// 1. Heurísticas locales como base (siempre disponibles, no dependen de red)
$campos = [
    'titulo'    => detectarTitulo($lineas),
    'autor'     => detectarAutor($lineas),
    'anio'      => detectarAnio($textoInicio),
    'editorial' => detectarEditorial($textoInicio),
    'ciudad'    => detectarCiudad($textoInicio),
    'doi'       => detectarDOI($textoCompleto) ?? detectarISBN($textoCompleto),
];

// 2. Si detectamos un DOI real (no ISBN), consultamos CrossRef y
//    sobreescribimos con los datos oficiales cuando existan
if ($campos['doi'] && preg_match('/^10\.\d{4,9}\//', $campos['doi'])) {
    $crossref = consultarCrossRef($campos['doi']);
    if ($crossref) {
        foreach ($crossref as $clave => $valor) {
            if ($valor !== null && $valor !== '') {
                $campos[$clave] = $valor;
            }
        }
    }
}

$faltantes = [];
foreach ($campos as $clave => $valor) {
    if ($valor === null || $valor === '') {
        $faltantes[] = $clave;
    }
}

echo json_encode([
    'success'   => true,
    'tipo'      => $tipoDoc,
    'campos'    => $campos,
    'faltantes' => $faltantes,
], JSON_UNESCAPED_UNICODE);