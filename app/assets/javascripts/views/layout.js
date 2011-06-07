//= require_directory ./lightboxes

_.constructor("Views.Layout", View.Template, {
  content: function() { with(this.builder) {
    div({id: "layout"}, function() {

      div({id: "header"}, function() {
        div({id: "header-content"}, function() {
          h1("HYPERARCHY");
          div({id: "menu-items"}, function() {
            subview('accountMenu', Views.Layout.AccountMenu);
          });
        });
      });

      div({id: "body"});

      div({id: "overlays"}, function() {
        subview("loginForm", Views.Lightboxes.LoginForm);
        subview("signupForm", Views.Lightboxes.SignupForm);
      });

      div({id: "darkened-background"}).ref("darkenedBackground");
    });
  }},

  viewProperties: {
    propertyAccessors: ['currentUser'],

    currentUserId: {
      change: function(id) {
        this.currentUser(User.find(id));
      }
    }
  }
});
