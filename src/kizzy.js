!function(win, doc, store) {

  var hasLocalStorage,
      html5 = false;

  function noop(){

  }

  function _Kizzy() {
    this._cache = {};
  }

  function isNumber(n) {
    return typeof n === 'number' && isFinite(n);
  }

  Kizzy.prototype = {

    set: function(k, v, optTtl) {
      this._cache[k] = {
        value: v,
        expire: isNumber(optTtl) ? this._getTime() + optTtl : 0
      };
      this._writeThrough() || this.remove(k);
      return v;
    },

    get: function(k) {
      this._checkExpiry(k);
      return this._cache[k] ? this._cache[k].value : undefined;
    },

    remove: function(k) {
      delete this._cache[k];
      this._writeThrough();
    },

    clear: function() {
      this._cache = {};
      this._writeThrough();
    },

    _checkExpiry: function(k) {
      if (this._cache[k] && this._cache[k].expire && this._cache[k].expire < this._getTime()) {
        this.remove(k);
      }
    },

    _getTime: function() {
      return +new Date;
    },

    _writeThrough: function() {
      return 1;
    }
  };

  try {
    // HTML5 local storage
    hasLocalStorage = ('localStorage' in window) && window['localStorage'] !== null;
    html5 = true;
  } catch (ex) {
    hasLocalStorage = false;
    html5 = false;
  }

  // IE local storage
  try {
    // this try / if is required. trust me
    if (document.documentElement.addBehavior) {
      html5 = false;
      hasLocalStorage = true;
      var dataStore = document.documentElement;
      dataStore.addBehavior('#default#userData');
      dataStore.load(store);

      var xmlDoc = dataStore.xmlDocument;
      var xmlDocEl = xmlDoc.documentElement;

      function getNodeByName(name) {
        var childNodes = xmlDocEl.childNodes,
            node,
            returnVal = null;

        for (var i = 0, len = childNodes.length; i < len; i++) {
          node = childNodes.item(i);
          if (node.getAttribute("key") == name) {
            returnVal = node;
            break;
          }
        }
        return returnVal;
      }

      function getUserData(name) {
        var node = getNodeByName(name);
        var returnVal = null;
        if (node) {
          returnVal = node.getAttribute("value");
        }
        return returnVal;
      }

      function setUserData(name, value) {
        var node = getNodeByName(name);
        if (!node) {
          node = xmlDoc.createNode(1, "item", "");
          node.setAttribute("key", name);
          node.setAttribute("value", value);
          xmlDocEl.appendChild(node);
        }
        else {
          node.setAttribute("value", value);
        }
        dataStore.save(store);
        return value;
      }

      function deleteUserData(name) {
        var node = getNodeByName(name);
        if (node) {
          xmlDocEl.removeChild(node);
        }
        dataStore.save(store);
      }

      function clearUserData() {
        while (xmlDocEl.firstChild) {
          xmlDocEl.removeChild(xmlDocEl.firstChild);
        }
        dataStore.save(store);
      }

    }
  } catch (ex) {
    hasLocalStorage = false;
  }

  function html5getLocalStorage(k) {
    return window.localStorage.getItem(k);
  }

  function html5setLocalStorage(k, v) {
    return window.localStorage.setItem(k, v);
  }

  function html5deleteLocalStorage(k) {
    return window.localStorage.removeItem(k);
  }

  var setLocalStorage = noop,
      getLocalStorage = noop,
      deleteLocalStorage = noop,
      clearLocalStorage = noop;

  if (hasLocalStorage) {
    setLocalStorage = html5 ? html5setLocalStorage : setUserData;
    getLocalStorage = html5 ? html5getLocalStorage : getUserData;
    deleteLocalStorage = html5 ? html5deleteLocalStorage : deleteUserData;
    clearLocalStorage = html5 ? html5deleteLocalStorage : clearUserData;
  }

  function Kizzy(ns) {
    this._cache = new _Kizzy;
    this._namespace = ns;
    this._cache = JSON.parse(getLocalStorage(ns) || '{}');
  }

  Kizzy.prototype._writeThrough = function() {
    try {
      setLocalStorage(this._namespace, JSON.stringify(this._cache));
      return 1;
    } catch (ex) {
      return 0;
    }
  };

  win.Kizzy = Kizzy;

}(window, document, document.domain);