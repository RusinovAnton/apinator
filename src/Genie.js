class Genie {
  constructor () {

  }

  /**
   *
   * @param {string} progression
   * @return {string} attitude
   */
  getAttitude (progression) {
    const trouvitude = progression;
    const oldTrouvitude = $.elokWrapperStorage.get('tmpdatas').oldprogression;
    const step = $.elokWrapperStorage.get('tmpdatas').step;
    const trouvitudeCible = step * 4;
    if (step <= 10) {
      trouvitudePonderee = (step * trouvitude + (10 - step) * trouvitudeCible) / 10;
    }
    else {
      trouvitudePonderee = 0;
    }
    if (trouvitude >= 80) {
      return 'akinator_mobile.png';
    }
    if (oldTrouvitude < 50 && trouvitude >= 50) {
      return 'akinator_inspiration_forte.png';
    }
    if (trouvitude >= 50) {
      return 'akinator_confiant.png';
    }
    if (oldTrouvitude - trouvitude > 16) {
      return 'akinator_surprise.png';
    }
    if (oldTrouvitude - trouvitude > 8) {
      return 'akinator_etonnement.png';
    }
    if (trouvitudePonderee >= trouvitudeCible) {
      return 'akinator_inspiration_legere.png';
    }
    if (trouvitudePonderee >= trouvitudeCible * .8) {
      return 'akinator_serein.png';
    }
    if (trouvitudePonderee >= trouvitudeCible * .6) {
      return 'akinator_concentration_intense.png';
    }
    if (trouvitudePonderee >= trouvitudeCible * .4) {
      return 'akinator_leger_decouragement.png';
    }
    if (trouvitudePonderee >= trouvitudeCible * .2) {
      return 'akinator_tension.png';
    }
    return 'akinator_vrai_decouragement.png';
  }
}

export default Genie;