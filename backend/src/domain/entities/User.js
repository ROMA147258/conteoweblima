class User {
  constructor({
    id,
    dni,
    nombre,
    rol,
    ubicacion,
    colegio,
    mesa,
    estado,
    origenHoja
  }) {
    this.id = id;
    this.dni = dni;
    this.nombre = nombre;
    this.rol = rol || 'Personero';
    this.ubicacion = ubicacion;
    this.colegio = colegio;
    this.mesa = mesa;
    this.estado = estado;
    this.origenHoja = origenHoja || 'Usuarios';
  }
}

module.exports = User;
