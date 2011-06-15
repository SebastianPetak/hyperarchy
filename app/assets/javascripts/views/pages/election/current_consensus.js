_.constructor('Views.Pages.Election.CurrentConsensus', Monarch.View.Template, {
  content: function() { with(this.builder) {
    div({id: "current-consensus"}, function() {
      h2("Current Consensus");
      subview('list', Views.Components.SortedList, {
        buildElement: function(candidate) {
          return Views.Pages.Election.CandidateLi.toView({candidate: candidate});
        }
      });
    })
  }},

  viewProperties: {
    candidates: {
      change: function(candidates) {
        this.list.relation(candidates);
      }
    },

    selectedCandidate: {
      change: function(selectedCandidate) {
        this.list.find('li').removeClass('selected');
        this.list.elementForRecord(selectedCandidate).addClass('selected');
      }
    }
  }
});