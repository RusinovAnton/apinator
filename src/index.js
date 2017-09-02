import jsonp from 'jsonp';


const DEFAULT_AKINATOR_API_URL = 'http://api-en4.akinator.com/ws/';
const DEFAULT_PLAYER_NAME = 'Player1';
const SUCCESS_GUESS_PROGRESSION = 95;
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
   *
   * @param {object} error
   * @return {undefined}
   */
  static handleError (error) {
    console.warn(error);
    // TODO: throw mb?
    // throw error;
  }

  /**
   * Initialize Akinator API wrapper.
   *
   * @constructor
   * @param {object} [opts]
   * @param {string} [opts.apiUrl = DEFAULT_AKINATOR_API_URL] - akinator api url
   * @param {string} [opts.playerName = DEFAULT_PLAYER_NAME] - enter player name
   * @param {function} onAsk
   * @param {function} onFound
   */
  constructor (onAsk, onFound, opts = {}) {
    const { apiUrl = DEFAULT_AKINATOR_API_URL, playerName = DEFAULT_PLAYER_NAME } = opts;

    this.onAsk = onAsk;
    this.onFound = onFound;
    this.playerName = playerName;
    this.step = 0;
    this.url = apiUrl;
    this.sendAnswer = this.sendAnswer.bind(this);
  }

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
      .catch(Apinator.handleError);
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
   * @param {*} answerId
   * @return {undefined}
   */
  sendAnswer (answerId) {
    const answerUrl = `${this.url}answer?session=${this.session}&signature=${this.signature}&step=${this.step}&answer=${answerId}`;

    this.request(answerUrl)
      .then((response) => {
        const { answers, question, isFound } = this.transformResponse(response.parameters);

        if (isFound) {
          this.getCharacters();
        }
        else {
          this.step++;
          this.ask(question, answers);
        }
      })
      .catch(Apinator.handleError);
  };

  /**
   *
   * @return {undefined}
   */
  getCharacters () {
    const getCharactersUrl = `${this.url}list?session=${this.session}&signature=${this.signature}&step=${this.step}&size=2&max_pic_width=246&max_pic_height=294&pref_photos=VO-OK&mode_question=0`;

    this.request(getCharactersUrl)
      .then((response) => {
        const elements = response.parameters.elements;
        const characters = elements.map((element, i) => {
          return {
            id: element.element.id,
            name: element.element.name,
            probability: element.element.proba
          };
        });

        this.onFound(characters);
        this.step++;
      })
      .catch(Apinator.handleError);
  };

  /**
   * Extract question, answers and isFound from response.
   *
   * @param {object} responseParams
   * @return {{question: {id: number, text: string}, answers: Array, isFound: boolean}}
   */
  transformResponse (responseParams) {
    const parameters = responseParams.step_information ? responseParams.step_information : responseParams;
    const { answers, questionid, question, progression } = parameters;

    return {
      question: {
        id: questionid,
        text: question
      },
      answers: this.mapAnswers(answers),
      isFound: parseInt(progression, 10) >= SUCCESS_GUESS_PROGRESSION
    };
  };

  mapAnswers (answers) {
    this.answers = this.answers || answers.map(({ answer }, index) => {
      return {
        id: index,
        text: answer
      };
    });

    return this.answers;
  }
}

export default Apinator;
