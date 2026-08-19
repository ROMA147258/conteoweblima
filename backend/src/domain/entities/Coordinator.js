class Coordinator {
  constructor({
    id,
    fechaHora,
    personeroNombre,
    personeroDni,
    distrito,
    local,
    coordinadorNombre,
    coordinadorDni,
    confirmacion,
    fotoUrl,
    mesa
  }) {
    this.id = id;
    this.fechaHora = fechaHora;
    this.personeroNombre = personeroNombre;
    this.personeroDni = personeroDni;
    this.distrito = distrito;
    this.local = local;
    this.coordinadorNombre = coordinadorNombre;
    this.coordinadorDni = coordinadorDni;
    this.confirmacion = confirmacion || 'PENDIENTE';
    this.fotoUrl = fotoUrl || '';
    this.mesa = mesa || '';
  }
}

module.exports = Coordinator;
