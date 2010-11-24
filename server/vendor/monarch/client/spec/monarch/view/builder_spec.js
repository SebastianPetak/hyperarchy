//= require "../../monarch_spec_helper"

Screw.Unit(function(c) { with(c) {
  describe("Monarch.View.Builder", function() {
    var builder;
    before(function() {
      builder = new Monarch.View.Builder();
    });

    describe("auto-generated tag methods", function() {
      they("call through to #tag with their name as a first argument and return its result (this is one example of many tags)", function() {
        mock(builder, 'tag', function() {
          return "result";
        });
        expect(builder.p({'class': "coolParagraph"}, "This is a paragraph")).to(eq, "result");
        expect(builder.tag).to(haveBeenCalled, withArgs("p", {'class': "coolParagraph"}, "This is a paragraph"));
      });
    });

    describe("#toView", function() {
      var outerDivOnBuildArgs,
          brOnBuildArgs,
          helloPOnBuildArgs,
          valueOfFooWhenHelloPOnBuildIsTriggered,
          valueOfBarWhenHelloPOnBuildIsTriggered,
          goodbyePOnBuildArgs,
          helloDivOnBuildArgs;

      before(function() {
        with(builder) {
          div(function() {
            div({id: "hello"}, function() {
              p("Hello").onBuild(function(element, view) {
                helloPOnBuildArgs = _.toArray(arguments);
                valueOfFooWhenHelloPOnBuildIsTriggered = view.foo;
                valueOfBarWhenHelloPOnBuildIsTriggered = view.bar;
              });
            }).onBuild(function() {
              helloDivOnBuildArgs =  _.toArray(arguments);
            });
            br().onBuild(function() {
              brOnBuildArgs = arguments;
            });
            p("Goodbye").onBuild(function() {
              goodbyePOnBuildArgs = _.toArray(arguments);
            });
          }).onBuild(function() {
            outerDivOnBuildArgs = _.toArray(arguments);
          });
        }
      });

      it("returns the xml parsed in a jQuery wrapper", function() {
        var jqueryFragment = builder.toView();
        expect(jqueryFragment.find("div#hello")).toNot(beEmpty)
        expect(jqueryFragment.find("div#hello p")).toNot(beEmpty)
        expect(jqueryFragment.find("p:contains('Goodbye')")).toNot(beEmpty)
      });

      it("invokes onBuild instructions defined on the elements with a jQuery wrapper for that element and the jqueryFragment", function() {
        var jqueryFragment = builder.toView();
        expect(helloPOnBuildArgs[0].is("p:contains('Hello')")).to(beTrue);
        expect(helloPOnBuildArgs[1]).to(eq, jqueryFragment);

        expect(helloDivOnBuildArgs[0].is("div#hello")).to(beTrue);
        expect(helloDivOnBuildArgs[1]).to(eq, jqueryFragment);

        expect(goodbyePOnBuildArgs[0].is("p:contains('Goodbye')")).to(beTrue);
        expect(goodbyePOnBuildArgs[1]).to(eq, jqueryFragment);

        expect(brOnBuildArgs[0].is("br")).to(beTrue);
        expect(brOnBuildArgs[1]).to(eq, jqueryFragment);

        expect(outerDivOnBuildArgs[0]).to(eq, jqueryFragment);
        expect(outerDivOnBuildArgs[1]).to(eq, jqueryFragment);
      });

      it("blows up if there is not a single top-level element", function() {
        expect(function() {
          new SampleBuilder().toView()
        }).to(throwException);

        builder.div("top level element 1");
        builder.div("top level element 2");
        expect(function() {
          builder.toView()
        }).to(throwException);
      });
    });

    describe("autogenerated inline event callback declarations", function() {
      var view, rootCallbackForClick, rootCallbackForMouseover, childCallback, selfClosingTagCallback;

      before(function() {
        rootCallbackForClick = mockFunction("root callback");
        rootCallbackForMouseover = mockFunction("root callback for mouseover");
        childCallback = mockFunction("child callback");
        selfClosingTagCallback = mockFunction("self-closing tag callback");
        with(builder) {
          div({'id': "root"}, function() {
            div({'id': "child"}).mouseover(childCallback);
            br().click(selfClosingTagCallback);
            div({'id': "methodClickHandler"}).click('clickHandlerMethod');
            div({'id': "methodClickHandlerWithArgs"}).click('clickHandlerMethod', 'arg1', 'arg2');
          }).click(rootCallbackForClick).mouseover(rootCallbackForMouseover);
        }
        view = builder.toView();
        view.clickHandlerMethod = mockFunction('clickHandlerMethod');
      });


      they("attach jQuery event callbacks to the generated view that call the given callback with the view and the event", function() {
        view.click();
        expect(rootCallbackForClick).to(haveBeenCalled, once);
        expect(rootCallbackForClick.mostRecentArgs[0]).to(eq, view);
        expect(rootCallbackForClick.mostRecentArgs[1].type).to(eq, "click");

        view.find("#child").mouseover();
        expect(childCallback).to(haveBeenCalled, once);
        expect(childCallback.mostRecentArgs[0]).to(eq, view);
        expect(childCallback.mostRecentArgs[1].type).to(eq, "mouseover");

        view.find("br").click();
        expect(selfClosingTagCallback).to(haveBeenCalled, once);
        expect(selfClosingTagCallback.mostRecentArgs[0]).to(eq, view);
        expect(selfClosingTagCallback.mostRecentArgs[1].type).to(eq, "click");

        view.find("#methodClickHandler").click();
        expect(view.clickHandlerMethod).to(haveBeenCalled, once);
        expect(view.clickHandlerMethod.mostRecentArgs[0].is("#methodClickHandler")).to(beTrue);
        expect(view.clickHandlerMethod.mostRecentArgs[1].type).to(eq, "click");

        view.clickHandlerMethod.clear();
        view.find("#methodClickHandlerWithArgs").click();
        expect(view.clickHandlerMethod).to(haveBeenCalled, once);
        expect(view.clickHandlerMethod.mostRecentArgs[0]).to(eq, 'arg1');
        expect(view.clickHandlerMethod.mostRecentArgs[1]).to(eq, 'arg2');
        expect(view.clickHandlerMethod.mostRecentArgs[2].is("#methodClickHandlerWithArgs")).to(beTrue);
        expect(view.clickHandlerMethod.mostRecentArgs[3].type).to(eq, "click");
      });

      they("allow other declarations to be chained after them", function() {
        view.mouseover();
        expect(rootCallbackForMouseover).to(haveBeenCalled);
      });
    });

    describe(".bind declarations", function() {
      they("invoke the jquery bind method on the corresponding element when the view is built, mapping strings to method calls or passing the view as the first argument to functions", function() {
        var clickHandler = mockFunction('clickHandler');

        with(builder) {
          div({'id': "root"}, function() {
            div({'id': "child1"}).bind("keyup", {foo: "bar"}, "keyupMethod");
            div({'id': "child2"}).bind("keyup", "keyupMethod");
            div({'id': "child3"}).bind("click", clickHandler);
            div({'id': "child4"}).bind("click", {baz: "quux"}, clickHandler);
            div({'id': "child5"}).bind({ click: clickHandler, keyup: "keyupMethod"});
          });
        }

        var view = builder.toView();
        view.keyupMethod = mockFunction('keyupMethod');

        view.find("#child1").keyup();
        expect(view.keyupMethod).to(haveBeenCalled, once);
        expect(view.keyupMethod.mostRecentArgs[1].data).to(equal, {foo: "bar"});
        view.keyupMethod.clear();

        view.find("#child2").keyup();
        expect(view.keyupMethod).to(haveBeenCalled, once);
        view.keyupMethod.clear();

        view.find("#child3").click();
        expect(clickHandler).to(haveBeenCalled, once);
        expect(clickHandler.mostRecentArgs[0]).to(eq, view);
        clickHandler.clear();

        view.find("#child4").click();
        expect(clickHandler).to(haveBeenCalled, once);
        expect(clickHandler.mostRecentArgs[0]).to(eq, view);
        expect(clickHandler.mostRecentArgs[1].data).to(equal, {baz: "quux"});
        view.keyupMethod.clear();

        view.find("#child5").click();
        expect(clickHandler).to(haveBeenCalled);
        expect(clickHandler.mostRecentArgs[0]).to(eq, view);
        clickHandler.clear();

        view.find("#child5").keyup();
        expect(view.keyupMethod).to(haveBeenCalled, once);
        expect(view.keyupMethod.mostRecentArgs[0].is("#child5")).to(beTrue);
        view.keyupMethod.clear();
      });
    });

    describe(".ref declarations", function() {
      var view, childCallback;

      before(function() {
        childCallback = mockFunction("child callback");
        with(builder) {
          div({'id': 'root'}, function() {
            div({'id': 'child'}).ref('child').click(childCallback);
          }).ref('root');
        }
        view = builder.toView();
      });

      they("create fields on the generated view that point to the element on which .ref was called", function() {
        expect(view.root.attr('id')).to(eq, 'root');
        expect(view.child.attr('id')).to(eq, 'child');
      });

      they("allow other declarations to be chained after them", function() {
        view.child.click();
        expect(childCallback).to(haveBeenCalled);
      });
    });

    describe("#subview", function() {
      before(function() {
        _.constructor("ExampleSubviewTemplate", Monarch.View.Template, {
          content: function(props) { with (this.builder) {
            div({'class': "subview"}, function() {
              h1("Subview " + props.subviewNumber);
            });
          }},

          viewProperties: {
            foo: "foo",
            bar: "bar"
          }
        });
      });

      after(function() {
        delete window["ExampleSubviewTemplate"];
      });


      context("when given a subview name", function() {
        it("builds a view within the current view and assigns it to that name, with parentView assigned to the parent", function() {
          builder.div({id: "root"}, function() {
            builder.subview("subview1", ExampleSubviewTemplate, { subviewNumber: 1});
            builder.div({id: "notInSubview"}, function() {
              builder.h1("Not In Subview");
            });
            builder.subview("subview2", ExampleSubviewTemplate, { subviewNumber: 2});
          });

          var view = builder.toView();

          expect(view.subview1.html()).to(eq, view.find(".subview:contains('Subview 1')").html());
          expect(view.subview1.foo).to(eq, "foo");
          expect(view.subview1.bar).to(eq, "bar");
          expect(view.subview1.subviewNumber).to(eq, 1);
          expect(view.subview1.parentView).to(eq, view);

          expect(view.subview2.html()).to(eq, view.find(".subview:contains('Subview 2')").html());
          expect(view.subview2.foo).to(eq, "foo");
          expect(view.subview2.bar).to(eq, "bar");
          expect(view.subview2.subviewNumber).to(eq, 2);
          expect(view.subview2.parentView).to(eq, view);
        });
      });

      context("when given a collection name and a key", function() {
        it("assigns the subview to a key on a hash with the given collection name, creating it if it doesn't exist", function() {
          builder.div({id: "root"}, function() {
            builder.subview("subviews", "one", ExampleSubviewTemplate, { subviewNumber: 1});
            builder.subview("subviews", "two", ExampleSubviewTemplate, { subviewNumber: 2});
          });

          var view = builder.toView();
          expect(view.subviews.one.subviewNumber).to(eq, 1);
          expect(view.subviews.two.subviewNumber).to(eq, 2);
        });
      });

      context("when given placeholderTag as an option", function() {
        before(function() {
          _.constructor("ExampleSubviewTemplate", Monarch.View.Template, {
            content: function(props) { with (this.builder) {
              tbody({'class': "subview"}, function() {
                tr(function() {
                  td("row 1");
                });
              });
            }}
          });
        });

        it("uses the given placeholder tag instead of the default div (which is useful for making a 'tbody' subview)", function() {
          with(builder) {
            table(function() {
              thead(function() {
                tr(function() {
                  th("The heading");
                })
              });

              subview('myTbody', ExampleSubviewTemplate, {
                placeholderTag: "tbody"
              });
            });
          }

          var view = builder.toView();
          expect(view.find("td").length).toNot(eq, 0);
          expect(view.placeholderTag).to(beUndefined);
        });
      })
    });

    describe("#tag", function() {
      context("when called with only the name of the tag", function() {
        context("if the tag is self-closing", function() {
          it("generates an empty self-closing tag", function() {
            builder.tag("br");
            expect(builder.toHtml(), "<br/>");
          });

          it("returns the SelfClosingTag instruction", function() {
            var instruction = builder.tag("br")
            expect(instruction.constructor).to(eq, Monarch.View.SelfClosingTag);
            expect(instruction.name).to(eq, "br");
          });
        });

        context("if the tag is not self-closing", function() {
          it("generates an empty open tag and a close tag", function() {
            builder.tag("div");
            expect(builder.toHtml()).to(eq, "<div></div>");
          });

          it("returns the CloseTag instruction with a reference to the OpenTag instruction", function() {
            var instruction = builder.tag("div");
            expect(instruction.constructor).to(eq, Monarch.View.CloseTag);
            expect(instruction.name).to(eq, "div");
            var openTagInstruction = instruction.openTagInstruction;
            expect(openTagInstruction.constructor).to(eq, Monarch.View.OpenTag);
            expect(openTagInstruction.name).to(eq, "div");
          });
        });
      });

      context("when called with the name of a tag and an attributes hash", function() {
        context("if the tag is self-closing", function() {
          it("generates a self-closing tag with the given attributes", function() {
            builder.tag("br", { 'id': "foo", 'class': "bar"});
            expect(builder.toHtml()).to(eq, '<br id="foo" class="bar"/>');
          });
        });

        context("if the tag is not self-closing", function() {
          it("generates an open tag with the given attributes and a close tag", function() {
            builder.tag("div", { 'id': "foo", 'class': "bar"});
            expect(builder.toHtml()).to(eq, '<div id="foo" class="bar"></div>');
          });
        });
      });

      context("when called with the name of a tag and a string", function() {
        context("if the tag is self-closing", function() {
          it("throws an exception", function() {
            expect(function() {
              builder.tag("br", "hello");
            }).to(throwException);
          });
        });

        context("if the tag is not self-closing", function() {
          it("generates an open tag and a close tag surrounding the xml escaping of the given text", function() {
            builder.tag("div", "& hello");
            expect(builder.toHtml()).to(eq, "<div>&amp; hello</div>");
          });
        });
      });

      context("when called with the name of a tag and a number", function() {
        context("if the tag is self-closing", function() {
          it("throws an exception", function() {
            expect(function() {
              builder.tag("br", 25);
            }).to(throwException);
          });
        });

        context("if the tag is not self-closing", function() {
          it("generates an open tag and a close tag surrounding the number converted to a string", function() {
            builder.tag("div", function() {
              builder.tag("div", 25);
              builder.tag("div", 2.5);
            });
            expect(builder.toHtml()).to(eq, "<div><div>25</div><div>2.5</div></div>");
          });
        });
      });


      context("when called with the name of a tag and a function", function() {
        context("if the tag is self-closing", function() {
          it("throws an exception", function() {
            expect(function() {
              builder.tag("br", function() {
                builder.tag("div");
              });
            }).to(throwException);
          });
        });

        context("if the tag is not self-closing", function() {
          var instruction;

          before(function() {
            instruction = builder.tag("div", function() {
              builder.tag("div");
            });
          });

          it("generates an open tag, calls the function, then generates a close tag", function() {
            expect(builder.toHtml()).to(eq, '<div><div></div></div>');
          });

          it("returns the CloseTag instruction with a reference to the OpenTag instruction", function() {
            expect(instruction.constructor).to(eq, Monarch.View.CloseTag);
            expect(instruction.name).to(eq, "div");
            var openTagInstruction = instruction.openTagInstruction;
            expect(openTagInstruction.constructor).to(eq, Monarch.View.OpenTag);
            expect(openTagInstruction.name).to(eq, "div");
          });
        });
      });

      context("when called with the name of a tag and both a string and a function", function() {
        it("throws an exception", function() {
          expect(function() {
            builder.tag("div", "text", function() {})
          }).to(throwException);
        });
      });
    });

    describe("#findPrecedingElement", function() {
      before(function() {
        builder.jqueryFragment = {
          find: mockFunction("find method on the jqueryFragment", function() {
            return "find result";
          })
        };
      });

      context("when called for an element other than the root", function() {
        it("performs a find against the current jqueryFragment based on the path indicated by successive calls to #pushChild and #popChild", function() {
          builder.pushChild();
          builder.pushChild();
          builder.popChild();

          expect(builder.findPrecedingElement()).to(eq, "find result");
          expect(builder.jqueryFragment.find).to(haveBeenCalled, withArgs("> :eq(0)"));
          builder.jqueryFragment.find.clear();

          builder.pushChild();
          builder.pushChild();
          builder.popChild();
          expect(builder.findPrecedingElement()).to(eq, "find result");
          expect(builder.jqueryFragment.find).to(haveBeenCalled, withArgs("> :eq(1) > :eq(0)"));
        });
      });

      context("when called for the root element", function() {
        before(function() {
          builder.pushChild();
          builder.popChild();
        });

        it("returns the Builder's current #jqueryFragment", function() {
          expect(builder.findPrecedingElement()).to(eq, builder.jqueryFragment);
        });
      });
    });
  });
}});
