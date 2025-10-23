# Agenda ThinkIT

Esta es una aplicación de agendamiento de reuniones construida con Next.js, React, Tailwind CSS y ShadCN UI. Permite a los usuarios ver la disponibilidad de un anfitrión y reservar una cita en los horarios libres.

## Características

- **Calendario Interactivo**: Los usuarios pueden seleccionar una fecha para ver los horarios disponibles.
- **Selección de Tipo de Reunión**: Permite elegir entre reuniones de 30 o 60 minutos.
- **Formulario de Reserva**: Un formulario simple para que los usuarios introduzcan sus datos y confirmen la reunión.
- **Confirmación Instantánea**: Muestra una pantalla de confirmación con los detalles de la reunión y un enlace de Google Meet.
- **Diseño Responsivo**: La interfaz se adapta a dispositivos móviles y de escritorio.
- **Exclusión de Horarios**: No se pueden agendar citas los fines de semana ni en horarios de almuerzo predefinidos.

## Estructura del Proyecto

El proyecto sigue la estructura del App Router de Next.js.

```
src
├── app
│   ├── globals.css         # Estilos globales y variables de tema de ShadCN.
│   ├── layout.tsx          # Layout principal de la aplicación.
│   └── page.tsx            # Página de inicio que renderiza el agendador.
├── components
│   ├── ui/                   # Componentes de UI de ShadCN (Button, Calendar, Card, etc.).
│   ├── booking-confirmation.tsx # Componente de confirmación de reserva.
│   └── scheduler.tsx       # Componente principal que contiene toda la lógica de agendamiento.
├── hooks
│   └── use-toast.ts        # Hook para mostrar notificaciones.
├── lib
│   ├── actions.ts          # Acciones del servidor (Server Actions) para interactuar con las APIs.
│   ├── placeholder-images.json # Datos para imágenes de marcador de posición.
│   ├── placeholder-images.ts # Lógica para cargar imágenes de marcador de posición.
│   ├── types.ts            # Definiciones de tipos de TypeScript para el proyecto.
│   └── utils.ts            # Funciones de utilidad (ej. `cn` para clases de Tailwind).
├── ...
└── tailwind.config.ts      # Configuración de Tailwind CSS.
```

## Flujo de Datos y Componentes Principales

### 1. `src/app/page.tsx`

Es la página principal de la aplicación. Renderiza el componente `Scheduler` dentro de una estructura de página básica.

### 2. `src/components/scheduler.tsx`

Este es el corazón de la aplicación. Gestiona todo el proceso de agendamiento:

- **Estado**: Mantiene el estado del paso actual (`date`, `time`, `form`, `confirmed`), la fecha y hora seleccionadas, los horarios disponibles, etc.
- **Selección de Fecha y Tipo**:
    - El usuario selecciona un tipo de reunión (30 o 60 min).
    - El usuario elige una fecha en el componente `<Calendar>`. Los sábados y domingos están deshabilitados.
- **Obtención de Disponibilidad**:
    - Al seleccionar una fecha, se llama a la función `getAvailability` desde `src/lib/actions.ts`.
    - Esta acción del servidor realiza una petición GET a la API de disponibilidad.
- **Generación de Horarios (`generateTimeSlots`)**:
    - Esta función toma los "horarios ocupados" devueltos por la API.
    - Genera una lista de todos los posibles horarios de reunión (de 9:00 a 18:00, en intervalos de 30 minutos).
    - Filtra los horarios que se solapan con los horarios ocupados y los horarios de almuerzo (13:00, 13:30, 14:00, 14:30).
    - Muestra los horarios resultantes como botones seleccionables.
- **Formulario de Reserva**:
    - Una vez que el usuario selecciona una hora, se muestra un formulario (gestionado con `react-hook-form` y `zod` para validación) para que ingrese su nombre, apellido, email y notas opcionales.
- **Agendamiento de la Reunión**:
    - Al enviar el formulario, se llama a la función `bookMeeting` de `src/lib/actions.ts`.
    - Esta acción del servidor envía los datos del formulario a la API de reservas.
- **Confirmación**:
    - Si la reserva es exitosa, se muestra el componente `BookingConfirmation`.

### 3. `src/components/booking-confirmation.tsx`

Componente que se muestra después de una reserva exitosa. Presenta al usuario los detalles de la reunión, incluyendo la fecha, la hora y un enlace a Google Meet.

---

## APIs Externas

La aplicación interactúa con dos endpoints de una API externa alojada en `n8n`.

### 1. Obtener Disponibilidad

Esta API devuelve los horarios en los que el anfitrión **no está disponible**.

- **Función en el código**: `getAvailability` en `src/lib/actions.ts`
- **Endpoint**: `https://n8n-x1g4.onrender.com/webhook/calendar-disponibilidad`
- **Método**: `GET`
- **Parámetros de Consulta**:
    - `start`: Fecha de inicio del rango a consultar en formato ISO 8601 (ej. `2025-10-24T00:00:00.000Z`).
    - `end`: Fecha de fin del rango a consultar en formato ISO 8601 (ej. `2025-10-24T23:59:59.000Z`).
- **Respuesta JSON esperada**:

```json
{
    "disponibilidad": [
        {
            "resumen": "Nombre del Evento",
            "inicio": "2025-10-24T11:00:00-03:00",
            "fin": "2025-10-24T11:30:00-03:00"
        }
    ]
}
```

**Importante**: La lógica de la aplicación en `generateTimeSlots` está diseñada para tomar la **hora** de los eventos `inicio` y `fin` y aplicarla a la fecha que el usuario seleccionó, ya que la API puede devolver eventos de otros días aunque se filtre por un día específico.

### 2. Agendar una Reunión

Esta API recibe los datos del usuario y crea el evento en el calendario del anfitrión.

- **Función en el código**: `bookMeeting` en `src/lib/actions.ts`
- **Endpoint**: `https://n8n-x1g4.onrender.com/webhook/58739697-73e6-47ed-8ed4-430896ec2c09`
- **Método**: `POST`
- **Cuerpo de la Petición (Payload) JSON**:

```json
{
  "nombre": "string",
  "apellido": "string",
  "Tipo": "Reunión trabajo", // Valor fijo
  "duracion": "number", // 30 o 60
  "inicio": "string", // Formato: "yyyy-MM-dd HH:mm"
  "final": "string", // Formato: "yyyy-MM-dd HH:mm"
  "email": "string", // Email del invitado
  "descripcion": "string" // Notas opcionales
}
```

- **Respuesta JSON esperada**:

```json
{
  "meetingLink": "https://meet.google.com/..." // Enlace a la reunión creada
  // ...otros datos de la respuesta
}
```

---

## Cómo Ejecutar el Proyecto Localmente

### Requisitos

- Node.js (v18 o superior)
- npm o yarn

### Pasos

1.  **Clonar el repositorio**:
    ```bash
    git clone <url-del-repositorio>
    cd <nombre-del-directorio>
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Ejecutar el servidor de desarrollo**:
    ```bash
    npm run dev
    ```

    La aplicación estará disponible en `http://localhost:9002`.
