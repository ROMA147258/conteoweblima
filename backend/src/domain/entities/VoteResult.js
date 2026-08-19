class VoteResult {
  constructor({
    id,
    fechaHora,
    personero,
    dni,
    departamento,
    provincia,
    ubicacion,
    colegio,
    numeroMesa,
    origen,
    provincial = {},
    distrital = {}
  }) {
    this.id = id;
    this.fechaHora = fechaHora;
    this.personero = personero;
    this.dni = dni;
    this.departamento = departamento || 'Lima';
    this.provincia = provincia || 'Lima';
    this.ubicacion = ubicacion; // Distrito
    this.colegio = colegio;
    this.numeroMesa = numeroMesa;
    this.origen = origen ? origen.toUpperCase() : 'MANUAL'; // MANUAL vs IMAGEN/OCR
    this.provincial = provincial;
    this.distrital = distrital;
  }
}

module.exports = VoteResult;
