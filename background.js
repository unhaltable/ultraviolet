chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('window.html', {
    'minWidth': 330,
    'minHeight': 210,
    'bounds': {
      'width': 600,
      'height': 300
    }
  });
});
