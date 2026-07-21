# Punto Caja

Aplicación fullstack para buscar o registrar clientes y acreditarles puntos sin salir del flujo de la venta.

## Problema priorizado

Prioricé reducir el tiempo de atención sin aumentar el riesgo de acreditar puntos a la persona incorrecta. Por eso el flujo combina una búsqueda rápida con una instancia explícita de verificación de identidad antes de modificar el saldo. El alta de clientes se mantiene dentro de la misma operación para que informar que una persona no tiene cuenta no obligue al operador a empezar de nuevo.

Si hubiese mas de 1 caja pasaria a haber errores de concurrencia y deberiamos cambiar la logica pero eso ya seria con una base de datos y algun servicio externo

## Cómo ejecutarla

Requisitos: Node.js 20 o superior y npm.

```bash
npm install
npm run dev
```

- Frontend: http://localhost:4200
- API: http://localhost:3000/api

Para verificar el build de producción:

```bash
npm run build
```

## Decisiones de producto

- **DNI como identificador único.** Es un dato conocido por el operador y evita confundir clientes con el mismo nombre. Se valida tanto en Angular como en NestJS y el backend rechaza duplicados con HTTP 409.
- **Búsqueda flexible.** Permite buscar por DNI, nombre, apellido o email; ignora mayúsculas y acentos. Los resultados muestran nombre, email, DNI completo y saldo para que el operador confirme la identidad.
- **Alta dentro del flujo.** Si no hay resultados, se ofrece el registro en el mismo contexto. Después del alta, el cliente queda seleccionado y el foco pasa directamente a la carga de puntos.
- **Alta de baja fricción.** Nombre, apellido y DNI son obligatorios. El email es opcional porque no es necesario para identificar de forma única al cliente.
- **Acreditación explícita.** Antes de confirmar se vuelve a mostrar la identidad, el saldo actual y el saldo resultante. El botón incluye la cantidad a acreditar para reducir errores.
- **Cierre claro.** La pantalla final muestra el saldo actualizado y ofrece iniciar una nueva operación.

## Alternativas consideradas

- **Email como identificador único.** Se descartó porque no todas las personas tienen o recuerdan uno, puede cambiar y escribirlo demora más en caja. Se mantuvo como dato opcional para ayudar a verificar identidades.
- **Búsqueda únicamente por DNI.** Sería más precisa, pero obliga al cliente a tener el dato disponible. Se eligió permitir también nombre y email, mostrando suficientes datos para desambiguar resultados.
- **Alta en una sección separada.** Simplificaría cada pantalla, pero interrumpiría la venta. Se prefirió un alta breve e integrada que continúa directamente con los puntos.
- **Acreditación inmediata al seleccionar.** Ahorraría un clic, pero elevaría el riesgo de error. Se mantuvo una confirmación con el cliente seleccionado, los puntos y el saldo resultante.

## Reglas de negocio

Las reglas importantes viven también en la API, aunque el frontend las anticipe:

- el cliente debe existir para acreditar puntos;
- el DNI debe contener 7 u 8 dígitos y no puede repetirse;
- los puntos deben ser un entero entre 1 y 1.000;
- nombre y apellido son obligatorios;
- si se informa un email, debe ser válido.

Los datos se mantienen en memoria y vuelven a su estado inicial al reiniciar la API, tal como permite el enunciado.

## Estructura

```text
apps/
├── api/                    # NestJS
│   └── src/customers/      # controlador, servicio, DTOs y modelo
└── web/                    # Angular standalone
    └── src/app/            # interfaz, estado del flujo y servicio HTTP
```

## API

| Método | Ruta | Uso |
| --- | --- | --- |
| `GET` | `/api/customers?query=juan` | Buscar clientes |
| `POST` | `/api/customers` | Registrar un cliente |
| `POST` | `/api/customers/:id/points` | Acreditar puntos |

Ejemplo de alta:

```json
{
  "firstName": "Ana",
  "lastName": "López",
  "dni": "40123456",
  "email": "ana@example.com"
}
```

Ejemplo de acreditación:

```json
{
  "points": 275
}
```

## Qué quedó afuera

Por alcance y tiempo se dejaron afuera autenticación, roles, edición y eliminación de clientes, historial de movimientos, base de datos, Docker, deploy y tests automatizados. Son funcionalidades que no resultan necesarias para demostrar el flujo central solicitado.

## Mejoras para producción

En un entorno productivo agregaría persistencia transaccional, idempotencia para evitar una doble acreditación ante reintentos, auditoría de movimientos, autenticación del operador, configuración de CORS por ambiente, observabilidad y tests automatizados de las reglas críticas. También revisaría con usuarios reales si conviene mostrar el DNI completo o parcialmente en función de las políticas de privacidad del comercio.
