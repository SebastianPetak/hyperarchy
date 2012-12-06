window.initialize = ->
  $ ->
    pusher = new Pusher(PUSHER_API_KEY)
    channel = pusher.subscribe(PUSHER_CHANNEL)
    channel.bind 'operation', (operation) ->
      console.log "got operation", _.clone(operation)
      Monarch.Repository.update(operation)

    $('body').append(new Views.Application)

    $('time').timeago()
