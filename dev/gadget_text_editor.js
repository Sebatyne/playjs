(function (window, rJS, RSVP) {
  "use strict";

  rJS(window)
    .declareAcquiredMethod("getParameter", "getParameter")
    .declareAcquiredMethod("setParameter", "setParameter")

    .declareMethod("render", function (pathname, value, mode) {
      var gadget = this;

      gadget.pathname = pathname;
      gadget.mode = mode;

      var editor = CodeMirror.fromTextArea(gadget.element.querySelector('textarea'), {
        lineNumbers: true,
        mode: mode,
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

      editor.setValue(value)

      gadget.editor = editor;

      return RSVP.Queue();
    })

    .declareMethod("getValue", function () {
      return this.editor.getValue();
    })
    .declareMethod("getPathName", function () {
      return this.pathname;
    })
    .declareMethod("getContentType", function () {
      return this.mode;
    });


}(window, rJS, RSVP));
