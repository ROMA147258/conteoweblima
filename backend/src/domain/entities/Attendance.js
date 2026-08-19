class Attendance {
  constructor({
    id,
    fechaHora,
    nombre,
    dni,
    distrito,
    local,
    mesa,
    confirmacion,
    confirmacion1,
    confirmacion2,
    fotoUrl,
    ubicacionGps
  }) {
    this.id = id;
    this.fechaHora = fechaHora;
    this.nombre = nombre;
    this.dni = dni;
    this.distrito = distrito;
    this.local = local;
    this.mesa = mesa;
    this.confirmacion = confirmacion || 'PENDIENTE';
    this.confirmacion1 = confirmacion1 || this.confirmacion;
    this.confirmacion2 = confirmacion2 || 'PENDIENTE';
    this.fotoUrl = fotoUrl || '';
    this.ubicacionGps = ubicacionGps || '';
  }
}

module.exports = Attendance;
