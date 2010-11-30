_.constructor("Views.Layout", View.Template, {
  content: function() { with(this.builder) {

    div({id: "application"}, function() {
      div({id: "notification", style: "display: none"}).ref("notification");
      div({id: "darkenBackground", style: "display: none"})
        .click('hideFeedbackForm')
        .ref('darkenBackground');
      div({id: "feedback", style: "display: none", 'class': "dropShadow"}, function() {
        div({'class': "dismissX"}).click('hideFeedbackForm');
        div({id: "thanks", 'class': "largeFont"}, function() {
          text("Thanks for taking the time to talk to us! Feel free to get in touch with us via email at ");
          a({href: "mailto:admin@hyperarchy.com"}, "admin@hyperarchy.com");
          text(".")
        });
        textarea().ref("feedbackTextarea");
        input({type: "submit", 'class': "largeFont", value: "Send Feedback"}).click('sendFeedback');
      }).ref("feedbackForm");

      div({'class': "container12"}, function() {
        div({id: "header", 'class': "grid12"}, function() {
          div({'class': "grid3 alpha"}, function() {
            div({id: "logo"}).click('goToLastOrganization');
          });

          div({'class': "grid9 omega"}, function() {
            a({'class': "logout headerItem", href: "#"}, "Log Out").click(function() {
              $("<form action='/logout' method='post'>").appendTo($("body")).submit();
            });
            a({'class': "feedback headerItem", href: "#"}, "Feedback").click('showFeedbackForm');

            a({'class': "feedback headerItem", href: "#view=account"}, "Account");

            a({'class': "headerItem dropdownLink", href: "#"}, "Admin")
              .ref('adminMenuLink')
              .click('toggleAdminMenu');

            ol({'class': "dropdownMenu"}, function() {
            }).ref('adminMenu');

            a({'class': "headerItem dropdownLink", href: "#"}, "Organizations")
              .ref('organizationsMenuLink')
              .click('toggleOrganizationsMenu');

            ol({'class': "dropdownMenu"}, function() {
              li(function() {
                a({href: "#view=addOrganization"}, "Add Organization...")
              }).ref('addOrganizationLi')
            }).ref('organizationsMenu');
          });
        });
        subview("welcomeGuide", Views.WelcomeGuide);
      }).ref('body');
    })
  }},

  viewProperties: {
    initialize: function() {
      window.notify = this.hitch('notify');

      _.each(this.views, function(view) {
        view.hide();
        this.body.append(view);
      }, this);

      this.populateOrganizations();
    },

    populateOrganizations: function() {
      var memberships = Application.currentUser().confirmedMemberships();

      if (Application.currentUser().admin()) {
        Organization.onEach(function(organization) {
          this.populateOrganization(organization, true);
        }, this);
      } else {
        this.adminMenuLink.hide(); // will be shown if needed
        memberships.onEach(function(membership) {
          var organization = membership.organization();
          this.populateOrganization(organization, membership.role() == "owner");
        }, this);
      }

      Organization.onRemoteUpdate(function(organization, changes) {
        if (!changes.name) return;
        var name = organization.name();
        var selector = 'a[organizationId=' + organization.id() + ']';
        this.organizationsMenu.find(selector).html(name);
        this.adminMenu.find(selector).html(name + " Admin");
      }, this);
    },

    populateOrganization: function(organization, addToAdminMenu) {
      this.addOrganizationLi.before(View.build(function(b) {
        b.li(function() {
          b.a({href: "#", organizationId: organization.id()}, organization.name()).click(function(view, e) {
            $.bbq.pushState({view: "organization", organizationId: organization.id()});
            e.preventDefault();
          });
        });
      }));

      if (addToAdminMenu) {
        this.adminMenuLink.show();
        this.adminMenu.append(View.build(function(b) {
          b.li(function() {
            b.a({href: "#", organizationId: organization.id()}, organization.name() + " Admin").click(function(view, e) {
              $.bbq.pushState({view: "editOrganization", organizationId: organization.id()});
              e.preventDefault();
            });
          });
        }))
      }
    },

    notify: function(message) {
      this.notification.html(message);
      this.notification.slideDown('fast');
      _.delay(_.bind(function() {
        this.notification.slideUp('fast');
        this.notification.empty();
      }, this), 3000);
    },

    switchViews: function(selectedView) {
      _.each(this.views, function(view) {
        if (view === selectedView) {
          view.show();
        } else {
          view.hide();
        }
      });
    },

    toggleOrganizationsMenu: function(elt, e) {
      e.preventDefault();
      this.toggleMenu(this.organizationsMenuLink, this.organizationsMenu);
    },

    toggleAdminMenu: function(elt, e) {
      e.preventDefault();
      this.toggleMenu(this.adminMenuLink, this.adminMenu);
    },

    toggleMenu: function(link, menu) {
      if (menu.is(":visible")) return;

      menu.show().position({
        my: "left top",
        at: "left bottom",
        of: link
      });

      _.defer(function() {
        $(window).one('click', function() {
          menu.hide();
        });
      });
    },

    showFeedbackForm: function(elt, e) {
      this.darkenBackground.show();

      this.feedbackForm
        .show()
        .position({
          my: "center",
          at: "center",
          of: this.darkenBackground
        });

      e.preventDefault();
    },

    hideFeedbackForm: function(elt, e) {
      this.darkenBackground.hide();
      this.feedbackForm.hide();
    },

    sendFeedback: function() {
      Server.post("/feedback", {
        feedback: this.feedbackTextarea.val()
      }).onSuccess(function() {
        this.hideFeedbackForm();
        this.notify("Thanks for the feedback!")
      }, this);
    },

    goToLastOrganization: function() {
      var organizationId = Application.currentUser().lastVisitedOrganization().id();
      $.bbq.pushState({view: "organization", organizationId: organizationId }, 2);
    }
  }
});
