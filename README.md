# Sistema Web de Gestión y Citación Automatizada (Normativa APA 7ª Edición)

Plataforma web unificada diseñada para la identificación, organización y citación automática de recursos académicos mediante la extracción inteligente de metadatos desde archivos digitales PDF. 
El sistema elimina el llenado manual de formularios mediante un motor lógico que detecta identificadores raíz (DOI/ISBN) para construir de forma inmediata la estructura sintáctica bajo la estricta normativa de APA 7ª edición.


## Arquitectura Tecnológica

El sistema opera bajo un ecosistema nativo y desacoplado para garantizar un alto rendimiento y escalabilidad:

*   **Front-end:** HTML5 nativo, CSS3 avanzado y JavaScript. Diseño completamente responsivo.
*   **Back-end:** API de servicios desarrollada en Python dedicada a la ingesta de archivos, parsing de PDFs y expresiones regulares (Regex).
*   **Persistencia y Seguridad:** Suite en la nube de Google Firebase explotando *Cloud Firestore* (Base de datos NoSQL) y *Firebase Authentication* (Módulo de identidad y Login con Google).
*   **Producción e Infraestructura:** Despliegue del Frontend mediante Firebase Hosting y Backend en servidor dedicado Hostinger.

---

## Estructura de Módulos Funcionales

1.  **Módulo de Identidad de Usuarios:** Control de estado de sesión persistente con Firebase Auth para el ingreso seguro de estudiantes registrados vía cuentas de Google.
2.  **Módulo de Catálogo e Invitados:** Panel de consulta abierta y filtrado reactivo del lado del cliente para la búsqueda de recursos públicos en Firestore sin necesidad de registro.
3.  **Motor de Extracción (APA 7):** Endpoint en Python enfocado en escanear la primera página de los documentos PDF cargados para localizar códigos estándar de indexación académica (DOI o ISBN) y formatear algorítmicamente la cita.
4.  **Biblioteca del Estudiante:** Dashboard privado que permite realizar operaciones CRUD asociadas al ID único del alumno para almacenar y categorizar sus fuentes bibliográficas en carpetas.

---

## Configuración del Entorno Local

### Requisitos Previos
*   Python 3.10 o superior
*   Node.js (para herramientas de Firebase CLI)
*   Cuenta de Google Firebase configurada

### 1. Clonar el Repositorio
```bash
git clone [https://github.com/tu-usuario/tu-repositorio.git](https://github.com/tu-usuario/tu-repositorio.git)
cd tu-repositorio
