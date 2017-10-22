import jsonp from 'jsonp';


/**
 *
 * @param {string} urlBase
 * @return {object}
 * @constructor
 */
function RequestService (urlBase) {
  /**
   * API call wrapper.
   *
   * @param {string} url
   * @param {object} params - query params
   * @return {Promise.<T>}
   */
  function request (url, params) {
    const requestUrl = `${urlBase}${url}?${qsStr(params)}`;

    return new Promise((resolve, reject) => {
      jsonp(requestUrl, null, (err, data) => {
        return err ? reject(err) : resolve(data);
      });
    })
      .then((response) => {
        if (GUESS_COMPLETION[response.completion]) {
          return response;
        }

        throw response;
      });
  }


  return {
    newSession (player) {
      return request('new_session', { partner: 1, player });
    },
    answer (step,) {
      return request('answer', {});
    },
  };
}

export default RequestService;