import jsonp from 'jsonp';


const DEFAULT_AKINATOR_API_URL = 'http://api-en4.akinator.com/ws/';
const DEFAULT_PLAYER_NAME = 'Player1';
const constraints = {
  percentage_list: 97,
  nb_max_questions: 79,
  questions_max_avant_prop: 25,
  ecart_question_entre_prop: 5,
};

const GUESS_COMPLETION = {
  'OK': 1,
  'KO - ELEM LIST IS EMPTY': 0,
  'WARN - NO QUESTION': 0,
};

/**
 * Javascript API wrapper for Akinator, the web genie.
 * @class Apinator
 * @version 2.0.0
 */
class Apinator {
  /**
   * Initialize Akinator API wrapper.
   *
   * @constructor
   * @param {object} [opts]
   * @param {string} [opts.apiUrl = DEFAULT_AKINATOR_API_URL] - akinator api url
   * @param {string} [opts.playerName = DEFAULT_PLAYER_NAME] - enter player name
   * @param {function} onAskHandler
   * @param {function} onFoundHandler
   * @param {function} noMatchHandler
   */
  constructor (onAskHandler, onFoundHandler, noMatchHandler, opts = {}) {
    const { apiUrl = DEFAULT_AKINATOR_API_URL, playerName = DEFAULT_PLAYER_NAME } = opts;

    this.onAsk = onAskHandler;
    this.onFound = onFoundHandler;
    this.onNoMatch = noMatchHandler;
    this.playerName = playerName;
    this.step = 0;
    this.url = apiUrl;

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
   *
   * @param {string} url
   * @return {Promise.<T>}
   */
  request (url) {
    return new Promise((resolve, reject) => {
      jsonp(url, null, (err, data) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(data);
        }
      });
    })
      .then((response) => {
        if (GUESS_COMPLETION[response.completion]) {
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
    const newSessionUrl = `${this.url}new_session?partner=1&player=${this.playerName}`;

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
    const answerUrl = `${this.url}answer?session=${this.session}&signature=${this.signature}&step=${this.step}&answer=${answerId}`;

    this.request(answerUrl)
      .then(this.handleAnswerResponse)
      .catch(this.handleError);
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
    if (this.step === constraints.nb_max_questions) {
      return true;
    }

    if ((this.step - this.stepOfLastProp) < constraints.ecart_question_entre_prop) {
      return false;
    }

    if (currentProgression > constraints.percentage_list
      || (this.step - this.stepOfLastProp) === constraints.questions_max_avant_prop) {
      return this.step !== 75;
    }

    return false;
  }

  /**
   *
   * @return {Promise<T>}
   */
  list () {
    const listUrl = `${this.url}list?session=${this.session}&signature=${this.signature}&step=${this.step}&size=2&max_pic_width=246&max_pic_height=294&pref_photos=VO-OK&mode_question=0`;

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
      })
      .catch(this.handleError);
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

export default Apinator;
