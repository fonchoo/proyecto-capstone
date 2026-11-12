# Cambios al Plan de Pruebas: Sprint 2 (HU07–HU11)

Cambios para la hoja **«Plan de prueba»** de `Plan_de_Pruebas_Bomberos_completado.xlsx`, según el estado del sistema después de los commits `8206896`, `0505020` y `5cf1d17` (mantenciones con campos obligatorios, pestaña «Historial», notificaciones dentro de la app).

**Por qué:** los casos MTC_0260–MTC_0340 eran plantillas sin pasos ni datos concretos, y varios criterios de las tarjetas refinadas no tenían caso. Los nuevos usan números intermedios (262, 272, …) para no renumerar.

**Datos para las alertas (HU09/HU10):** `Evidencias/Pruebas/Sprint 2/datos_alertas_preventiva.sql` deja, contando desde hoy, B-1 con la preventiva **próxima** (20 días), R-1 **vencida** hace 10 días y B-2 **vencida** hace 5 días.

## Orden de ejecución

Los casos dependen unos de otros (por ejemplo, el N° de los reportes de falla). Hay que respetar el orden y los `npx supabase db reset` indicados (desde `Backend/`):

1. `db reset` → MTC_0050 (Sprint 1, pestaña Historial), MTC_0304, MTC_0312
2. MTC_0274, MTC_0276, MTC_0260, MTC_0280, MTC_0282 (crear B-9 antes)
3. Preparar fallas en B-1 (bombero.c1 reporta N° 1 alta y N° 2 media; teniente.c1 deriva ambas) → MTC_0262, MTC_0272, MTC_0270, MTC_0330
4. `db reset` → MTC_0320, MTC_0322, MTC_0324, MTC_0326, MTC_0327, MTC_0328
5. MTC_0340 (Segunda Compañía)
6. `db reset` + script de alertas → MTC_0290, MTC_0300, MTC_0310, MTC_0302

---

## A. Casos existentes que se modifican

### MTC_0050

| Columna | Valor |
|---|---|
| Resultado esperado | En la pestaña «Historial» se muestra la mantención 10-09-2026 → 12-09-2026, preventiva, «Finalizada», total $420.000 (Repuestos $300.000 · M.O. $120.000), ordenadas de la más reciente a la más antigua. También se muestra la sección «Historial de Fallas». |
| Pasos | 1. Abrir la ficha de B-1.<br>2. Seleccionar la pestaña «Historial».<br>3. Revisar las secciones «Historial de Mantenciones» e «Historial de Fallas». |
| Resultado obtenido | *(se vacía; se llena al ejecutar)* |
| Resultado | No ejecutado |

### MTC_0260

| Columna | Valor |
|---|---|
| Nombre de la prueba | HU07-CA1: Validar Registrar mantención preventiva con todos sus antecedentes |
| Resultado esperado | Aparece «Mantención registrada correctamente» en la pestaña «Historial» de B-1, con el nuevo registro primero: 10-11-2026 → 11-11-2026, preventiva, «Finalizada», $350.000 (Repuestos $230.000 · M.O. $120.000), taller y detalle ingresados. |
| Pre condicion | Sistema levantado (Supabase + API + Front) con los datos del seed. Sesión iniciada como inspector.c1. |
| Pasos | 1. Abrir la ficha de B-1 y presionar «Registrar Mantención».<br>2. Completar el formulario con los datos de prueba (tipo preventiva).<br>3. Presionar «Guardar Mantención». |
| Resultado obtenido | *(se vacía; se llena al ejecutar)* |
| Datos de prueba | Tipo: preventiva; Ingreso: 10-11-2026; Salida: 11-11-2026; Kilometraje: 49100; Detalle: Cambio de aceite y filtros; Repuestos: 230000; Mano de obra: 120000; Taller: Taller Maipú Diesel. |
| Criterios de aceptacion | 1. Permite acceder a «Registrar mantención». 2. Permite registrar tipo, fecha, insumos, mano de obra, costo y taller. 4. Con los obligatorios válidos, la mantención se almacena. 5. El nuevo registro se ve en el historial. |
| Estrategia | Caja Negra |
| Resultado | No ejecutado |

### MTC_0270

| Columna | Valor |
|---|---|
| Nombre de la prueba | HU07-CA6: Validar que el vehículo vuelva a «Operativo» al resolver su última falla |
| Resultado esperado | La mantención queda «Finalizada», la falla N° 2 pasa a «Resuelto» y B-1 vuelve a «Operativo» (en la ficha y en el Dashboard). |
| Pre condicion | Ejecutado MTC_0272 (B-1 «No operativo» con la falla N° 2 «Derivado» sin mantención). Sesión iniciada como inspector.c1. |
| Pasos | 1. Abrir la ficha de B-1 y presionar «Registrar Mantención».<br>2. Elegir tipo reactiva y asociar el reporte N° 2.<br>3. Completar con fecha de salida y costos, y guardar.<br>4. Revisar el estado del vehículo y el historial de fallas. |
| Resultado obtenido | *(se vacía; se llena al ejecutar)* |
| Datos de prueba | Tipo: reactiva; Reporte: N° 2; Ingreso y salida: fecha de hoy; Detalle: Ajuste de luces de emergencia; Repuestos: 15000; Mano de obra: 20000; Taller: Taller Maipú Diesel. |
| Criterios de aceptacion | 6. Al registrar una mantención, el sistema evalúa si corresponde dejar el vehículo «Operativo». |
| Estrategia | Caja Negra |
| Resultado | No ejecutado |

### MTC_0280

| Columna | Valor |
|---|---|
| Nombre de la prueba | HU08-CA1: Validar Consultar historial de mantenciones en la pestaña «Historial» |
| Resultado esperado | La pestaña «Historial» de B-1 muestra 2 mantenciones, de la más reciente (10-11-2026 → 11-11-2026) a la más antigua (10-09-2026 → 12-09-2026), cada una con tipo, fechas, estado, costo total, repuestos, mano de obra, taller y detalle. |
| Pre condicion | Ejecutado MTC_0260. Sesión iniciada como inspector.c1. |
| Pasos | 1. Abrir la ficha de B-1.<br>2. Seleccionar la pestaña «Historial».<br>3. Revisar el orden y los datos de cada mantención. |
| Resultado obtenido | *(se vacía; se llena al ejecutar)* |
| Datos de prueba | Vehículo B-1 con 2 mantenciones (seed + MTC_0260). |
| Criterios de aceptacion | 1. En la pestaña «Historial» se muestran las mantenciones. 2. Ordenadas cronológicamente. 3. Con tipo, fecha, insumos, mano de obra, costo y taller. 5. El registro nuevo está disponible. |
| Estrategia | Caja Negra |
| Resultado | No ejecutado |

### MTC_0290

| Columna | Valor |
|---|---|
| Nombre de la prueba | HU09-CA2: Validar alerta de mantención preventiva próxima |
| Tipo | Funcional |
| Resultado esperado | B-1 aparece en «Alertas» con «Preventiva en 20 días · <fecha>» (en ámbar) y el Dashboard muestra 1 en «Próxima (30 días)». |
| Pre condicion | Sistema levantado con los datos del seed y luego Evidencias/Pruebas/Sprint 2/datos_alertas_preventiva.sql (B-1 vence en 20 días). Sesión iniciada como teniente.c1. |
| Pasos | 1. Ejecutar el script de datos.<br>2. Iniciar sesión como teniente.c1 y revisar el Dashboard.<br>3. Ingresar a «Alertas». |
| Resultado obtenido | *(se vacía; se llena al ejecutar)* |
| Datos de prueba | B-1: última preventiva con salida = (hoy + 20 días) − 6 meses. |
| Criterios de aceptacion | 2. Si faltan 30 días o menos para cumplir 6 meses desde la última preventiva, se genera la alerta «Mantención próxima». |
| Estrategia | Hibrido |
| Resultado | No ejecutado |

### MTC_0300

| Columna | Valor |
|---|---|
| Nombre de la prueba | HU09-CA3: Validar alerta de mantención preventiva vencida |
| Tipo | Funcional |
| Resultado esperado | B-2 aparece en «Alertas» con «Preventiva vencida hace 5 días · <fecha>» (en rojo) y el Dashboard muestra 1 en «Vencida». |
| Pre condicion | Ejecutado el script datos_alertas_preventiva.sql (B-2 venció hace 5 días). Sesión iniciada como teniente.c2. |
| Pasos | 1. Iniciar sesión como teniente.c2 y revisar el Dashboard.<br>2. Ingresar a «Alertas». |
| Resultado obtenido | *(se vacía; se llena al ejecutar)* |
| Datos de prueba | B-2: última preventiva con salida = (hoy − 5 días) − 6 meses. |
| Criterios de aceptacion | 3. Si se cumplen los 6 meses sin una nueva preventiva, la alerta pasa a «Vencida». 5. El nuevo estado se refleja en el módulo de alertas. |
| Estrategia | Hibrido |
| Resultado | No ejecutado |

### MTC_0310

| Columna | Valor |
|---|---|
| Nombre de la prueba | HU10-CA1: Validar listado de alertas priorizadas de la compañía |
| Resultado esperado | teniente.c1 ve en «Alertas» primero R-1 («Preventiva vencida hace 10 días») y luego B-1 («Preventiva en 20 días»); cada una con el vehículo, el tipo (preventiva) y su estado. No aparece B-2 (Segunda Compañía). |
| Pre condicion | Ejecutado el script datos_alertas_preventiva.sql. Sesión iniciada como teniente.c1. |
| Pasos | 1. Ingresar a «Alertas».<br>2. Revisar el orden y el contenido de cada alerta. |
| Resultado obtenido | *(se vacía; se llena al ejecutar)* |
| Datos de prueba | Primera Compañía: R-1 vencida (−10 días), B-1 próxima (20 días). Segunda Compañía: B-2 vencida. |
| Criterios de aceptacion | 1. Muestra las alertas activas de su compañía. 2. Primero las vencidas y luego las próximas. 3. Cada alerta muestra vehículo, tipo y estado. |
| Estrategia | Caja Negra |
| Resultado | No ejecutado |

### MTC_0320

| Columna | Valor |
|---|---|
| Nombre de la prueba | HU11-CA1: Validar notificación dentro de la app al reportar una falla |
| Resultado esperado | teniente.c1 e inspector.c1 tienen 1 notificación sin leer: «Nueva falla en B-1 (urgencia alta): Pérdida de presión en la bomba principal». bombero.c1 (quien reportó) no recibe notificación. |
| Pre condicion | Sistema levantado con los datos del seed (npx supabase db reset). Sin notificaciones previas. |
| Pasos | 1. Iniciar sesión como bombero.c1 y reportar una falla en B-1.<br>2. Revisar la campana de bombero.c1.<br>3. Iniciar sesión como teniente.c1 y abrir la campana.<br>4. Iniciar sesión como inspector.c1 y abrir la campana. |
| Resultado obtenido | *(se vacía; se llena al ejecutar)* |
| Datos de prueba | Falla en B-1: urgencia alta; descripción «Pérdida de presión en la bomba principal». |
| Criterios de aceptacion | 1. Al registrarse una falla en un vehículo de su compañía, se genera una notificación para el usuario. 4. La notificación informa la nueva falla e identifica el vehículo. |
| Estrategia | Caja Negra |
| Resultado | No ejecutado |

### MTC_0330

| Columna | Valor |
|---|---|
| Nombre de la prueba | HU07-INT01: Integrar mantención, reportes de falla y estado del vehículo |
| Resultado esperado | En la base: las dos mantenciones reactivas de B-1 quedan «finalizada» con costo_total y mano_obra; los reportes N° 1 y N° 2 quedan «resuelto» y enlazados a su mantención (id_mantencion); B-1 queda «operativo». |
| Pre condicion | Ejecutados MTC_0262, MTC_0272 y MTC_0270. |
| Pasos | 1. Consultar en la base (psql o Studio) las mantenciones de B-1, sus reportes de falla y el estado del vehículo.<br>2. Comparar con lo que muestra la ficha de B-1. |
| Resultado obtenido | *(se vacía; se llena al ejecutar)* |
| Datos de prueba | Consultas sobre mantencion, reporte_falla y vehiculo para B-1 (id 1). |
| Criterios de aceptacion | Los módulos de mantención, fallas y vehículos mantienen información consistente. |
| Estrategia | Caja Blanca |
| Resultado | No ejecutado |

### MTC_0340

| Columna | Valor |
|---|---|
| Resultado esperado | Reporte creado (teniente.c2 notificado) → derivado (inspector.c2 notificado) → mantención reactiva registrada y finalizada → reporte «Resuelto» y B-2 «Operativo»; el historial de B-2 muestra la falla con «Reportado por» y «Derivado por», y la mantención que la resolvió. |
| Pre condicion | Sistema levantado con los datos del seed. Usuarios de la Segunda Compañía: bombero.c2, teniente.c2, inspector.c2. |
| Pasos | 1. bombero.c2 reporta una falla en B-2.<br>2. teniente.c2 ve la notificación y deriva el reporte desde «Fallas».<br>3. inspector.c2 ve la notificación de derivación, registra una mantención reactiva asociada al reporte, con salida y costos.<br>4. Revisar la ficha de B-2 (estado e historial). |
| Resultado obtenido | *(se vacía; se llena al ejecutar)* |
| Datos de prueba | Falla en B-2: urgencia media, «Fuga de aceite en la caja de cambios». Mantención: reactiva, salida hoy, Repuestos 90000, Mano de obra 60000, Taller Iveco Chile. |
| Criterios de aceptacion | El flujo completo mantiene trazabilidad entre etapas e informa a cada rol. |
| Resultado | No ejecutado |

---

## B. Casos nuevos

Columnas comunes: **Prefijo** MTC · **Sprint** Sprint 2 · **Candidato a automatizar** SI · **Resultado** No ejecutado · **Responsable ejecución** *(al ejecutar)*.

### MTC_0262 · HU07-CA3

*Se inserta después de MTC_0260.*

| Columna | Valor |
|---|---|
| Nombre de la prueba | HU07-CA3: Validar asociar una mantención reactiva a un reporte derivado |
| Tipo | Funcional |
| Resultado esperado | El formulario ofrece «Reporte de falla que resuelve» con N° 1 y N° 2. Al guardar sin fecha de salida, la mantención queda «En proceso», B-1 pasa a «En mantención» y la mantención indica «Resuelve 1 falla». |
| Pre condicion | Sistema levantado. bombero.c1 reportó dos fallas en B-1 (N° 1 alta, N° 2 media) y teniente.c1 derivó ambas. Sesión iniciada como inspector.c1. |
| Pasos | 1. Abrir la ficha de B-1 y presionar «Registrar Mantención».<br>2. Elegir tipo reactiva y asociar el reporte N° 1.<br>3. Completar sin fecha de salida ni costos y guardar.<br>4. Revisar el historial y el estado de B-1. |
| Datos de prueba | Fallas: N° 1 «Pérdida de presión en la bomba principal» (alta), N° 2 «Luces de emergencia intermitentes» (media). Mantención: reactiva, reporte N° 1, ingreso hoy, Detalle: Reemplazo de sello de bomba, Taller: Taller Maipú Diesel. |
| Modulo a probar | Registrar mantención |
| Criterios de aceptacion | 3. Si el vehículo tiene un reporte derivado, al registrar una mantención reactiva se puede asociar al reporte. |
| Estrategia | Caja Negra |

### MTC_0272 · HU07-CA7

*Se inserta después de MTC_0270.*

| Columna | Valor |
|---|---|
| Nombre de la prueba | HU07-CA7: Validar que el vehículo no quede operativo si conserva fallas sin resolver |
| Tipo | Funcional |
| Resultado esperado | La mantención queda «Finalizada» y la falla N° 1 «Resuelto», pero B-1 queda «No operativo» porque la falla N° 2 sigue «Derivado». |
| Pre condicion | Ejecutado MTC_0262 (mantención reactiva en proceso asociada a N° 1; N° 2 derivada sin mantención). Sesión iniciada como inspector.c1. |
| Pasos | 1. En la pestaña «Historial» de B-1, presionar «Finalizar mantención» en la mantención en proceso.<br>2. Ingresar fecha de salida, repuestos y mano de obra, y confirmar.<br>3. Revisar el estado de B-1 y sus fallas. |
| Datos de prueba | Salida: hoy; Repuestos: 180000; Mano de obra: 0. |
| Modulo a probar | Registrar mantención |
| Criterios de aceptacion | 7. Si el vehículo continúa presentando fallas después de la mantención, no se marca automáticamente como operativo. |
| Estrategia | Caja Negra |

### MTC_0274 · HU07-CA8

*Se inserta después de MTC_0270.*

| Columna | Valor |
|---|---|
| Nombre de la prueba | HU07-CA8: Validar los campos obligatorios de la mantención |
| Tipo | Funcional |
| Resultado esperado | Sin taller ni detalle: «El taller es obligatorio» y «El detalle del trabajo es obligatorio». Con fecha de salida y sin costos: «Los repuestos son obligatorios al finalizar (puede ser $0)» y «La mano de obra es obligatoria al finalizar (puede ser $0)». No se guarda ninguna mantención. |
| Pre condicion | Sistema levantado con los datos del seed. Sesión iniciada como inspector.c1. |
| Pasos | 1. Abrir «Registrar Mantención» de B-1.<br>2. Completar solo la fecha de ingreso y guardar.<br>3. Completar taller y detalle, agregar fecha de salida dejando los costos vacíos, y guardar. |
| Datos de prueba | Tipo: preventiva; Ingreso: 10-11-2026; Salida: 11-11-2026 (paso 3); Taller: Taller Maipú Diesel; Detalle: Revisión general. |
| Modulo a probar | Registrar mantención |
| Criterios de aceptacion | 8. Con información obligatoria incompleta, el sistema muestra los campos que requieren corrección. Obligatorios: tipo, fecha de ingreso, taller y detalle; al finalizar, también repuestos y mano de obra. |
| Estrategia | Caja Negra |

### MTC_0276 · HU07-SEG01

*Se inserta después de MTC_0270.*

| Columna | Valor |
|---|---|
| Nombre de la prueba | HU07-SEG01: Validar que un bombero no pueda registrar mantenciones |
| Tipo | Seguridad |
| Resultado esperado | La ficha de B-1 no muestra «Registrar Mantención» para bombero.c1; la URL /vehiculos/1/registrar-mantencion redirige al Dashboard y la API responde 403 «No tienes permisos para esta acción». |
| Pre condicion | Sistema levantado con los datos del seed. Sesión iniciada como bombero.c1. |
| Pasos | 1. Abrir la ficha de B-1.<br>2. Escribir en el navegador http://localhost:5173/vehiculos/1/registrar-mantencion.<br>3. Con una herramienta de API y la sesión de bombero.c1, enviar POST /api/mantenimientos. |
| Datos de prueba | Body: {"id_vehiculo":1,"id_tipo_mantencion":1,"fecha_ingreso":"2026-11-10","proveedor":"Taller X","detalle_trabajo":"Prueba"} |
| Modulo a probar | Registrar mantención |
| Criterios de aceptacion | Solo el Teniente Tercero, el Inspector de Material Mayor y el Administrador registran mantenciones. |
| Estrategia | Hibrido |

### MTC_0282 · HU08-CA4

*Se inserta después de MTC_0280.*

| Columna | Valor |
|---|---|
| Nombre de la prueba | HU08-CA4: Validar el historial de un vehículo sin mantenciones |
| Tipo | Funcional |
| Resultado esperado | La pestaña «Historial» de B-9 muestra «0 registros» y «Sin registros de mantención». |
| Pre condicion | Sesión iniciada como inspector.c1. Registrado un vehículo nuevo B-9 (como en MTC_0070), sin mantenciones. |
| Pasos | 1. Abrir la ficha de B-9.<br>2. Seleccionar la pestaña «Historial». |
| Datos de prueba | Vehículo B-9 recién creado. |
| Modulo a probar | Consultar historial de mantenciones |
| Criterios de aceptacion | 4. Si el vehículo no tiene mantenciones, el sistema informa que no existen mantenciones asociadas. |
| Estrategia | Caja Negra |

### MTC_0302 · HU09-CA4

*Se inserta después de MTC_0300.*

| Columna | Valor |
|---|---|
| Nombre de la prueba | HU09-CA4: Validar que una nueva preventiva recalcule el plazo |
| Tipo | Funcional |
| Resultado esperado | Tras registrar la preventiva, B-1 deja de aparecer en «Alertas», el Dashboard muestra 0 en «Próxima (30 días)» y la ficha de B-1 muestra como próxima preventiva la fecha de hoy + 6 meses. |
| Pre condicion | Ejecutado MTC_0290 (B-1 con alerta «próxima»). Sesión iniciada como inspector.c1. |
| Pasos | 1. Registrar en B-1 una mantención preventiva con fecha de salida hoy.<br>2. Revisar «Alertas», el Dashboard y la ficha de B-1. |
| Datos de prueba | Tipo: preventiva; Ingreso y salida: hoy; Detalle: Preventiva semestral; Repuestos: 250000; Mano de obra: 110000; Taller: Taller Maipú Diesel. |
| Modulo a probar | Generar alerta automática de mantención |
| Criterios de aceptacion | 4. Si un vehículo con alerta próxima registra una nueva preventiva, el sistema recalcula el período y actualiza la alerta. (HU10 CA5: el listado refleja el estado actualizado.) |
| Estrategia | Caja Negra |

### MTC_0304 · HU09-CA6

*Se inserta después de MTC_0300.*

| Columna | Valor |
|---|---|
| Nombre de la prueba | HU09-CA6: Validar vehículo sin preventiva registrada |
| Tipo | Funcional |
| Resultado esperado | R-1 no aparece como vencida ni próxima: está en la sección «Sin preventiva registrada» con «Registra su última preventiva para calcular el vencimiento». |
| Pre condicion | Sistema levantado con los datos del seed, sin el script de alertas (R-1 solo tiene una mantención reactiva). Sesión iniciada como teniente.c1. |
| Pasos | 1. Ingresar a «Alertas».<br>2. Buscar R-1. |
| Datos de prueba | R-1 (Primera Compañía) sin mantenciones preventivas. |
| Modulo a probar | Generar alerta automática de mantención |
| Criterios de aceptacion | 6. Si un vehículo no tiene preventivas registradas, se aplica la regla definida («sin registro») sin asumir una fecha inexistente. |
| Estrategia | Caja Negra |

### MTC_0312 · HU10-CA4

*Se inserta después de MTC_0310.*

| Columna | Valor |
|---|---|
| Nombre de la prueba | HU10-CA4: Validar el mensaje cuando no hay alertas |
| Tipo | Funcional |
| Resultado esperado | «Alertas» muestra «Preventivas al día» y «Ningún vehículo vence en los próximos 30 días». |
| Pre condicion | Sistema levantado con los datos del seed, sin el script de alertas (B-1 vence en marzo de 2027). Sesión iniciada como teniente.c1. |
| Pasos | 1. Ingresar a «Alertas». |
| Datos de prueba | Datos del seed. |
| Modulo a probar | Ver listado de alertas priorizadas |
| Criterios de aceptacion | 4. Si no existen alertas activas, el sistema informa que no hay alertas pendientes. |
| Estrategia | Caja Negra |

### MTC_0322 · HU11-CA2

*Se inserta después de MTC_0320.*

| Columna | Valor |
|---|---|
| Nombre de la prueba | HU11-CA2: Validar que la notificación llegue con la app abierta |
| Tipo | Funcional |
| Resultado esperado | Sin recargar la página, en menos de un minuto el contador de la campana de teniente.c1 sube en 1 y la notificación aparece al abrirla. |
| Pre condicion | Sesión de teniente.c1 abierta en el Dashboard (otro navegador o ventana privada para bombero.c1). |
| Pasos | 1. Dejar abierta la sesión de teniente.c1 y anotar el contador de la campana.<br>2. En otra ventana, bombero.c1 reporta una falla en R-1.<br>3. Esperar hasta 60 segundos sin recargar y revisar la campana de teniente.c1. |
| Datos de prueba | Falla en R-1: urgencia baja, «Espejo lateral suelto». |
| Modulo a probar | Notificaciones de falla reportada |
| Criterios de aceptacion | 2. Con la aplicación abierta, el usuario ve la notificación sin recargar (en menos de un minuto). |
| Estrategia | Caja Negra |

### MTC_0324 · HU11-CA3

*Se inserta después de MTC_0320.*

| Columna | Valor |
|---|---|
| Nombre de la prueba | HU11-CA3: Validar notificaciones pendientes al volver a ingresar y acceso al reporte |
| Tipo | Funcional |
| Resultado esperado | Al iniciar sesión, inspector.c1 ve la campana con sus notificaciones sin leer. Al seleccionar la de B-1 se abre la ficha de B-1 en la pestaña «Historial» con el reporte de falla, y el contador baja en 1. |
| Pre condicion | Ejecutado MTC_0320 (inspector.c1 con notificaciones sin leer y sin sesión abierta). |
| Pasos | 1. Iniciar sesión como inspector.c1 y revisar la campana.<br>2. Seleccionar la notificación de B-1.<br>3. Revisar la página abierta y el contador. |
| Datos de prueba | Notificación «Nueva falla en B-1 (urgencia alta) ...». |
| Modulo a probar | Notificaciones de falla reportada |
| Criterios de aceptacion | 3. Al volver a ingresar, ve las notificaciones pendientes y cuántas no ha leído. 5. Al seleccionarla accede al vehículo y su reporte, y queda marcada como leída. |
| Estrategia | Caja Negra |

### MTC_0326 · HU11-CA6

*Se inserta después de MTC_0320.*

| Columna | Valor |
|---|---|
| Nombre de la prueba | HU11-CA6: Validar que otra compañía y los administradores no reciban la notificación |
| Tipo | Funcional |
| Resultado esperado | bombero.c2, teniente.c2 e inspector.c2 (Segunda Compañía) y los administradores no tienen notificaciones de las fallas de B-1 ni de R-1. |
| Pre condicion | Ejecutados MTC_0320 y MTC_0322 (fallas en vehículos de la Primera Compañía). |
| Pasos | 1. Iniciar sesión como teniente.c2 y abrir la campana.<br>2. Repetir con admin@admin.cl.<br>3. Verificar en la base la tabla notificacion. |
| Datos de prueba | select u.email, n.mensaje from notificacion n join usuario u using (id_usuario) |
| Modulo a probar | Notificaciones de falla reportada |
| Criterios de aceptacion | 6. Una falla en un vehículo de otra compañía no genera notificación para el usuario. |
| Estrategia | Hibrido |

### MTC_0327 · HU11-SEG01

*Se inserta después de MTC_0320.*

| Columna | Valor |
|---|---|
| Nombre de la prueba | HU11-SEG01: Validar que un usuario no pueda leer ni marcar notificaciones ajenas |
| Tipo | Seguridad |
| Resultado esperado | GET /api/notificaciones de teniente.c1 solo trae las suyas; PATCH /api/notificaciones/<id de inspector.c1>/leer con la sesión de teniente.c1 responde 404 «Notificación no encontrada» y la notificación sigue sin leer. |
| Pre condicion | Ejecutado MTC_0320 (teniente.c1 e inspector.c1 con notificaciones). |
| Pasos | 1. Obtener en la base el id de una notificación de inspector.c1.<br>2. Con la sesión de teniente.c1, enviar PATCH /api/notificaciones/<id>/leer.<br>3. Verificar que sigue sin leer. |
| Datos de prueba | select id_notificacion, leida_en from notificacion where id_usuario = 5 |
| Modulo a probar | Notificaciones de falla reportada |
| Criterios de aceptacion | Cada usuario solo ve y marca sus propias notificaciones. |
| Estrategia | Hibrido |

### MTC_0328 · HU11-INT01

*Se inserta después de MTC_0320.*

| Columna | Valor |
|---|---|
| Nombre de la prueba | HU11-INT01: Integrar derivación de fallas con el aviso al Inspector (HU06 CA5) |
| Tipo | Integración |
| Resultado esperado | inspector.c1 recibe «Falla N° 1 de B-1 derivada para mantención (urgencia alta): ...». teniente.c1 (quien derivó) no recibe ese aviso. |
| Pre condicion | Ejecutado MTC_0320 (falla N° 1 de B-1 pendiente). Sesión iniciada como teniente.c1. |
| Pasos | 1. teniente.c1 deriva el reporte N° 1 desde «Fallas».<br>2. Iniciar sesión como inspector.c1 y abrir la campana.<br>3. Verificar en la base el aviso de tipo falla_derivada. |
| Datos de prueba | Reporte N° 1 (B-1, urgencia alta). |
| Modulo a probar | Notificaciones de falla reportada |
| Criterios de aceptacion | HU06 CA5: al derivar un reporte se genera una notificación al Inspector de Material Mayor. |
| Estrategia | Hibrido |
