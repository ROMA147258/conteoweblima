class School {
  constructor({
    id,
    ubigeo,
    departamento,
    provincia,
    distrito,
    colegio,
    direccion,
    numMesas,
    latitud,
    longitud,
    coordenadasGps,
    radioMetros,
    estado
  }) {
    this.id = id;
    this.ubigeo = ubigeo;
    this.departamento = departamento;
    this.provincia = provincia;
    this.distrito = distrito;
    this.colegio = colegio;
    this.direccion = direccion;
    this.numMesas = parseInt(numMesas, 10) || 0;
    this.latitud = parseFloat(latitud) || null;
    this.longitud = parseFloat(longitud) || null;
    this.coordenadasGps = coordenadasGps;
    this.radioMetros = radioMetros;
    this.estado = estado;
  }
}

module.exports = School;
