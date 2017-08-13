var UserDropDown = require('components/UserDropDown');
// Мы их получаем со страницами, но это не важно, т.к. все равно так дата бы не получалась
// а использовать знания об этом мы все равно не будет
var users = require('../data/users');

require('./style.css');

/**
 * Создает блок с дропдауном по указанным параметрам
 *
 * @param {String} title - заголовок блока
 * @param {Object} [options] - настройки дропдауна
 */
function createExample(title, options) {
  options = options || {};

  var $container = document.createElement('div');
  var $title = document.createElement('h2');
  var $dropdown = document.createElement('div');

  $container.classList.add('example-item');

  $title.textContent = title;
  $container.appendChild($title);

  $container.appendChild($dropdown);

  options.placeholder = options.placeholder || 'Выберите пользователя';
  options.items = users.map(function(user) {
    return {
      title: user.name,
      value: user.id,
      avatar: user.avatar,
      page: user.page,
    };
  });

  (new UserDropDown($dropdown, options));

  document.body.appendChild($container);
}

createExample('Простой список');
createExample('Выбор нескольких пунктов', {
  multi: true,
});
createExample('Поиск', {
  autocomplete: true,
  placeholder: 'Начните вводить имя',
});
createExample('Поиск c выбором нескольких пунктов', {
  multi: true,
  autocomplete: true,
  placeholder: 'Начните вводить имя',
});
createExample('Поиск c возможностью поиска по странице', {
  autocomplete: true,
  page: true,
  placeholder: 'Начните вводить имя',
});
createExample('С аватарками', {
  avatar: true,
});
