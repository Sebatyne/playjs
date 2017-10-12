/*global window, rJS, jIO */
/*jslint indent: 2, maxerr: 3 */
(function (window, rJS, jIO) {
  "use strict";

  rJS(window)
    .ready(function (gadget) {
      this.element.querySelector("img").style["display"] = "none";
    })
    .declareMethod("startLongActionNotification", function () {
      this.element.querySelector("img").style["display"] = "block";
    })
    .declareMethod("stopLongActionNotification", function () {
      this.element.querySelector("img").style["display"] = "none";
    });

}(window, rJS, jIO));
