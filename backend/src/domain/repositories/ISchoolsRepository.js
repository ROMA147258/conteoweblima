/**
 * Interfaz de Repositorio de Colegios / Locales
 */
export class ISchoolsRepository {
  async getAllSchools(filters) {
    throw new Error('Método no implementado');
  }

  async getSchoolsByDistrict(distrito) {
    throw new Error('Método no implementado');
  }
}
