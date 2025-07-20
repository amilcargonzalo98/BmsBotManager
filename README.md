# BmsBotManager API

## Reporte de Estado de Puntos

La API recibe datos de estado utilizando el endpoint `/api/points/state`.

El cuerpo de la petición debe tener la clave `apiKey` y un arreglo `points` con los puntos a registrar.

```json
{
  "apiKey": "tu_clave_de_cliente",
  "points": [
    {
      "pointName": "SensorTemperatura",
      "ipAddress": "192.168.1.100",
      "pointType": 1,
      "pointId": 101,
      "presentValue": 36.5
    }
  ]
}
```

Cada objeto dentro de `points` describe un punto y su valor actual. El servidor validará la `apiKey`, registrará el punto si no existe y almacenará el valor recibido.


## Configuración de Twilio

Se añadió un endpoint para almacenar las credenciales de Twilio y enviar mensajes de WhatsApp.

- `GET /api/twilio` devuelve la configuración actual.
- `POST /api/twilio` guarda la configuración (`accountSid`, `authToken` y `whatsappFrom`).
- `POST /api/twilio/send` envía un mensaje de prueba recibiendo `to` y `body`.
- `POST /api/twilio/webhook` endpoint para el webhook de Twilio que recibe los mensajes entrantes.
- `GET /api/twilio/messages` devuelve los mensajes recibidos más recientes.
