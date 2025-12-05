

`lista-compra` es una pequeña aplicación Web (React + Vite) para gestionar una lista de la compra compartida y llevar seguimiento de precios por supermercado. Soporta inicio por PIN (salas), añadir elementos a la lista, registrar precios por producto y vincular precios a la lista.

**Características principales**
- **Inicio por PIN**: acceso sencillo mediante un PIN que corresponde a una "room" en Firestore.
- **Lista de la compra**: añadir, marcar como completado y borrar ítems.
- **Registro de precios**: añadir precios por producto y supermercado, ver fecha y formateo en Euros.
- **Sincronización en tiempo real**: usa Firestore `onSnapshot` para actualizar la UI en tiempo real.
- **Catálogo de supermercados**: el desplegable de supermercados se carga desde la colección `supermarkets` en Firestore.
- **Reutilizar precio en la lista**: desde la vista de precios puedes añadir un producto directamente a la lista.

**Colecciones en Firestore (estructura esperada)**
- **codes**: documentos con el PIN (id) y metadatos (por ejemplo `active`, `lastActive`).
- **items**: elementos de la lista. Campos típicos: `name`, `completed`, `createdAt`, `roomId`.
- **prices**: registro de precios. Campos: `product`, `price` (number), `supermarket`, `roomId`, `createdAt`, `updatedAt`.
- **supermarkets**: (opcional) lista de supermercados con campos: `name`.

**Requisitos**
- Node.js 16+ (o compatible con Vite)
- Cuenta de Firebase con Firestore y Auth habilitados (anónimo)

**Instalación (local)**
- Clona el repo y entra en la carpeta:

	```bash
	git clone https://github.com/danicuerva96/lista-compra.git
	cd lista-compra
	```

- Instala dependencias:

	```bash
	npm install
	```

**Configurar Firebase**
- Este proyecto espera un archivo `src/firebase.js` que exporte `db` y `auth` (Firestore y Auth). Hay un ejemplo en `src/firebase.js` con una configuración; si usas tu propio proyecto Firebase, reemplaza `firebaseConfig` con el tuyo.
- Revisa las reglas de Firestore para permitir lecturas/escrituras según tu modelo. En desarrollo puedes usar reglas menos restrictivas, pero en producción asegura el acceso por autenticación y permisos por `roomId`.

**Ejecutar en desarrollo**

- Con Vite (exponer a la red para probar desde móviles):

	```bash
	npm run dev -- --host
	```

- Para abrir desde otro dispositivo en la misma red: descubre la IP del equipo y usa `http://<IP>:5173` (ej. `http://192.168.1.12:5173`).

**Probar en móvil / HTTPS**
- Si necesitas HTTPS (service workers / PWA), usa un túnel como `ngrok` o `localtunnel`:

	```bash
	npx ngrok http 5173
	# o
	npx localtunnel --port 5173 --subdomain midemo123
	```

- Si tienes Android y prefieres USB, usa `adb reverse`:

	```bash
	adb reverse tcp:5173 tcp:5173
	# en el móvil abre http://localhost:5173
	```

**Uso (rápido)**
- Al abrir la app, introduce un PIN de 4 dígitos. Si el PIN no existe en `codes` la app mostrará error.
- En la pestaña **Lista** puedes añadir elementos y marcarlos.
- En la pestaña **Precios** puedes:
	- Añadir/actualizar precios por producto y seleccionar supermercado (o `Otro`).
	- Añadir rápidamente un producto con precio a la lista con el botón `＋ Añadir`.

**Desarrollo y deploy**
- Para compilar la versión de producción:

	```bash
	npm run build
	```

- Sirve la carpeta `dist` con un servidor estático o conecta a tu hosting (Vercel, Netlify, Firebase Hosting, etc.).

**Consejos y notas**
- Si no ves datos que sí están en la consola de Firebase revisa que `roomId` coincida entre la sala y los documentos (`prices`/`items`).
- Si recibes `permission-denied` en la consola: revisa las reglas de Firestore.
- Para pruebas rápidas desde móvil, usar `npm run dev -- --host` suele ser lo más simple.

**Contribuir**
- Forkea el repo y abre un pull request. Mantén las PR pequeñas y con mensajes claros.

**Contacto**
- Autor: danicuerva96
