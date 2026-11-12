# Cambios al Plan de Pruebas: HU03 y HU04 (Sprint 1)

Cambios para copiar a la hoja **«Plan de prueba»** de `Plan_de_Pruebas_Bomberos_completado.xlsx`, a partir del commit `4a3b267` ("Completa HU03 y agrega la edición de vehículos (HU04)").

**Qué cambió en el sistema y afecta a las pruebas**

- Solo **Teniente Tercero, Inspector de Material Mayor y Administrador** pueden crear y editar vehículos. El bombero ya no ve el botón «Registrar vehículo» y la API le responde 403.
- Nuevo campo **Tipo**. Son obligatorios: nomenclatura, tipo, patente, marca, año y compañía. El modelo es opcional.
- La **patente es única** en todas las compañías y se guarda normalizada: `klht-21` queda como `KLHT21`.
- La ficha del vehículo tiene un botón **Editar** (HU04). El estado del vehículo no se puede editar, porque lo calcula el sistema.

**Antes de ejecutar:** desde `Backend/`, correr `npx supabase db reset`. Esto aplica la migración nueva y deja los datos del seed: B-1 (KLHT21), R-1 (JXPS48) y B-2 (LBRC73).

**Numeración:** los casos nuevos usan números intermedios (102, 104, …) para no renumerar los existentes, porque las carpetas de evidencia se llaman según el ID.

---

## A. Casos existentes que se modifican

### MTC_0070 · HU03-CA1 (re-ejecutar: estaba NOK)

| Columna | Valor nuevo |
|---|---|
| Resultado esperado | Aparece «Vehículo registrado correctamente» y B-9 se ve en la lista de la flota con estado «Operativo». En la ficha de B-9 se ve Tipo «Bomba» y Patente «ABCD12». |
| Pre condicion | Sistema levantado (Supabase + API + Front) con los datos del seed (`npx supabase db reset`). Sesión iniciada como inspector.c1 (crean vehículos el Teniente Tercero, el Inspector y el Administrador). |
| Pasos | 1. En el Dashboard, presionar «Registrar vehículo». 2. Completar el formulario con los datos de prueba. 3. Presionar «Registrar vehículo». 4. Abrir la ficha de B-9. |
| Datos de prueba | Usuario: inspector.c1@sigmave.cl (clave de prueba según Backend/supabase/seed.sql). Nomenclatura: B-9; Tipo: Bomba; Patente: ABCD12; Marca: Renault; Modelo: Midlum 270; Año: 2020; Estado: Operativo; Compañía: Primera Compañía. |
| Criterios de aceptacion | 2. Dado que completo los campos obligatorios (tipo, marca, año y patente), cuando guardo, entonces el sistema registra el nuevo vehículo. 3. Dado que el vehículo se registra correctamente, entonces aparece en el listado de vehículos. |
| Resultado obtenido | *(vaciar y volver a llenar al ejecutar)* |
| Resultado | *(re-ejecutar)* |
| Evidencia | Reemplazar `02_B-9_en_listado_sin_mensaje_de_exito.jpg` por una captura con el mensaje visible. |

### MTC_0100 · HU03-SEG01 (cambia el usuario: bombero.c1 ya no puede registrar)

| Columna | Valor nuevo |
|---|---|
| Pre condicion | Sistema levantado (Supabase + API + Front) con los datos del seed. Sesión iniciada como teniente.c1 (Primera). |
| Pasos | 1. Presionar «Registrar vehículo» y revisar las opciones del selector de compañía. 2. Con una herramienta de API (Postman o curl) y la sesión de teniente.c1, enviar POST /api/vehiculos con id_compania = 2. |
| Resultado esperado | El selector solo ofrece la Primera Compañía. La API responde 403 «No puedes asignar vehículos a una compañía que no es la tuya» y no crea el vehículo. |
| Datos de prueba | Body (con todos los obligatorios, si no la API responde 400 antes de revisar la compañía): `{"nomenclatura":"X-1","tipo":"Bomba","patente":"XXXX11","marca":"Iveco","ano_fabricacion":2020,"id_compania":2}` |
| Resultado | *(re-ejecutar)* |

### MTC_0110 · HU04-CA1 (desbloqueado)

| Columna | Valor nuevo |
|---|---|
| Nombre de la prueba | HU04-CA1: Validar Editar ficha de un vehículo |
| Resultado esperado | La ficha muestra el botón «Editar». Al guardar aparece «Vehículo actualizado correctamente»; la ficha muestra la patente KLHT99 y el modelo «Atego 1730», y el listado de la flota muestra «Mercedes-Benz Atego 1730» para B-1. |
| Pre condicion | Sistema levantado (Supabase + API + Front) con los datos del seed. Sesión iniciada como inspector.c1. |
| Pasos | 1. En el Dashboard, abrir la ficha de B-1. 2. Presionar «Editar». 3. Cambiar la patente y el modelo. 4. Presionar «Guardar cambios». 5. Revisar la ficha y volver al listado. |
| Datos de prueba | Vehículo B-1; nueva patente: KLHT99; nuevo modelo: Atego 1730. |
| Criterios de aceptacion | 1. Dado que el Inspector tiene permisos de edición, cuando selecciona un vehículo, entonces puede acceder a «Editar». 4. Dado que los datos son válidos, cuando confirma, entonces el sistema guarda los cambios. 5. Dado que se actualizó, cuando consulta la ficha, entonces ve los datos modificados. |
| Resultado obtenido | *(vaciar y volver a llenar al ejecutar)* |
| Resultado | *(ejecutar)* |

---

## B. Casos nuevos

Columnas comunes a todos: **Prefijo** MTC · **Sprint** Sprint 1 · **Candidato a automatizar** SI · **Resultado** No ejecutado · **Responsable ejecución** *(por asignar)*.

### MTC_0102 · HU03-CA5: Validar que no se pueda registrar una patente duplicada

| Columna | Valor |
|---|---|
| N° | 102 |
| ID | MTC_0102 |
| Nombre de la prueba | HU03-CA5: Validar que no se pueda registrar una patente duplicada |
| Tipo | Funcional |
| Resultado esperado | Bajo el campo Patente aparece «Esta patente ya está registrada» y debajo del formulario «Ya existe un vehículo registrado con la patente KLHT21». El vehículo no se crea y la flota sigue con las mismas unidades. |
| Pre condicion | Sistema levantado (Supabase + API + Front) con los datos del seed. Sesión iniciada como inspector.c1. B-1 tiene la patente KLHT21. |
| Pasos | 1. Presionar «Registrar vehículo». 2. Completar el formulario usando la patente de B-1 escrita en minúsculas y con guion. 3. Presionar «Registrar vehículo». |
| Datos de prueba | Nomenclatura: B-11; Tipo: Bomba; Patente: klht-21; Marca: Scania; Año: 2022; Compañía: Primera Compañía. |
| Modulo a probar | Crear ficha de nuevo vehículo |
| Criterios de aceptacion | 5. Dado que el usuario ingresa una patente que ya se encuentra registrada, cuando intenta guardar el vehículo, entonces el sistema debe impedir el registro duplicado. |
| Estrategia | Caja Negra |
| Evidencia | `Evidencias/Pruebas/Sprint 1/MTC_0102 - HU03-CA5/` |

### MTC_0104 · HU03-CA4: Validar los mensajes de campos obligatorios

| Columna | Valor |
|---|---|
| N° | 104 |
| ID | MTC_0104 |
| Nombre de la prueba | HU03-CA4: Validar los mensajes de campos obligatorios |
| Tipo | Funcional |
| Resultado esperado | Bajo cada campo vacío aparece su mensaje, con el campo en rojo: «El tipo es obligatorio», «La patente es obligatoria», «La marca es obligatoria» y «El año es obligatorio». El vehículo no se crea. |
| Pre condicion | Sistema levantado (Supabase + API + Front) con los datos del seed. Sesión iniciada como inspector.c1. |
| Pasos | 1. Presionar «Registrar vehículo». 2. Completar solo la nomenclatura. 3. Presionar «Registrar vehículo». |
| Datos de prueba | Nomenclatura: B-12; resto de los campos vacíos (la compañía viene preseleccionada). |
| Modulo a probar | Crear ficha de nuevo vehículo |
| Criterios de aceptacion | 4. Dado que el usuario deja uno o más campos obligatorios vacíos, cuando intenta guardar el registro, entonces el sistema debe mostrar un mensaje indicando los campos que debe completar. |
| Estrategia | Caja Negra |
| Evidencia | `Evidencias/Pruebas/Sprint 1/MTC_0104 - HU03-CA4/` |

### MTC_0106 · HU03-SEG02: Validar que un bombero no pueda registrar vehículos

| Columna | Valor |
|---|---|
| N° | 106 |
| ID | MTC_0106 |
| Nombre de la prueba | HU03-SEG02: Validar que un bombero no pueda registrar vehículos |
| Tipo | Seguridad |
| Resultado esperado | El Dashboard de bombero.c1 no muestra el botón «Registrar vehículo». La API responde 403 «No tienes permisos para esta acción» y no crea el vehículo. |
| Pre condicion | Sistema levantado (Supabase + API + Front) con los datos del seed. Sesión iniciada como bombero.c1. |
| Pasos | 1. Revisar el Dashboard. 2. Con una herramienta de API (Postman o curl) y la sesión de bombero.c1, enviar POST /api/vehiculos. |
| Datos de prueba | Body: `{"nomenclatura":"X-2","tipo":"Bomba","patente":"XXXX22","marca":"Iveco","ano_fabricacion":2020,"id_compania":1}` |
| Modulo a probar | Crear ficha de nuevo vehículo |
| Criterios de aceptacion | Solo el Teniente Tercero, el Inspector de Material Mayor y el Administrador pueden registrar vehículos. |
| Estrategia | Hibrido |
| Evidencia | `Evidencias/Pruebas/Sprint 1/MTC_0106 - HU03-SEG02/` |

### MTC_0112 · HU04-CA2: Validar que el formulario de edición muestre los datos actuales

| Columna | Valor |
|---|---|
| N° | 112 |
| ID | MTC_0112 |
| Nombre de la prueba | HU04-CA2: Validar que el formulario de edición muestre los datos actuales |
| Tipo | Funcional |
| Resultado esperado | El formulario «Editar vehículo» viene completo con los datos de B-1: nomenclatura B-1, tipo Bomba, patente KLHT21, marca Mercedes-Benz, modelo Atego 1726, año 2019, Primera Compañía. No hay campo de estado. |
| Pre condicion | Sistema levantado (Supabase + API + Front) con los datos del seed, sin ejecutar MTC_0110 todavía. Sesión iniciada como inspector.c1. |
| Pasos | 1. Abrir la ficha de B-1. 2. Presionar «Editar». 3. Revisar los valores del formulario. |
| Datos de prueba | Vehículo B-1 del seed. |
| Modulo a probar | Editar ficha de un vehículo |
| Criterios de aceptacion | 2. Dado que el usuario ingresa al formulario de edición, entonces el sistema debe mostrar los datos actuales del vehículo. |
| Estrategia | Caja Negra |
| Evidencia | `Evidencias/Pruebas/Sprint 1/MTC_0112 - HU04-CA2/` |

> **Orden:** ejecutar MTC_0112 **antes** de MTC_0110, porque MTC_0110 cambia los datos de B-1. Otra opción es correr `db reset` entre ambos.

### MTC_0114 · HU04-CA6: Validar que no se guarden datos inválidos al editar

| Columna | Valor |
|---|---|
| N° | 114 |
| ID | MTC_0114 |
| Nombre de la prueba | HU04-CA6: Validar que no se guarden datos inválidos al editar |
| Tipo | Funcional |
| Resultado esperado | Se muestran «La marca es obligatoria» y «Año inválido (1900 - <año siguiente al actual>)» bajo sus campos y el formulario sigue abierto. Al presionar «Cancelar», la ficha de B-2 mantiene marca Iveco y año 2021. |
| Pre condicion | Sistema levantado (Supabase + API + Front) con los datos del seed. Sesión iniciada como teniente.c2. |
| Pasos | 1. Abrir la ficha de B-2 y presionar «Editar». 2. Borrar la marca y escribir el año 1850. 3. Presionar «Guardar cambios». 4. Presionar «Cancelar» y revisar la ficha. |
| Datos de prueba | Vehículo B-2; Marca: (vacía); Año: 1850. |
| Modulo a probar | Editar ficha de un vehículo |
| Criterios de aceptacion | 3. Dado que el usuario modifica campos, cuando selecciona «Guardar cambios», entonces el sistema valida la información. 6. Dado que intenta guardar información inválida o incompleta, entonces el sistema muestra los errores y mantiene la información anterior. |
| Estrategia | Caja Negra |
| Evidencia | `Evidencias/Pruebas/Sprint 1/MTC_0114 - HU04-CA6/` |

### MTC_0116 · HU04-VAL01: Validar que no se pueda asignar una patente ya registrada al editar

| Columna | Valor |
|---|---|
| N° | 116 |
| ID | MTC_0116 |
| Nombre de la prueba | HU04-VAL01: Validar que no se pueda asignar una patente ya registrada al editar |
| Tipo | Funcional |
| Resultado esperado | Bajo Patente aparece «Esta patente ya está registrada» y debajo del formulario «Ya existe un vehículo registrado con la patente JXPS48». La ficha de B-1 conserva su patente. |
| Pre condicion | Sistema levantado (Supabase + API + Front) con los datos del seed. Sesión iniciada como inspector.c1. R-1 tiene la patente JXPS48. |
| Pasos | 1. Abrir la ficha de B-1 y presionar «Editar». 2. Cambiar la patente por la de R-1. 3. Presionar «Guardar cambios». |
| Datos de prueba | Vehículo B-1; nueva patente: JXPS-48. |
| Modulo a probar | Editar ficha de un vehículo |
| Criterios de aceptacion | La patente de un vehículo es única (HU03 CA5), también al editar. |
| Estrategia | Caja Negra |
| Evidencia | `Evidencias/Pruebas/Sprint 1/MTC_0116 - HU04-VAL01/` |

### MTC_0118 · HU04-SEG01: Validar los permisos para editar vehículos

| Columna | Valor |
|---|---|
| N° | 118 |
| ID | MTC_0118 |
| Nombre de la prueba | HU04-SEG01: Validar los permisos para editar vehículos |
| Tipo | Seguridad |
| Resultado esperado | 1) La ficha de B-1 no muestra «Editar» para bombero.c1 y la API le responde 403 «No tienes permisos para esta acción». 2) Para teniente.c1, PUT /api/vehiculos/3 (B-2, Segunda Compañía) responde 404 «Vehículo no encontrado». En ningún caso cambian los datos. |
| Pre condicion | Sistema levantado (Supabase + API + Front) con los datos del seed. |
| Pasos | 1. Iniciar sesión como bombero.c1, abrir la ficha de B-1 y buscar «Editar». 2. Con una herramienta de API y la sesión de bombero.c1, enviar PUT /api/vehiculos/1. 3. Iniciar sesión como teniente.c1 y enviar PUT /api/vehiculos/3. |
| Datos de prueba | Body: `{"nomenclatura":"B-1","tipo":"Bomba","patente":"KLHT21","marca":"Mercedes-Benz","modelo":"Atego 1726","ano_fabricacion":2019,"id_compania":1}` (para el paso 3, mismo body con `"id_compania":2`). |
| Modulo a probar | Editar ficha de un vehículo |
| Criterios de aceptacion | Solo el Teniente Tercero, el Inspector y el Administrador editan vehículos, y solo los de su compañía (el administrador, cualquiera). |
| Estrategia | Hibrido |
| Evidencia | `Evidencias/Pruebas/Sprint 1/MTC_0118 - HU04-SEG01/` |

---

## C. Orden de ejecución sugerido (Sprint 1, HU03 y HU04)

1. `npx supabase db reset`
2. MTC_0070 → MTC_0080 → MTC_0090 → MTC_0100 → MTC_0102 → MTC_0104 → MTC_0106
3. MTC_0112 → MTC_0110 → MTC_0114 → MTC_0116 → MTC_0118

## D. Otros pendientes del plan

- **Hoja «Control», celda Q10:** cuenta `S3:S27`, cuando el resto de las celdas de esa columna cuentan `S2:S26`. Parece un desfase de una fila.
- **MTC_0250 · HU05-UAT01:** sigue «No ejecutado», aunque la tarjeta HU05 ya está cerrada en Trello.
