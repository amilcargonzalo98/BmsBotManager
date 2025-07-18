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

