_.constructor("Views.SignupPrompt", View.Template, {
  content: function() { with(this.builder) {
    div({id: "signupPrompt", 'class': "floatingCard dropShadow", style: "display: none;"}, function() {
      form(function() {
        h1("Sign up to participate:");

        label("First Name");
        input({name: "firstName"}).ref('firstName');
        label("Last Name");
        input({name: "lastName"});
        label("Email Address");
        input({name: "emailAddress"});
        label("Choose Your Password");
        input({name: "password", type: "password"});

        input({type: "submit", value: "Sign Up", 'class': "glossyBlack roundedButton"});

        div({id: "login"}, function() {
          div("Already a member?");
          a("Click here to log in.", {href: '#'}).click('toggleForms');
        });
      }).ref('signupForm')
        .submit('submitSignupForm');

      form({style: "display: none;"}, function() {
        h1("Log in to participate:");

        label("Email Address");
        input({name: "emailAddress"});
        a({id: "forgotPassword", href: "/request_password_reset" }, "forgot my password")

        label("Password");
        input({name: "password", type: "password"});

        input({type: "submit", value: "Log In", 'class': "glossyBlack roundedButton"});
        div({id: "signup"}, function() {
          div("Not yet a member?");
          a("Click here to sign up.", {href: '#'}).click('toggleForms');
        });
      }).ref('loginForm')
        .submit('submitLoginForm');
    });
  }},

  viewProperties: {
    beforeShow: function() {
      Application.layout.darkenBackground.fadeIn();
      Application.layout.darkenBackground.one('click', this.hitch('hide'));
    },

    afterShow: function() {
      this.position({
        my: "center",
        at: "center",
        of: Application.layout.darkenBackground
      });
      this.firstName.focus();
    },

    afterHide: function() {
      Application.layout.darkenBackground.hide();
      if (this.future) this.future.triggerFailure();
    },

    toggleForms: function() {
      this.signupForm.toggle();
      this.loginForm.toggle();
      this.find("input:visible:first").focus();
      
      return false;
    },

    submitSignupForm: function() {
      Server.post("/signup", { user: _.underscoreKeys(this.signupForm.fieldValues()) })
        .onSuccess(this.hitch('userEstablished'));
      return false;
    },

    submitLoginForm: function() {
      Server.post("/login", _.underscoreKeys(this.loginForm.fieldValues()))
        .onSuccess(this.hitch('userEstablished'));
      return false;
    },

    userEstablished: function(data) {
      console.debug("UId");
      Application.currentUserIdEstablished(data.current_user_id)
      this.future.triggerSuccess();
      delete this.future;
      this.hide();
    }
  }
});