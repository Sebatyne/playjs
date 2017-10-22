(function (window, rJS, RSVP) {
  "use strict";

  rJS(window)
    .declareAcquiredMethod("getParameter", "getParameter")
    .declareAcquiredMethod("setParameter", "setParameter")

    .declareMethod("render", function (pathname, blob) {
      var gadget = this,
          fr = new window.FileReader()

      gadget.pathname = pathname;
      gadget.mode = blob.type;

      var editor = CodeMirror.fromTextArea(gadget.element.querySelector('textarea'), {
        lineNumbers: true,
        mode: gadget.mode,
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

      fr.onloadend = function (res) {
        gadget.editor.setValue(res.target.result);
      }

      fr.readAsText(blob);

      return RSVP.Queue();
    })

    .declareMethod("getValue", function () {
      return this.editor.getValue();
    })
    .declareMethod("setValue", function (value) {
      this.editor.setValue(value);
    })
    .declareMethod("getPathName", function () {
      return this.pathname;
    })
    .declareMethod("setPathName", function (pathname) {
      this.pathname = pathname;
    })
    .declareMethod("getContentType", function () {
      return this.mode;
    })
    .declareMethod("setContentType", function (content_type) {
      this.mode = content_type;
    });

}(window, rJS, RSVP));