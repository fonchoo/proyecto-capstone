# MTC_0250 – HU05-UAT01: Aceptación del reporte de falla

Pauta para el observador. Imprimir o tener abierta durante la sesión.

## Datos de la sesión

| Campo | Valor |
|---|---|
| Fecha | ____-____-______ |
| Usuario final (bombero voluntario) | ______________________ (compañía: ________) |
| Observador (equipo) | ______________________ |
| Cuenta usada | bombero.c1@sigmave.cl (clave de prueba según `Backend/supabase/seed.sql`) u otra creada para la sesión: ______________ |
| Dispositivo / navegador | ______________________ |
| Hora de inicio / término | ____:____ / ____:____ |

## Antes de empezar (preparación)

1. Sistema levantado: Supabase + API + Front (`http://localhost:5173`).
2. Navegador en la pantalla de **login**, sin sesión iniciada.
3. Tener a mano un cronómetro.
4. **No** mostrar la app al usuario antes de la sesión.

## Paso 1 – Explicar el objetivo (sin guiar)

Leer tal cual, sin agregar instrucciones de uso:

> "Queremos saber si esta aplicación les sirve para avisar cuando un carro tiene una falla.
> Imagina que acabas de detectar un problema en uno de los carros de tu compañía.
> Usa el sistema para avisarlo, como lo harías en un turno real. Yo solo voy a mirar y tomar notas;
> si te quedas pegado, dímelo en voz alta, pero intenta resolverlo solo."

Entregar solo el correo y la clave de la cuenta.

## Paso 2 – Tarea

> "Reporta una falla de cualquier carro de tu compañía. La falla la eliges tú."

El observador **no** indica dónde hacer clic. Si el usuario lleva más de 1 minuto sin avanzar,
anotar "ayuda" en la tabla y dar la pista mínima posible.

## Paso 3 – Registro del observador

Cronometrar desde que ve la pantalla de login hasta que aparece «Reporte Enviado».

| Momento | Tiempo (mm:ss) | Qué hizo / dónde dudó | ¿Pidió ayuda? |
|---|---|---|---|
| Inicio de sesión | | | Sí / No |
| Encontrar el vehículo | | | Sí / No |
| Abrir «Reportar Falla» | | | Sí / No |
| Elegir urgencia | | | Sí / No |
| Escribir la descripción | | | Sí / No |
| Enviar y ver la confirmación | | | Sí / No |
| **Tiempo total** | | | |

Errores observados (mensajes, clics equivocados, campos que no entendió):

- 
- 

N° de reporte generado: ______ · Vehículo: ______ · Urgencia elegida: ______ · Descripción: ______________________

## Paso 4 – Preguntas de cierre

1. ¿Pudiste reportar la falla sin ayuda? ¿Qué fue lo más difícil?
2. ¿Así es como avisan hoy una falla en la compañía? ¿Qué cambia respecto de cómo lo hacen ahora?
3. ¿La urgencia (Alta / Media / Baja) te parece suficiente para describir la gravedad?
4. ¿Falta algún dato que normalmente informarían (kilometraje, foto, quién iba manejando, etc.)?
5. ¿Te queda claro qué pasa después de enviar el reporte (a quién le llega, que el carro queda No Operativo)?
6. En una escala de 1 a 5, ¿qué tan útil te parece para el trabajo de la compañía? ¿Por qué?

Respuestas:

1. 
2. 
3. 
4. 
5. 
6. 

## Criterio de resultado

- **OK**: reporta la falla sin ayuda (o con una pista menor) y confirma que el flujo le sirve.
- **NOK**: no logra reportar sin ayuda, o indica que el flujo no responde a cómo trabajan.

Resultado: **OK / NOK** · Mejoras sugeridas para el backlog:

- 
- 

## Texto para «Resultado obtenido» en la planilla

> Sesión UAT el __-__-____ con ____________ (bombero voluntario, ____ compañía). Reportó la falla de ____ en mm:ss,
> [sin ayuda / con __ pistas]. Comentarios: ______________________. Mejoras: ______________________.
