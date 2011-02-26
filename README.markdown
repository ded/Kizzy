Kizzy - a Local Storage Utility
-------------------------------

Kizzy is a small, cross-browser, JavaScript local storage utility. It utilizes the HTML5 localStorage api when available, as well as Internet Explorer's persistent XML store — wrapped up in a easy to use, memcached-like interface. When neither of these features are available (unlikely), it falls back to an in-browser object store.

It looks like this

    var cache = Kizzy('users');
    var agent = cache.get('Agent');
    if (agent) {
      alert('Welcome back ' + agent.name);
    } else {
      cache.set('Agent', {
        name: 'Agent Diaz'
      });
    }

Furthermore, a call to 'set' will return the value, making it quite easy for assignment.

    var cache = Kizzy('users');
    var agent = cache.get('Agent') || cache.set('Agent', {
      name: 'Agent Diaz'
    });

Lastly, you can pass an optional third argument to 'set' that tells the cache how long to live

    var cache = Kizzy('users');

    var agent = cache.get('Agent') || cache.set('Agent', {
      name: 'Agent Diaz'
    }, 5000); // time to live set for 5 seconds


    // wait 3 seconds...
    setTimeout(function() {
      alert('Still there ' + cache.get('Agent').name);
    }, 3000);

    // 6 seconds later...
    setTimeout(function() {
      cache.get('Agent').name // => expired
    }, 6000);

