_.constructor('Views.Pages.Election.CandidateLi', Monarch.View.Template, {
  content: function(params) { with(this.builder) {
    li(params.candidate.body()).click(function() {
      History.pushState(null, null, params.candidate.url());
    });
  }},

  viewProperties: {
      
  }
});