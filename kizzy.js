/*!
  * Kizzy - a cross-browser LocalStorage API
  * Copyright: Dustin Diaz 2012
  * https://github.com/ded/kizzy
  * License: MIT
  */
/*!
  * Kizzy - a cross-browser LocalStorage API
  * Copyright: Dustin Diaz 2012
  * https://github.com/ded/kizzy
  * License: MIT
  */
!function (name, definition) {
  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
  else this[name] = definition()
}('kizzy', function () {

  function noop() {}
  var hasLocalStorage
    , doc = null
    , html5 = 0
    , writeThrough = function () {
        return 1
      }

  try {
      doc = document;
      store = doc.domain;
  } catch (e) {}

  try {
    // HTML5 local storage
    hasLocalStorage = !!localStorage || !!globalStorage
    if (!localStorage) {
      localStorage = globalStorage[store]
    }
    html5 = 1
  } catch (ex1) {
    html5 = 0
    // IE local storage
    try {
      // this try / if is required. trust me
      if (doc.documentElement.addBehavior) {
        html5 = 0
        hasLocalStorage = 1
        var dataStore = doc.documentElement
        dataStore.addBehavior('#default#userData')
        dataStore.load(store)
        var xmlDoc = dataStore.xmlDocument
          , xmlDocEl = xmlDoc.documentElement
      }
    } catch (ex2) {
      hasLocalStorage = false
    }
  }

  var setLocalStorage = noop
    , getLocalStorage = noop
    , removeLocalStorage = noop
    , clearLocalStorage = noop

  if (hasLocalStorage) {
    setLocalStorage = html5 ? html5setLocalStorage : setUserData
    getLocalStorage = html5 ? html5getLocalStorage : getUserData
    getNsLocalStorageSize = html5 ? html5getNsLocalStorageSize : getNsUserDataSize
    removeLocalStorage = html5 ? html5removeLocalStorage : removeUserData
    clearLocalStorage = html5 ? html5clearLocalStorage : clearUserData
    clearAllExpireds = html5 ? html5clearExpireds : clearUserDataExpireds

    writeThrough = function (inst) {
      try {
        var v = JSON.stringify(inst._)
        if( v == '{}' ) {
          removeLocalStorage(inst.ns)
        } else {
          setLocalStorage(inst, inst.ns, v)
        }
        return 1
      } catch (x) {
        return 0
      }
    }
  }


  function time() {
    return +new Date()
  }

  function checkExpiry(inst, k) {
    if (inst._[k] && inst._[k].e && inst._[k].e < time()) {
      inst.remove(k)
    }
  }

  function isNumber(n) {
    return typeof n === 'number' && isFinite(n)
  }

  function html5clearExpireds() {
    if(localStorage.length > 0) {
      for (var key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          try {
            var obj = JSON.parse(localStorage[key]), entry, hasDeleted;
            for(entry in obj) {
              if (obj[entry] && obj[entry].e && obj[entry].e < +new Date()) {
                  hasDeleted = true;
                  delete obj[entry];
              }
            }
            if(hasDeleted) {
              localStorage[key] = JSON.stringify(obj);
              if(html5getNsLocalStorageSize(key) === 0) {
                delete localStorage[key];
              }
            }
          } catch(ex) {}
        }
      }
    }
  }

  function html5getLocalStorage(k) {
    return localStorage[k]
  }

  function html5getNsLocalStorageSize(k) {
    var size = 0, key, obj;
    try {
      obj = JSON.parse(localStorage[k]);
      for (key in obj) {
          if (obj.hasOwnProperty(key)) size++;
      }
      return size;
    } catch (ex) {
      html5removeLocalStorage(k);
      return 0;
    }
  }

  function html5setLocalStorage(inst, k, v) {
    try {
      localStorage[k] = v;
    } catch(e) {
      if(e == QUOTA_EXCEEDED_ERR) {
        // clear cache and start fresh
        // At least for now, this'll be easier
        // than culling (for example), 1/2 of the cache items
        // based on date of creation (which would mean we'd have to order the ls cache items)
        // another option is to clear expired items.  For now we'll just clear everything.
        // inst.clearExpireds();
        html5clearLocalStorage();
      }
    }
    return v
  }

  function html5removeLocalStorage(k) {
    delete localStorage[k]
  }

  function html5clearLocalStorage() {
    localStorage.clear()
  }

  function clearUserDataExpireds() {
      throw "NotImplemented";
  }

  function getNsUserDataSize() {
      throw "NotImplemented";
  }

  function getNodeByName(name) {
    var childNodes = xmlDocEl.childNodes
      , node
      , returnVal = null

    for (var i = 0, len = childNodes.length; i < len; i++) {
      node = childNodes.item(i)
      if (node.getAttribute("key") == name) {
        returnVal = node
        break
      }
    }
    return returnVal
  }

  function getUserData(name) {
    var node = getNodeByName(name)
    var returnVal = null
    if (node) {
      returnVal = node.getAttribute("value")
    }
    return returnVal
  }

  function setUserData(inst, name, value) {
    var node = getNodeByName(name)
    if (!node) {
      node = xmlDoc.createNode(1, "item", "")
      node.setAttribute("key", name)
      node.setAttribute("value", value)
      xmlDocEl.appendChild(node)
    }
    else {
      node.setAttribute("value", value)
    }
    dataStore.save(store)
    return value
  }

  function removeUserData(name) {
    getNodeByName(name) && xmlDocEl.removeChild(node)
    dataStore.save(store)
  }

  function clearUserData() {
    while (xmlDocEl.firstChild) {
      xmlDocEl.removeChild(xmlDocEl.firstChild)
    }
    dataStore.save(store)
  }

  function _Kizzy() {
    this._ = {}
  }

  _Kizzy.prototype = {

    set: function (k, v, optTtl) {
      clearAllExpireds();
      this._[k] = {
        value: v,
        e: isNumber(optTtl) ? time() + optTtl : this.timeout && isNumber(this.timeout) ? time() + this.timeout : 0
      }
      writeThrough(this) || this.remove(k)
      return v
    },

    get: function (k) {
      checkExpiry(this, k)
      return this._[k] ? this._[k].value : undefined
    },

    remove: function (k) {
      delete this._[k];
      writeThrough(this)
    },

    getSize: function () {
      this.clearExpireds();
      return getNsLocalStorageSize(this.ns);
    },

    clear: function () {
      this._ = {}
      writeThrough(this)
    },

    clearExpireds: function() {
      for (var k in this._) {
        checkExpiry(this, k)
      }
      writeThrough(this)
    }
  }

  function Kizzy(ns, timeout) {
    this.timeout = timeout;
    this.ns = ns;
    this._ = JSON.parse(getLocalStorage(ns) || '{}')
  }

  Kizzy.prototype = _Kizzy.prototype

  function kizzy(ns, timeout) {
    timeout = isNumber(timeout) ? timeout : 1000 * 60 * 3;
    return new Kizzy(ns, timeout);
  }

  kizzy.remove = removeLocalStorage
  kizzy.clear = clearLocalStorage
  kizzy.clearAllExpireds = clearAllExpireds

  return kizzy
})