var DropDown = require('components/DropDown');
var utils = require('utils');

require('./style.css');

/**
 * @param {HTMLElement} container - элемент, который надо преобразовать дропдаун
 *    вся прошлая информация в элементе будет потеряна
 * @param {Object} options
 *   @param {Boolean} [options.multi] - можно ли выбирать несколько пунктов
 *   @param {Boolean} [options.autocomplete] - включает автокомплит
 *   @param {String} [options.placeholder] - текст плейсхолдера
 *   @param {Object[]} [options.items] - пункты
 *   @param {Boolean} [options.avatar] - нужно ли показывать аватарки пользователей
 *   @param {Boolean} [options.page] - нужно ли использовать и показывать короткие страницы пользователей
 */
function UserDropDown(container, options) {
  options = options || {};

  this._avatar = !!options.avatar;
  this._page = !!options.page;

  // Вызываем оригинальный конструктор
  DropDown.apply(this, arguments);
}

// Не стал заводить еще одну костыльную ф-ию тут, просто руками
UserDropDown.prototype = Object.create(DropDown.prototype);

/**
 * Создает элемент списка пользователя с дополнительными данными если надо
 *
 * @param {Object} item - данные пользователя
 * @return {HTMLElement}
 */
UserDropDown.prototype._createItem = function(item) {
  var $item = DropDown.prototype._createItem.apply(this, arguments);
  var $img;

  this._addUserPage($item, item);
  this._addUserAvatar($item, item);

  return $item;
};

/**
 * Добавляет информацию о короткой странице пользователя
 *
 * @param {HTMLElement} $item - блок с данными пользователя
 * @param {Object} item - данные пользователя
 */
UserDropDown.prototype._addUserPage = function($item, item) {
  var $text;
  var $title;
  var $page;
  var i;
  var end;

  // Добавляем, только если используются короткие страницы
  if (!this._page || !item.page) {
    return;
  }

  // Создаем контейнер для текста
  $text = document.createElement('div');
  $text.classList.add('user-dropdown-item-text');

  // Имя пользователя кладем в элемент
  $title = document.createElement('p');
  $title.classList.add('user-dropdown-item-title');
  $title.classList.add('dropdown_one-line');

  // Убираем текст под элемент тайтла
  for (i = 0, end = $item.childNodes.length; i < end; i++) {
    // Проверяем так на случай, если решим аватар, например, раньше добавить
    if ($item.childNodes[i].nodeType === Document.TEXT_NODE) {
      $title.appendChild($item.firstChild);
    }
  }

  $text.appendChild($title);

  // Добавляем короткую страницу
  $page = document.createElement('p');
  $page.classList.add('user-dropdown-item-page');
  $page.textContent = '@' + item.page;
  $text.appendChild($page);

  $item.appendChild($text);
};

/**
 * Добавляет аватарку пользователя
 *
 * @param {HTMLElement} $item - блок с данными пользователя
 * @param {Object} item - данные пользователя
 */
UserDropDown.prototype._addUserAvatar = function($item, item) {
  if (!this._avatar) {
    return;
  }

  // Помечаем, что юзер с аватаром
  $item.classList.add('user-dropdown-item_with_avatar');

  // Создаем блок для аватара
  $avatar = document.createElement('span');
  $avatar.classList.add('user-dropdown-item-avatar');

  // Если у пользователя он есть, то добавим картинку
  // Иначе будет просто заглушка там
  if (item.avatar) {
    $img = document.createElement('img');
    $img.src = 'img/' + item.avatar;
    $img.classList.add('user-dropdown-item-img');
    $avatar.appendChild($img);
  }

  $item.insertBefore($avatar, $item.firstChild);
};

/**
 * Расширяет обычный поиск добавляя в него запрос на сервер
 * с поиском по короткой странице пользователя
 */
UserDropDown.prototype._onSearch = function() {
  var that = this;

  // Получаем список id пользователей
  this._getSearchIds(function(ids) {
    // Исключаем из списка выбранных пользователей
    ids = ids.filter(function(id) {
      return (that._multi
        ? that._value.indexOf(Number(id)) === -1
        : that._value !== Number(id));
    });

    if (ids.length) {
      // Показываем только пункты, соответствующие поиску
      that._hideNotFoundItems(ids);

    } else {
      that._showNoData('Ничего не найдено');
    }
  });
};

/**
 * Расширяет обычный поиск добавляя в него запрос на сервер
 * с поиском по короткой странице пользователя
 *
 * @param {Function} onData - колбек, когда будут получены id пользователей
 */
UserDropDown.prototype._getSearchIds = function(onData) {
  var that = this;

  // Если не нужно запрашивать данные с сервера, то сразу возращаем локальные
  if (!that._page) {
    onData(DropDown.prototype._getSearchIds.call(that));
    return;
  }

  // Делаем запрос на сервер за id пользователей с соответствующей короткой страницей
  utils.searchByPage(that._$input.value, function(data) {
    onData(
      DropDown.prototype._getSearchIds.call(that).concat(data)
    );
  }, function(e) {
    // Нужно как-то обработать ошибку, типа нотификашку показать и т.п.

    // и вернем данные из локального поиска
    onData(DropDown.prototype._getSearchIds.call(that));
  });
};

module.exports = UserDropDown;
