/*global window, rJS, jIO, FormData */
/*jslint indent: 2, maxerr: 3 */
(function (window, rJS, jIO) {
  "use strict";

  function splitDocumentAndAttachmentId(path) {
      var result = undefined;

      if (path[0] != "/") {
          result = undefined;
      }
      if (path[path.length -1] == "/") {
          result = [path, ""];
      }
      var index = path.lastIndexOf("/");
      result = [path.substr(0, index+1), path.substr(index+1, path.length)];

      return result;
  }
  
  function putDirectoryRecursively(storage, directory) {
    var last_directory_char = directory.substr(0, directory.length - 1).lastIndexOf('/'),
        parent_directory = directory.substr(0, last_directory_char + 1);

    return storage.put(parent_directory, {})
      .push(undefined, function (error) {
        return putDirectoryRecursively(parent_directory);
      })
      .push(function (success) {
        return storage.put(directory, {});
      });
  }

  function getDAVStorageConnector (gadget) {
    return RSVP.Queue()
      .push(function () {
        return RSVP.all([
          gadget.getParameter("username"),
          gadget.getParameter("password")
        ]);
      })
      .push(function (result_list) {
        var username = result_list[0] || "username",
            password = result_list[1] || "password",
            basic_login = btoa(username + ":" + password),
            url = window.location.origin;

        return RSVP.Promise(function (resolve, reject) {
          resolve(jIO.createJIO({
            type:"dav",
            url:url,
            basic_login:basic_login,
            with_credentials: true
          }));
        });
      });
  }

  rJS(window)
    .ready(function () {
      var gadget = this;

      gadget.directory_list = [
        "/",
        "/style/",
        "/dev/",
        "/dev/codemirror/",
        "/dev/codemirror/addon/",
        "/dev/codemirror/mode/",
        "/dev/codemirror/theme/",
        "/dev/test/",
        "/priv/",
      ];

      return RSVP.Queue();
    })

    .declareAcquiredMethod("getParameter", "getParameter")
    .declareAcquiredMethod("setParameter", "setParameter")

    .declareMethod("render", function () {
      var gadget = this;

      gadget.local_storage = jIO.createJIO({
          type:"indexeddb",
          database:"resources"
      });

      return getDAVStorageConnector(gadget)
        .push(function(connector) {
          gadget.dav_storage = connector;
          return RSVP.Queue();
        });
    })

    .declareMethod("pullAttachment", function (directory, attachment) {
        var gadget = this;
        return getDAVStorageConnector(gadget)
          .push(function (dav_storage) {
              return dav_storage.getAttachment(directory, attachment);
          })
          .push(function(blob) {
              return gadget.local_storage.putAttachment(directory, attachment, blob);
          }, function (err) {
               console.log(err);
          });
    })

    .declareMethod("pullDirectoryAttachmentList", function (directory) {
        var gadget = this;
        return getDAVStorageConnector(gadget)
          .push(function(dav_storage) {
              return dav_storage.allAttachments(directory);
          })
          .push(function (attachment_object) {
              var promise_list = [];

              for (var attachment in attachment_object) {
                  promise_list.push(gadget.pullAttachment(directory, attachment))
              }

              return RSVP.all(promise_list);
          });
    })

    .declareMethod("pullEverything", function () {
        var gadget = this;
        var promise_list = [];

        for (var i=0; i<gadget.directory_list.length; i++) {
            promise_list.push(
                gadget.local_storage.put(gadget.directory_list[i], {})
                .push(function(result) {
                    return gadget.pullDirectoryAttachmentList(result);
                })
            )
        }

        return RSVP.all(promise_list);
    })

    .declareMethod("pushAttachment", function (directory, attachment) {
        var gadget = this;
        return gadget.local_storage.getAttachment(directory, attachment)
          .push(function(blob) {
              return gadget.dav_storage.putAttachment(directory, attachment, blob);
          });
    })

    .declareMethod("pushDirectoryAttachmentList", function (directory) {
        var gadget = this;
        var promise_list = [];

        return gadget.dav_storage.get(directory)
          .push(function () {}, function () {
            // The directory doesn't exist, we create it
            return putDirectoryRecursively(gadget.dav_storage, directory);
          })
          .push(function () {
            return gadget.local_storage.allAttachments(directory);
          })
          .push(function (attachment_object) {
            for (var attachment in attachment_object) {
              promise_list.push(gadget.pushAttachment(directory, attachment))
            }

            return RSVP.all(promise_list);
         });
    })

    .declareMethod("pushEverything", function () {
        var gadget = this;
        var promise_list = [];

        return gadget.local_storage.allDocs()
          .push(function (directory_list) {
              var directory_list = directory_list.data.rows;
              var promise_list = [];

              for (var i=0; i<directory_list.length; i++) {
                  promise_list.push(gadget.pushDirectoryAttachmentList(directory_list[i].id));
              }

            return RSVP.all(promise_list);
          });
    })

    .declareMethod("getDocumentList" , function() {
        return this.local_storage.allDocs();
    })

    .declareMethod("getAttachment" , function(pathname) {
        var split = splitDocumentAndAttachmentId(pathname);

        if (split != undefined) {
            var directory = split[0],
                attachment = split[1];
            return this.local_storage.getAttachment(directory, attachment);
        }
        return RSVP.Queue();
    })

    .declareMethod("putAttachment" , function(pathname, blob) {
        var split = splitDocumentAndAttachmentId(pathname);

        if (split != undefined) {
            var directory = split[0],
                attachment = split[1],
                promise_list = [];
            return RSVP.all([
              this.local_storage.put(directory, {}), // should use state, and add only if needed, and add all directories missing in path
              this.local_storage.putAttachment(directory, attachment, blob)
            ]);
        }
        return RSVP.Queue();
    })

    .declareMethod("deleteAttachment", function (pathname) {
        var split = splitDocumentAndAttachmentId(pathname);

        if (split != undefined) {
          var directory = split[0],
              attachment = split[1],
              promise_list = [];

          // When deleting, we want to remove locally and remotely directly
          return this.local_storage.removeAttachment(directory, attachment)
            .push(function () {
              return this.dav_storage.removeAttachment(directory, attachment);
            })
            .push(function (success) {
              return new RSVP.Queue();
            }, function (error) {
              // delete remote file can fail for many valid reasons.
              // ie: a file has been created locally, but never pushed.
              // thus we just fail silently.
              console.log('Error when deleting remote file : ' + error);
              return new RSVP.Queue();
            });
        }
        return RSVP.Queue();
    })

    .declareMethod("getResourceTree", function () {
        var gadget = this,
            global_document_list = [],
            promise_list = [];

        return this.local_storage.allDocs()
          .push(function(document_list) {
              var document_list = document_list.data.rows,
                  promise_list = [];
              global_document_list = document_list;

              for (var i=0; i<document_list.length; i++) {
                  var directory = document_list[i];
                  promise_list.push(gadget.local_storage.allAttachments(directory.id))
              }
              return RSVP.all(promise_list);
          })
          .push(function(attachment_object_list) {
              var result = {};
              for (var i=0; i<global_document_list.length; i++) {
                  result[global_document_list[i].id] = [];
                  for (var attachment in attachment_object_list[i]) {
                      result[global_document_list[i].id].push(attachment);
                  }
              }
              return RSVP.Promise(function(resolve, reject) {
                  resolve(result);
              });
          });
    })

    .declareService(function () {
        return this.render();
    })

}(window, rJS, jIO));
