(function (window, rJS, RSVP) {
  "use strict";

  // https://stackoverflow.com/questions/23150333/html5-javascript-dataurl-to-blob-blob-to-dataurl
  function dataURLtoBlob(dataurl) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
  }

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
      return new Blob(
        [dataURLtoBlob(this.element
                           .querySelector("[name=\"content\"]")
                           .getAttribute("src"))],
        {type: this.mode}
      );
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
    })
    .onEvent("change", function (event) {
      var gadget = this,
          file = event.target.files[0];
      console.log(file);

      var reader = new FileReader();

      reader.onload = (function (f) {
        gadget.element
          .querySelector("[name=\"content\"]")
          .setAttribute("src", f.target.result);
      });
      reader.readAsDataURL(file);

      return RSVP.Queue();
    });

}(window, rJS, RSVP));
