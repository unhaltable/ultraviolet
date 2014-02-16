$(document).on('click', 'a', function() {
  var a = document.createElement('a');
  a.href = $(this).attr('href');;
  a.target = '_blank';
  a.click();
});
