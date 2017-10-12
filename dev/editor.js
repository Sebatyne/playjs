(function (window, rJS, RSVP) {
  "use strict";

  rJS(window)
    .declareMethod("getParameter", function (parameter) {
      var gadget = this;
      return gadget.getDeclaredGadget("setting")
        .push(function (setting_gadget) {
          return setting_gadget.getParameter(parameter);
        });
    })
    .allowPublicAcquisition("getParameter", function (parameter_list) {
      return this.getParameter(parameter_list[0]);
    })

    .declareMethod("setParameter", function (parameter, value) {
      var gadget = this;
      return gadget.getDeclaredGadget("setting")
        .push(function (setting_gadget) {
          return setting_gadget.setParameter(parameter, value);
        });
    })
    .allowPublicAcquisition("setParameter", function (parameter_list, scope) {
      return this.setParameter(parameter_list[0], parameter_list[1]);
    })

    .declareMethod("startLongActionNotification", function () {
      return this.getDeclaredGadget("notification")
        .push(function (notification_gadget) {
          return notification_gadget.startLongActionNotification();
      })
    })
    .allowPublicAcquisition("startLongActionNotification", function () {
      return this.startLongActionNotification();
    })

    .declareMethod("stopLongActionNotification", function () {
      return this.getDeclaredGadget("notification")
        .push(function (notification_gadget) {
          return notification_gadget.stopLongActionNotification();
      })
    })
    .allowPublicAcquisition("stopLongActionNotification", function () {
      return this.startLongActionNotification();
    })

    .declareMethod("render", function () {
      var gadget = this;

      var editor = CodeMirror.fromTextArea(document.getElementById('page-form-editor'), {
        lineNumbers: true,
        mode: 'text/html',
        autoCloseTags: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        showTrailingSpace: true,
        keyMap: "vim",
        //theme: 'solarized dark',
        extraKeys: {
          "Alt-Space": "autocomplete",
          "F11": function(cm) {
            cm.setOption("fullScreen", !cm.getOption("fullScreen"));
          }
        }
      });

      gadget.editor = editor;

      var username_input = gadget.element.querySelector("[name=\"username\"]"),
          password_input = gadget.element.querySelector("[name=\"password\"]"),
          offline_input = gadget.element.querySelector("[name=\"development-mode\"]");
    
      return gadget.getParameter("username")
        .push(function (username) {
            if (username) {
              username_input.value = username;
            }
            return gadget.getParameter("password");
        })
        .push(function (password) {
            if (password) {
              password_input.value = password;
            }
            return gadget.getParameter("offline");
        })
        .push(function (offline) {
            if (offline) {
              offline_input.checked = offline;
            }
            return RSVP.Queue();
        })
        .push(function () {
          return gadget.displayResourceList();
        });
    })

    .declareMethod("displayResourceList", function () {
      var gadget = this;
      return gadget.getDeclaredGadget("storage")
        .push(function(storage_gadget) {
            return storage_gadget.getResourceTree();
        })
        .push(function(resource_tree) {
            var web_page_edit_list = "";

            for (var resource in resource_tree) {
              for (var i=0; i<resource_tree[resource].length; i++) {
                web_page_edit_list += "<li class=\"pure-menu-item\"><a href=\"#\" class=\"edit-page-link pure-menu-link\">" + resource + resource_tree[resource][i] + "</a></li>";
              }
            }
            document.getElementById('edit-page-list').innerHTML = web_page_edit_list;

            return RSVP.Queue();
        });
    })

    .declareMethod("openResourceFromPath", function (pathname) {
      var gadget = this;
      return gadget.getDeclaredGadget("storage")
          .push(function (storage_gadget) {
              return storage_gadget.getAttachment(pathname);
          })
          .push(function (blob) {
              var pathname_input = gadget.element.querySelector("input[name=\"pathname\"]");
              var content_type_input = gadget.element.querySelector("input[name=\"content-type\"]");

              pathname_input.value= pathname;
              content_type_input.value = blob.type;
              gadget.editor.setOption('mode', blob.type);

              var fr = new FileReader();
              fr.onloadend = function (res) {
                  gadget.editor.setValue(res.target.result);
              }
              fr.readAsText(blob);
              return RSVP.Queue();
          });
    })

    .declareService(function () {
      return this.render();
    })
    .onEvent("click", function (event) {
        var gadget = this,
            queue = new RSVP.Queue();

        if (event.target.classList.contains("edit-page-link")) {
          document.title = event.target.text;
          return gadget.openResourceFromPath(event.target.text);
        }
        else if (event.target.getAttribute('name') == "short-action-pull-all") {
          event.preventDefault();
          return gadget.startLongActionNotification()
            .push(function () {
              return gadget.getDeclaredGadget("storage");
            })
            .push(function (storage_gadget) {
              return storage_gadget.pullEverything();
            })
            .push(function () {
              return gadget.displayResourceList();
            })
            .push(function () {
              return gadget.stopLongActionNotification();
          })
        }
        else if (event.target.getAttribute('name') == "short-action-push-all") {
          event.preventDefault();
          return gadget.startLongActionNotification()
            .push(function() {
              return gadget.getDeclaredGadget("storage");
            })
            .push(function (storage_gadget) {
              return storage_gadget.pushEverything();
            })
            .push(function () {
              return gadget.stopLongActionNotification();
            });
        }
        else if (event.target.getAttribute('name') == "short-action-save") {
          event.preventDefault();
          var content_type = gadget.element.querySelector("input[name=\"content-type\"]").value,
              pathname = gadget.element.querySelector("input[name=\"pathname\"]").value,
              blob = new Blob([gadget.editor.getValue()], {type: content_type});

          return gadget.getDeclaredGadget("storage")
            .push(function (storage_gadget) {
            return storage_gadget.putAttachment(pathname, blob);
          });
        }
        else if (event.target.classList.contains("view-file-list-link")) {
          event.preventDefault();
          var to_hide = gadget.element.querySelector(".view-global-option"),
              to_show = gadget.element.querySelector(".view-file-list");
          to_hide.style.display = 'none';
          to_show.style.display = 'block';
        }
        else if (event.target.classList.contains("view-global-option-link")) {
          event.preventDefault();
          var to_show = gadget.element.querySelector(".view-global-option"),
              to_hide = gadget.element.querySelector(".view-file-list");
          to_hide.style.display = 'none';
          to_show.style.display = 'block';
        }
        return RSVP.Queue();
    }, /*useCapture=*/false, /*preventDefault=*/false)

    .onEvent("submit", function (event) {
      var gadget = this,
          form = event.target,
          username = form.querySelector("[name=\"username\"]").value,
          password = form.querySelector("[name=\"password\"]").value,
          offline = form.querySelector("[name=\"development-mode\"]").checked;

      return RSVP.all([
        gadget.setParameter("username", username),
        gadget.setParameter("password", password),
        gadget.setParameter("offline", offline)
      ]);

    },false, true);

}(window, rJS, RSVP));
