{Group, Membership, User, Question} = Models

class Views.HomePage extends View
  @content: ->
    @div id: 'home-page', class: 'container', =>

      @header =>
        @button "+ New Question", class: 'btn btn-large btn-primary pull-right', click: 'addQuestion'
        @a "Show archived", class: 'pull-right btn btn-large', href: '', outlet: 'toggleArchivedButton'
        @h1 "", outlet: 'questionsHeader'

      @subview 'questionsList', new Views.RelationView(
        attributes: { id: 'questions' }
        buildItem: (question) ->
          $$ ->
            @li =>
              @a class: 'question', href: question.getUrl(), =>
                @i class: 'icon-chevron-right icon-large'
                @img src: question.creator().avatarUrl()
                @div question.body(), class: "body"
      )

  initialize: ->
    @questionsList.onInsert = => @updateQuestionsHeader()
    @questionsList.onRemove = => @updateQuestionsHeader()

  fetchData: ({state}) ->
    @fetchPromise ?= Monarch.Remote.Server.fetch([Question.join(User, creatorId: 'User.id')])

  navigate: ({state}) ->
    $('#all-questions-link').hide()
    @show()
    switch state
      when 'active' then @showActive()
      when 'archived' then @showArchived()

  updateQuestionsHeader: ->
    size = @questionsList.relation.size()
    if size == 1
      @questionsHeader.text("1 Question")
    else
      @questionsHeader.text("#{size} Questions")

  showActive: ->
    @questionsList.setRelation(Question.where('archivedAt': null))
    @updateQuestionsHeader()
    @toggleArchivedButton
      .removeClass('active')
      .attr('href', '/questions/archived')

  showArchived: ->
    @questionsList.setRelation(Question.where('archivedAt !=': null))
    @updateQuestionsHeader()
    @toggleArchivedButton
      .addClass('active')
      .attr('href', '/questions')

  addQuestion: ->
    new Views.NewQuestionForm(
      onSubmit: ({body, visibility, groupId}) =>
        Question.create({body, visibility, groupId})
          .onSuccess (question) =>
            Davis.location.assign(question.getUrl())
    )
