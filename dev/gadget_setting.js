/*global window, rJS, jIO */
/*jslint indent: 2, maxerr: 3 */
(function (window, rJS, jIO) {
  "use strict";

  rJS(window)
    .ready(function () {
      var gadget = this;
      gadget.storage = jIO.createJIO({
        type:"indexeddb",
        database:"settings"
      });
    })

    .declareMethod("setParameter", function (setting, value) {
      var gadget = this;
      return gadget.storage.put(setting, {value: value});
    })
  
    .declareMethod("getParameter", function (setting) {
      var gadget = this;
      return gadget.storage.get(setting)
        .push(function (setting) {
            var value;
            if (setting) {
                value = setting.value;
            } else {
                value = "";
            }
             return RSVP.Promise(function (resolve, reject) {
               resolve(value);
             });
        }, function(err) {
          console.log(err);
          return RSVP.Promise(function (resolve, reject) {
            resolve("");
          });
        });
    });

}(window, rJS, jIO));
