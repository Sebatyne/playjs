var global = self, window = self;

self.DOMParser = {};
self.sessionStorage = {};
self.localStorage = {};
self.openDatabase = {};
self.DOMError = {};

self.importScripts('/dev/rsvp.js', '/dev/jio.js');

function createStorage(database) {
  return self.jIO.createJIO({
    type: 'indexeddb',
    database: 'resources'
  });
}

function isOfflineMode() {
  return self.jIO.createJIO({
    type: 'indexeddb',
    database: 'settings'
  }).get('offline')
  .push(function (offline) {
    return offline;
  }, function (error) {
    // If offline parameter doesn't exist, don't serve from cache
    return false;
  });
}

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

self.addEventListener('install', function(event) {
  console.log('Installing service worker');
});

self.addEventListener('fetch', function(event) {
  var orig_request = event.request,
      url = new URL(orig_request.url),
      pathname = url.pathname,
      is_preview = url.searchParams.get("preview");

  if (event.request.referrer) {
      var referrer_url = new URL(orig_request.referrer),
      is_preview = is_preview || referrer_url.searchParams.get("preview");
  }
  
  event.respondWith(new self.RSVP.Queue()
    .push(function () {
      return isOfflineMode();
    })
    .push(function (offline) {
      var queue = new self.RSVP.Queue();

      if ((offline.value || is_preview) && orig_request.method === "GET") {
        if (pathname[pathname.length - 1] === "/") {
          pathname = pathname + "index.html";
        }

        var split = splitDocumentAndAttachmentId(pathname);

        if (split != undefined) {
            var directory = split[0],
                attachment = split[1];
        }

        queue
          .push(function () {
            storage = createStorage();
            return storage.getAttachment(directory, attachment);
          })
          .push(function (blob) {
            return new Response(blob, {headers: {'content-type': blob.type}});
          });
      } else {
        queue
          .push(function () {
            return fetch(event.request);
          });
      }
    
      return queue;
    })
  );
  console.log('Fetching over');
});