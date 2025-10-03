// js/core/api.shim.js
// اختيارية: تضمن وجود API حتى لو لم تُدرج api.js
(function(w){
  w.API = w.API || { base: "/api" };
  w.api = w.api || {
    get: (url) => $.getJSON(url),
    post: (url, body) => $.ajax({ url, method:"POST", data: JSON.stringify(body), contentType:"application/json" }),
    put:  (url, body) => $.ajax({ url, method:"PUT",  data: JSON.stringify(body), contentType:"application/json" }),
    delete:(url)      => $.ajax({ url, method:"DELETE" })
  };
})(window);
