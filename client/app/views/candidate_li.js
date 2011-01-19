_.constructor("Views.CandidateLi", View.Template, {
  content: function(params) { with(this.builder) {
    var candidate = params.candidate;
    li({ candidateId: candidate.id(), 'class': "candidate " + this.additionalClass }, function() {
      div({'class': "expandArrow"})
        .ref('expandArrow')
        .click('expandOrContract');

      div({'class': "loading candidateIcon", style: "display: none;"}).ref('loadingIcon');

      template.candidateIcon();
      div({'class': "candidateIcon detailsIcon"})
        .click('expandOrContract')
        .mouseover('showTooltip')
        .mouseout('hideTooltip')
        .ref('detailsIcon');

      div({'class': "body"}).ref('body');

      div({'class': "expandedInfoSpacer"}).ref('expandedInfoSpacer')

      div({'class': "expandedInfo", style: "display: none;"}, function() {

        label("Answer");
        div({'class': "bodyContainer noDrag"}, function() {
          textarea(candidate.body())
            .keydown(function(view, e) {
              if (e.keyCode === 13) {
                view.saveCandidate();
                e.preventDefault();
              }
            })
            .bind('keyup paste change', "deferredEnableOrDisableSaveButton")
            .ref('bodyTextarea');
          div({'class': "nonEditable"})
            .ref('nonEditableBody');
        });

        label("Details").ref("detailsLabel");
        div({'class': "detailsContainer noDrag"}, function() {
          textarea({'class': "details"})
            .bind('keyup paste change', "deferredEnableOrDisableSaveButton")
            .ref('detailsTextarea');
          div({'class': "nonEditable"})
            .ref('nonEditableDetails');
          button("Save")
            .ref('saveButton')
            .click("saveCandidate");
          button("Delete")
            .click("destroyCandidate")
            .ref('destroyButton');
          div({'class': "clear"});
        });

        div({'class': "commentsContainer noDrag"}, function() {
          subview('candidateComments', Views.CandidateCommentsList);
          div({'class': "createCommentForm"}, function() {
            textarea().ref('createCommentTextarea');
            div({'class': "clear"});

            button({'class': "createCommentButton"}, "Make a Comment")
              .ref('createCommentButton')
              .click('createComment');

            div({'class': "loading", style: "display: none;"}).ref("createCommentSpinner");
            div({'class': "clear"});
            }).ref('createCommentForm');

          div({'class': "clear"});
        });
      }).ref('expandedInfo');

      div({'class': "candidateTooltip", style: "display: none;"}, function() {
        div({'class': "tooltipDetailsContainer"}, function() {
          label("Details");
          div({'class': "nonEditable"})
            .ref('tooltipDetails');
        }).ref("tooltipDetailsContainer");

        subview('tooltipCandidateComments', Views.CandidateCommentsList);
      }).ref('tooltip');
    });
  }},

  viewProperties: {
    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle;
      this.assignBody(this.candidate.body());
      this.assignDetails(this.candidate.details());
      this.candidateComments.candidate(this.candidate);
      this.tooltipCandidateComments.candidate(this.candidate);

      this.subscriptions.add(this.candidate.onUpdate(function(changes) {
        if (changes.body) {
          this.assignBody(changes.body.newValue);
        }
        if (changes.details) {
          this.assignDetails(changes.details.newValue);
        }
      }, this));
      this.showOrHideDetailsOrComments();
      
      this.subscriptions.add(this.candidate.comments().onInsert(this.hitch("showOrHideDetailsOrComments")));
      this.subscriptions.add(this.candidate.comments().onRemove(this.hitch("showOrHideDetailsOrComments")));

      this.defer(function() {
        this.bodyTextarea.elastic();
        this.detailsTextarea.elastic();
        $('#mainContent').append(this.tooltip);
      });

      if (this.candidate.editableByCurrentUser()) {
        this.nonEditableBody.hide();
        this.nonEditableDetails.hide();
      } else {
        this.detailsTextarea.hide();
        this.bodyTextarea.hide();
        this.saveButton.hide();
        this.destroyButton.hide();
      }

      this.defer(function() {
        this.createCommentTextarea.elastic();
      });
    },

    afterRemove: function() {
      this.subscriptions.destroy();
      this.candidateComments.remove();
      this.tooltipCandidateComments.remove();
    },

    expandOrContract: function() {
      if (this.expanded) {
        this.contract();
      } else {
        this.expand();
      }
    },

    expand: function() {
      if (this.expanded) return;

      this.expanded = true;
      this.bodyTextarea.focus();
      this.body.hide();
      this.hideTooltip();

      this.assignBody(this.candidate.body());
      this.assignDetails(this.candidate.details());

      this.saveButton.attr('disabled', true);
      this.expandArrow.addClass('expanded');
      this.addClass("expanded")
      this.expandedInfoSpacer.show();
      this.expandedInfo.slideDown('fast', _.repeat(function() {
        this.bodyTextarea.keyup();
        this.detailsTextarea.keyup();
      }, this));
    },

    contract: function() {
      if (!this.expanded) return;

      this.expanded = false;
      this.expandArrow.removeClass('expanded');

      this.delay(function() {
        this.expandedInfoSpacer.slideUp('fast');
        this.body.show();
      }, 90);

      this.expandedInfo.slideUp('fast', this.bind(function() {
        this.removeClass("expanded")
      }));
    },

    enableOrDisableSaveButton: function() {
      if (this.fieldsAreClean()) {
        this.saveButton.attr('disabled', true);
      } else {
        this.saveButton.attr('disabled', false);
      }
    },

    deferredEnableOrDisableSaveButton: function() {
      this.defer(function() {
        this.enableOrDisableSaveButton();
      });
    },

    fieldsAreClean: function() {
      return this.bodyTextarea.val() === this.candidate.body()
        && this.detailsTextarea.val() === this.candidate.details();
    },

    saveCandidate: function() {
      this.startLoading();
      this.saveButton.attr('disabled', true);
      this.candidate.update({
        body: this.bodyTextarea.val(),
        details: this.detailsTextarea.val()
      })
        .beforeEvents(function() {
          this.stopLoading();
          this.expandOrContract();
        }, this);
    },

    destroyCandidate: function() {
      this.startLoading();
      this.candidate.destroy()
        .onSuccess(function() {
          this.stopLoading();
        }, this);
    },

    startLoading: function() {
      this.previouslyVisibleIcons = this.find('.candidateIcon:visible');
      this.previouslyVisibleIcons.hide();
      this.loadingIcon.show();
    },

    stopLoading: function() {
      this.loadingIcon.hide();
      this.previouslyVisibleIcons.show();
    },

    assignBody: function(body) {
      this.body.html(body);
      this.bodyTextarea.val(body);
      this.bodyTextarea.keyup();
      this.nonEditableBody.html(body);
    },

    assignDetails: function(details) {
      this.detailsTextarea.val(details);
      this.detailsTextarea.keyup(); // trigger the elastic resize
      this.nonEditableDetails.html(htmlEscape(details));
      this.tooltipDetails.html(htmlEscape(details));
      this.showOrHideDetailsIcon();

      if (details) {
        if (!this.candidate.editableByCurrentUser()) {
          this.detailsLabel.show();
          this.nonEditableDetails.show();
        }
        this.tooltipDetailsContainer.show();
      } else {
        if (this.candidate.comments().empty()) this.detailsIcon.hide();
        if (!this.candidate.editableByCurrentUser()) {
          this.detailsLabel.hide();
          this.nonEditableDetails.hide();
        }
        this.tooltipDetailsContainer.hide();
      }
    },

    showTooltip: function() {
      if (this.expanded) return;

      this.showTooltipAfterDelay = true;
      this.delay(function() {
        if (!this.showTooltipAfterDelay) return;
        if (this.expanded) return;
        
        var iconOffset = this.detailsIcon.offset();
        var newOffset = { left: iconOffset.left + 20, top: iconOffset.top };
        // for some reason, if offset is not called twice, the offset is not set properly on the _first_ showing
        this.tooltip.show().offset(newOffset).offset(newOffset);
      }, 300);
    },

    hideTooltip: function() {
      this.tooltip.hide();
      this.showTooltipAfterDelay = false;
    },

    showOrHideDetailsIcon: function() {
      if (this.candidate.comments().empty() && !this.candidate.details()) {
        this.detailsIcon.hide();
      } else {
        this.detailsIcon.show();
      }
    },

    showOrHideDetailsOrComments: function() {
      this.detailsIcon.hide();
      this.tooltipDetailsContainer.removeClass("marginBottom");
      if (!this.candidate.comments().empty()) {
        this.detailsIcon.show();
        this.tooltipDetailsContainer.addClass("marginBottom");
      }
      if (this.candidate.details()) {
        this.detailsIcon.show();
      }
    },

    createComment: function(elt, e) {
      this.createCommentTextarea.blur();
      e.preventDefault();
      if (this.commentCreationDisabled) return;

      var body = this.createCommentTextarea.val();
      if (body === "") return;
      this.createCommentTextarea.val("");
      this.createCommentTextarea.keyup();
      this.commentCreationDisabled = true;

      this.createCommentSpinner.show();
      this.candidate.comments().create({body: body})
        .onSuccess(function() {
          this.createCommentSpinner.hide();
          this.commentCreationDisabled = false;
        }, this);
    }

  }
});