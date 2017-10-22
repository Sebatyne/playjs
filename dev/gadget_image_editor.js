(function (window, rJS, RSVP) {
  "use strict";

  rJS(window)
    .declareAcquiredMethod("getParameter", "getParameter")
    .declareAcquiredMethod("setParameter", "setParameter")

    .declareMethod("render", function (pathname, blob) {
      var gadget = this;

      gadget.pathname = pathname;
      gadget.mode = blob.type;

      var reader = new FileReader();

      reader.onload = (function (f) {
        gadget.element
          .querySelector("[name=\"content\"]")
          .setAttribute("src", f.target.result);
      });
      reader.readAsDataURL(blob);

      return RSVP.Queue();
    })

    .declareMethod("getValue", function () {
      return this.value;
    })
    .declareMethod("getPathName", function () {
      return this.pathname;
    })
    .declareMethod("getContentType", function () {
      return this.mode;
    });


}(window, rJS, RSVP));
