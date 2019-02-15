/*global window, RSVP, FileReader */
/*jslint indent: 2, maxerr: 3, unparam: true */
(function (window, RSVP) {
  "use strict";
  
  function getActionDictFromHash(hash) {
    let param_list = hash.split("&"),
        action_dict = {};

    for(let i=0; i<param_list.length; i++) {
      let [key, value] = param_list[i].split('=');
      action_dict[key] = value
    }
    
    return action_dict;
  }
  
  function hashChangeHandler(gadget) {
    let hash = window.location.hash.slice(1),
        action_dict = getActionDictFromHash(hash);

    if (action_dict.action === 'edit') {
      return gadget.openResourceFromPath(action_dict.path);
    } else {
      window.console.log("Unknow action in router's action_dict :", action_dict);
    }
  };

  rJS(window)
    .declareAcquiredMethod("openResourceFromPath", "openResourceFromPath")
    .ready(function () {
      let gadget = this;

      function closure(gadget) {
        return function(event) {
          return hashChangeHandler(gadget);
        }
      }

      return window.addEventListener("hashchange", closure(gadget), false);
    })
    .declareMethod("applyActionFromURL", function() {
      return hashChangeHandler(this);
    });
  
})(window, RSVP);