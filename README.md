# 🚀 ALS Tracing Demo - Tracing de Peticiones Profesional en Node.js

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Una demostración práctica de cómo implementar **tracing distribuido** en aplicaciones Node.js usando `AsyncLocalStorage` para mantener contexto de correlación entre peticiones HTTP y llamadas asíncronas.

## 🎯 ¿Por qué es importante el Tracing?

En aplicaciones modernas distribuidas, rastrear el flujo de una petición a través de múltiples servicios es **crítico** para:

- **Debugging eficiente**: Identificar exactamente dónde fallan las peticiones
- **Monitoreo de performance**: Medir tiempos de respuesta end-to-end
- **Observabilidad**: Entender el comportamiento del sistema en producción
- **Troubleshooting**: Correlacionar logs entre servicios diferentes

Sin tracing adecuado, debuggear problemas en producción se convierte en una **pesadilla**.

## ✨ Características

- **Correlación automática**: Cada petición recibe un ID único que se propaga automáticamente
- **Contexto persistente**: El contexto se mantiene a través de operaciones asíncronas
- **Medición de performance**: Tiempos de respuesta integrados
- **Headers de correlación**: Propagación automática del `x-corr-id`
- **Logging contextual**: Logs automáticamente etiquetados con el ID de correlación

## 🏗️ Arquitectura

```
Cliente → Servidor Principal → Múltiples llamadas downstream
   ↓           ↓                    ↓
  cid      AsyncLocalStorage    Headers x-corr-id
```

El proyecto demuestra cómo:
1. **Capturar** el contexto de la petición HTTP
2. **Propagar** el ID de correlación a servicios downstream
3. **Mantener** el contexto a través de operaciones asíncronas
4. **Medir** tiempos de respuesta automáticamente

## 🚀 Instalación y Uso

### Prerrequisitos

- Node.js 18 o superior
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/jaimeirazabal1/als-tracing-demo.git
cd als-tracing-demo

# Instalar dependencias
npm install
```

### Ejecutar el servidor

```bash
# Modo desarrollo (con auto-reload)
npm run dev

# Modo producción
npm start
```

El servidor se ejecutará en `http://localhost:3001`

## 📡 Endpoints Disponibles

### `GET /`
Retorna información básica con el ID de correlación actual.

```bash
curl http://localhost:3001/
```

**Respuesta:**
```json
{
  "hello": "world",
  "cid": "550e8400-e29b-41d4-a716-446655440000"
}
```

### `GET /api/work`
Simula una operación compleja que hace múltiples llamadas paralelas a servicios downstream.

```bash
curl http://localhost:3001/api/work
```

**Respuesta:**
```json
{
  "ok": true,
  "cid": "550e8400-e29b-41d4-a716-446655440000",
  "elapsedMs": "156.2",
  "results": [
    {"ok": true, "gotCid": "550e8400-e29b-41d4-a716-446655440000"},
    {"ok": true, "gotCid": "550e8400-e29b-41d4-a716-446655440000"}
  ]
}
```

### `GET /downstream`
Endpoint simulado que actúa como un servicio externo.

```bash
curl http://localhost:3001/downstream
```

## 🔍 Observando el Tracing en Acción

### 1. Ver logs contextualizados

Cada log incluye automáticamente el ID de correlación:

```
[550e8400-e29b-41d4-a716-446655440000] GET /api/work
[550e8400-e29b-41d4-a716-446655440000] fetch http://localhost:3001/downstream 200 87.3ms
[550e8400-e29b-41d4-a716-446655440000] fetch http://localhost:3001/downstream 200 134.7ms
[550e8400-e29b-41d4-a716-446655440000] callback de timer ve el contexto
```

### 2. Propagación de headers

El ID de correlación se propaga automáticamente en headers HTTP:

```bash
curl -H "x-corr-id: mi-custom-id" http://localhost:3001/api/work
```

### 3. Contexto en operaciones asíncronas

Incluso en callbacks de `setTimeout`, el contexto se mantiene:

```javascript
setTimeout(() => log("callback de timer ve el contexto"), 10);
```

## 🎓 Conceptos Clave Implementados

### AsyncLocalStorage
```javascript
const als = new AsyncLocalStorage();
const ctx = { cid: randomUUID(), t0: performance.now() };
als.run(ctx, handler); // Todo dentro mantiene el contexto
```

### Propagación de Headers
```javascript
const headers = new Headers();
if (store.cid) headers.set("x-corr-id", store.cid);
```

### Medición de Performance
```javascript
const t0 = performance.now();
// ... operación ...
const elapsed = (performance.now() - t0).toFixed(1);
```

## 🏆 ¿Por qué esto te hace Pro?

1. **Observabilidad de nivel empresarial**: Implementas tracing como lo hacen las grandes empresas
2. **Debugging eficiente**: Identificas problemas en segundos, no horas
3. **Arquitectura escalable**: Tu código está preparado para microservicios
4. **Best practices**: Sigues estándares de la industria para monitoreo
5. **Performance aware**: Mides y optimizas automáticamente

## 🔧 Extensión y Personalización

Este proyecto es un **template base** que puedes extender para:

- Integrar con sistemas de logging (Winston, Pino)
- Conectar con APMs (New Relic, DataDog, Jaeger)
- Añadir métricas personalizadas
- Implementar sampling para alto volumen
- Agregar spans distribuidos

## 📚 Recursos Adicionales

- [AsyncLocalStorage - Node.js Docs](https://nodejs.org/api/async_hooks.html#class-asynclocalstorage)
- [OpenTelemetry](https://opentelemetry.io/) - Estándar de observabilidad
- [Distributed Tracing Best Practices](https://opentelemetry.io/docs/concepts/distributions/)

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si tienes ideas para mejorar el proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

**¿Te gustó el proyecto?** ⭐ Dale una estrella al repositorio y compártelo con otros desarrolladores que buscan implementar tracing profesional en Node.js.
