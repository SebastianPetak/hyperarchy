class Models.User extends Monarch.Record
  @tableName = 'User'
  @extended(this)

  @columns
    fullName: 'string'
    avatarUrl: 'string'
    superuser: 'boolean'
    superuserEnabled: 'boolean'

  @hasMany 'memberships'
  @hasMany 'groups', through: 'memberships'
  @hasMany 'answers', foreignKey: 'creatorId'
  @hasMany 'preferences'
  @hasMany 'rankings'

  @currentUserId: null # assigned by Rails

  @getCurrent: ->
    @find(@currentUserId)

  preferencesForQuestion: (question) ->
    @preferences().where(questionId: question.id())

  afterCreate: ->
    @subscribe() if @id() is @constructor.currentUserId

  subscribe: ->
    Monarch.subscribe(@getChannelName())

  getChannelName: ->
    "private-user-#{@id()}"
