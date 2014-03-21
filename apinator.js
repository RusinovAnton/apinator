	var Apinator = function()
	{
		this.url = 'http://api-fr1.akinator.com/ws/';
		this.session, this.signature, this.onAsk;
		this.step = 0;
	}
	
	Apinator.prototype.hello = function(onAsk, onFound)
	{
		this.onAsk = onAsk;
		this.onFound = onFound;
	
		jQuery.ajax({
			url: this.url + 'new_session?partner=1&player=apinator',
			dataType: 'jsonp',
			error: function(){console.error(arguments)},
			success: function(response) {
				this.session = response.parameters.identification.session;
				this.signature = response.parameters.identification.signature;
				
				response = this.extractQuestion(response);
				
				this.onAsk(response.question, response.answers);
				
			}.bind(this)
		});
	
	};
	
	Apinator.prototype.extractQuestion = function(response)
	{
		var parameters = response.parameters;
		if (parameters.step_information)
			parameters = parameters.step_information;

		var question = {
			id: parameters.questionid,
			text: parameters.question
		};
		var answers = [];
		jQuery.each(parameters.answers, function(id, answer) {
			answers.push({
				id: id,
				text: answer.answer
			});
		});
		
		return {question: question, answers: answers, last: parameters.progression == 100};
	}
	
	Apinator.prototype.sendAnswer = function(answerId)
	{
		jQuery.ajax({
			url: this.url + 'answer?session=' + this.session + '&signature=' + this.signature + '&step=' + this.step + '&answer=' + answerId,
			dataType: 'jsonp',
			error: function(){console.error(arguments)},
			success:  function(response) {
		
				response = this.extractQuestion(response);
				if (response.last)
					this.getCharacters();
				else
					this.onAsk(response.question, response.answers);
			}.bind(this)
		});
		
		this.step++;
	}

	Apinator.prototype.getCharacters = function()
	{
		jQuery.ajax({
			url: this.url + 'list?session=' + this.session + '&signature=' + this.signature + '&step=' + this.step + '&size=2&max_pic_width=246&max_pic_height=294&pref_photos=OK-FR&mode_question=0',
			dataType: 'jsonp',
			error: function(){console.error(arguments)},
			success:  function(response) {
				
				var characters = [];
				jQuery.each(response.parameters.elements, function(i, element) {

					characters.push({
						id: element.element.id,
						name: element.element.name,
						probability: element.element.proba
					});
				
				});
				
				this.onFound(characters);
				
			}.bind(this)
		});
		
		this.step++;
	}
