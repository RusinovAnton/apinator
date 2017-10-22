const Apinator = require('./index');


const akinator = new Apinator(onAsk, onFound, noMatch, {});

function onAsk (question, answers, sendAnswer) {
  const i = Math.floor(Math.random() * 5);
  const nextAnswer = answers[i];

  console.log(question.text, nextAnswer.text);
  setTimeout(function () {
    sendAnswer(nextAnswer.id);
  }, 500);
}

function onFound (characters) {
  jQuery.each(characters, function (i, char) {
    console.log('"' + char.name + '" (' + char.probability + ')');
  });
}

function noMatch () {
  debugger;
}

akinator.start();