(function (window, rJS, RSVP) {
  "use strict";

  function getEditorGadgetFromContentType(content_type) {
    if (content_type.indexOf("image/") == 0) {
      return "gadget_image_editor.html";
    } else {
      return "gadget_text_editor.html";
    }
  }


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

      gadget.buffer_dict = {};

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
      var gadget = this,
          scopename = pathname + "_editor",
          pathname_input = gadget.element.querySelector("input[name=\"pathname\"]"),
          content_type_input = gadget.element.querySelector("input[name=\"content-type\"]"),
          preview_link_tag = gadget.element.querySelector("a[name=\"short-action-open-preview\"]"),
          queue = RSVP.Queue();

      // If gadget is the same, do nothing
      if (gadget.current_editor_scope === scopename) {
        return queue;
      }

      pathname_input.value = pathname;

      // Build preview URL of the opened document and set it on link
      var preview_url = new URL(document.URL);
      preview_url.pathname = pathname;
      preview_url.searchParams.set('preview', 'True');
      preview_link_tag.setAttribute('href', preview_url.href);


      // Hide previous buffer
      if (gadget.current_editor_scope !== undefined) {
        queue.push(function () {
          return gadget.getDeclaredGadget(gadget.current_editor_scope);
        })
        .push(function (current_gadget) {
          current_gadget.element.style.display = "none";
          return RSVP.Queue();
        });
      }

      // If file has already been opened, display the buffer
      if (scopename in gadget.buffer_dict) {
        queue.push(function () {
          return gadget.getDeclaredGadget(scopename);;
        })
        .push(function (new_gadget) {
          new_gadget.element.style.display = "flex";
          gadget.current_editor_scope = scopename;
          return new_gadget.getContentType();
        })
        .push(function (content_type) {
          content_type_input.value = content_type;
          return RSVP.Queue();
        })
      }
      // Otherwise create a new buffer containing the file
      else {
        queue.push(function () {
            return gadget.getDeclaredGadget("storage");
          })
          .push(function (storage_gadget) {
              return storage_gadget.getAttachment(pathname);
          })
          .push(function (blob) {
              content_type_input.value = blob.type;

              var gadget_element = window.document.createElement("div");
              gadget_element.setAttribute("name", scopename);
              gadget_element.classList.add("editor-buffer");
              gadget.element.querySelector(".editor-container").appendChild(gadget_element);

              return gadget.declareGadget(getEditorGadgetFromContentType(blob.type), {
                "scope": scopename,
                "sandbox": "public",
                "element": gadget_element,
              })
                .push(function (gadget_editor) {
                  gadget.current_editor_scope = scopename;
                  gadget.buffer_dict[scopename] = gadget_editor;
                  gadget_editor.render(pathname, blob)

                  return RSVP.Queue();
                });
          });
      }

      return queue;
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
              pathname = gadget.element.querySelector("input[name=\"pathname\"]").value;

          return RSVP.Queue()
            .push(function () {
               return RSVP.all([
                 gadget.getDeclaredGadget(gadget.current_editor_scope),
                 gadget.getDeclaredGadget("storage")
                 ]);
            })
            .push(function (gadget_list) {
              var editor_gadget = gadget_list[0],
                  storage_gadget = gadget_list[1];

              return editor_gadget.getValue()
                .push(function (editor_content) {
                  // editor_gadget.getValue() always returns a blob
                  return storage_gadget.putAttachment(pathname, editor_content);
              });
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

    },false, true)
    .onEvent("change", function (event) {
      var gadget = this;

      if (event.target.name === "pathname") {
        return gadget.getDeclaredGadget(gadget.current_editor_scope)
          .push(function (editor_gadget) {
            editor_gadget.setPathName(event.target.value);
          });
      } else if (event.target.name === "content-type") {
        return gadget.getDeclaredGadget(gadget.current_editor_scope)
          .push(function (editor_gadget) {
            editor_gadget.setContentType(event.target.value);
          });
      }
    }, false, true);

}(window, rJS, RSVP));
