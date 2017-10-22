const request = require('request-promise');

function trimSlash (path) {
  return {
    end () {
      return path.replace(/\/$/);
    },
    start () {
      return path.replace(/^\//);
    },
  };
}

/**
 *
 * @param {string} path
 * @param {object} params
 * @return {string} pathWithQueryString
 */

// TODO:
function makePathWithQueryParams (path, params) {
  let queryParams = '?';

  Object.keys(params, (key) => {

  });

  return `${trimSlash(path).end}${queryParams}`;
}

/**
 * Nodejs wrapper fro Akinator, the web genie API.
 * @class Apinator
 * @version 2.0.0
 */
class Apinator {
  /**
   * Initialize Akinator API wrapper.
   *
   * @constructor
   * @param {object} [opts]
   * @param {string} [opts.apiUrl = Apinator.DEFAULT_AKINATOR_API_URL] - akinator api url
   * @param {string} [opts.playerName = Apinator.DEFAULT_PLAYER_NAME] - enter player name
   * @param {function} onAskHandler
   * @param {function} onFoundHandler
   * @param {function} noMatchHandler
   */
  constructor (onAskHandler, onFoundHandler, noMatchHandler, opts = {}) {
    const { apiUrl = Apinator.DEFAULT_AKINATOR_API_URL, playerName = Apinator.DEFAULT_PLAYER_NAME } = opts;

    this.onAsk = onAskHandler;
    this.onFound = onFoundHandler;
    this.onNoMatch = noMatchHandler;
    this.playerName = playerName;
    this.step = 0;
    this.baseUrl = trimSlash(apiUrl).end();

    this.handleAnswerResponse = this.handleAnswerResponse.bind(this);
    this.sendAnswer = this.sendAnswer.bind(this);
  }

  /**
   *
   * @param {object} error
   * @return {undefined}
   */
  handleError (error) {
    console.warn(error);
    this.onNoMatch(error);
  }

  /**
   * API request wrapper.
   *
   * @param {string} path
   * @return {Promise.<T>}
   */
  request (path) {
    const requestUrl = `${this.baseUrl}/${trimSlash(path).start()}`;

    return request(requestUrl)
      .then((res) => {
        try {
          return JSON.parse(res);
        } catch (e) {
          return res;
        }
      })
      .then((response) => {
        if (Apinator.GUESS_COMPLETION[response.completion]) {
          return response;
        }

        throw response;
      });
  }

  /**
   * Initialize Akinator session.
   *
   * @return {undefined}
   */
  start () {
    const newSessionUrl = `new_session?partner=1&player=${this.playerName}`;

    this.request(newSessionUrl)
      .then((response) => {
        this.session = response.parameters.identification.session;
        this.signature = response.parameters.identification.signature;

        const { question, answers } = this.transformResponse(response.parameters);
        this.ask(question, answers);
      })
      .catch(this.handleError);
  }

  /**
   * Call onAskHandler.
   *
   * @param {object} question
   * @param {Array} answers
   * @return {undefined}
   */
  ask (question, answers) {
    this.onAsk(question, answers, this.sendAnswer);
  }

  /**
   * Send chosen answerId.
   *
   * @param {number} answerId - index of user's chosen answer
   * @return {undefined}
   */
  sendAnswer (answerId) {
    const answerUrl = `answer?session=${this.session}&signature=${this.signature}&step=${this.step}&answer=${answerId}`;

    this.request(answerUrl)
      .then(this.handleAnswerResponse);
  };

  handleAnswerResponse (response) {
    const { answers, question, isAbleToFind } = this.transformResponse(response.parameters);

    if (isAbleToFind) {
      this.stepOfLastGuess = this.step;
      this.list()
        .then((elements) => {
          this.onFound(elements);
          this.step++;
        });
    }
    else {
      this.step++;
      this.ask(question, answers);
    }
  }

  /**
   *
   * @param {string} currentProgression
   * @return {boolean}
   */
  isAbleToFind (currentProgression) {
    if (this.step === Apinator.CONSTRAINTS.nb_max_questions) {
      return true;
    }

    if ((this.step - this.stepOfLastProp) < Apinator.CONSTRAINTS.ecart_question_entre_prop) {
      return false;
    }

    if (currentProgression > Apinator.CONSTRAINTS.percentage_list
      || (this.step - this.stepOfLastProp) === Apinator.CONSTRAINTS.questions_max_avant_prop) {
      return this.step !== 75;
    }

    return false;
  }

  /**
   *
   * @return {Promise<T>}
   */
  list () {
    const listUrl = `/list?session=${this.session}&signature=${this.signature}&step=${this.step}&size=2&max_pic_width=246&max_pic_height=294&pref_photos=VO-OK&mode_question=0`;

    return this.request(listUrl)
      .then((response) => {
        const elements = response.parameters.elements;
        return elements.map(({ element }) => {
          return {
            id: element.id,
            name: element.name,
            probability: element.proba,
          };
        });
      });
  };

  // TODO:
  // exclusion() {}

  /**
   * Extract question, answers and isAbleToFind from response.
   *
   * @param {object} responseParams
   * @return {{question: {id: number, text: string}, answers: Array, isAbleToFind: boolean}}
   */
  transformResponse (responseParams) {
    const parameters = responseParams.step_information ? responseParams.step_information : responseParams;
    const { answers, questionid, question, progression } = parameters;

    return {
      question: {
        id: questionid,
        text: question,
      },
      answers: this.mapAnswers(answers),
      isAbleToFind: this.isAbleToFind(progression),
    };
  };

  /**
   *
   * @param {array} answers
   * @return {array} answers
   */
  mapAnswers (answers) {
    this.answers = this.answers || answers.map(({ answer }, index) => {
      return {
        id: index,
        text: answer,
      };
    });

    return this.answers;
  }
}

Apinator.DEFAULT_AKINATOR_API_URL = 'http://api-en4.akinator.com/ws/';
Apinator.DEFAULT_PLAYER_NAME = 'Player1';
Apinator.CONSTRAINTS = {
  percentage_list: 97,
  nb_max_questions: 79,
  questions_max_avant_prop: 25,
  ecart_question_entre_prop: 5,
};
Apinator.GUESS_COMPLETION = {
  'OK': 1,
  'KO - ELEM LIST IS EMPTY': 0,
  'WARN - NO QUESTION': 0,
};

module.exports = Apinator;
