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
 */
function DropDown(container, options) {
  options = options || {};

  this._$container = container;
  this._multi = !!options.multi;
  this._autocomplete = !!options.autocomplete;
  this._placeholder = options.placeholder || 'Выберите значение';

  this._items = [];

  this._resetValues()

  // Делаем отложенный вызов, чтобы при быстром вводе не делалось 100500 запросов
  this._onSearch = utils.bounce(this._onSearch, 300, this);

  this.create();
  this.setItems(options.items);
}

/**
 * Создает все необходимые элементы дропдауна
 *
 * @return {this}
 */
DropDown.prototype.create = function() {
  if (this._$container.classList.contains('dropdown')) {
    console.error('DropDown уже создан для этого элемента', this._$container);
    return this;
  }

  this._$container.classList.add('dropdown');

  this._$container.innerHTML = '';
  this._$container.appendChild(this._createValue());
  this._$container.appendChild(this._createPopup());

  return this;
};

/**
 * Убирает все элементы дропдауна
 *
 * @return {this}
 */
DropDown.prototype.destroy = function() {
  var name;
  var i;
  var end;

  if (this._$container) {
    console.error('Для элемента не создан DropDown', this._$container);
    return this;
  }

  // Убираем с элемента все классы компонента
  for (i = 0, end = this._$container.classList.length; i < end; i++) {
    name = this._$container.classList[i];

    if (name.indexOf('dropdown') === 0) {
      this._$container.classList.remove(name);
    }
  }

  this._$container.innerHTML = '';

  this._resetValues()

  return this;
};

/**
 * Сбрасывает все значения
 */
DropDown.prototype._resetValues = function() {
  this._$input = null;
  this._$popup = null;
  this._$list = null;
  this._$noData = null;

  this._value = (this._multi ? [] : null);
};

/**
 * Получает текущее значение
 *
 * @return {String|String[]}
 */
DropDown.prototype.getVal = function() {
  return this._value;
};

/**
 * Обновляет список пунктов дропдауна
 *
 * @param {Object[]} items
 *   @param {String} items.title
 *   @param {String} items.value
 * @return {this}
 */
DropDown.prototype.setItems = function(items) {
  this._items = items || [];

  // Для поиска добавляем поисковые строки при инициализации, чтобы каждый раз не приводить
  if (this._autocomplete) {
    this._items = this._items.map(function(item) {
      // Разделяем на слова, чтобы можно было искать более точные соответствия и в неправильном порядке
      var words = item.title.toLowerCase().split(' ');

      item.search = {};
      item.search.original = words;
      item.search.translite = words.map(function(word) {
        return utils.toTranslite(word);
      });

      return item;
    });
  }

  // Показываем список или сообщение, если он пустой
  if (items && items.length) {
    this._showList(items);
  } else {
    this._showNoData(noDataMessage);
  }

  return this;
};

/**
 * Создает блок с текущим значением дропдауна
 *
 * @return {HTMLElement}
 */
DropDown.prototype._createValue = function() {
  var $value = document.createElement('div');

  $value.classList.add('dropdown-value');
  $value.classList.add('dropdown-value_empty');

  this._addValueIcon($value);
  this._addValueClear($value);
  this._addValueCurrent($value);
  this._addValueInput($value);

  return $value;
};

/**
 * Добавляет иконку состояния видимости списка
 *
 * @param {HTMLElement} $value
 */
DropDown.prototype._addValueIcon = function($value) {
  var $icon = document.createElement('span');

  $icon.classList.add('dropdown-value-icon');

  // По клику на иконку тоглим состояние видимости списка
  $icon.addEventListener('mousedown', function(e) {
    e.preventDefault();
    e.stopPropagation();

    if (this._$container.classList.contains('dropdown_open')) {
      this._$input.blur();
    } else {
      this._$input.focus();
    }

  }.bind(this));

  $value.appendChild($icon);
};

/**
 * Добавляет иконку удаления для одиночного значения
 *
 * @param {HTMLElement} $value
 */
DropDown.prototype._addValueClear = function($value) {
  if (this._multi) {
    return;
  }

  var $clear = document.createElement('span');

  $clear.classList.add('dropdown-value-clear');

  $clear.addEventListener('mousedown', function(e) {
    e.preventDefault();
    e.stopPropagation();
    this._onRemoveCurrentItem();
  }.bind(this));

  $value.appendChild($clear);
};

/**
 * Добавляет блок для хранения текущих значений
 *
 * @param {HTMLElement} $value
 */
DropDown.prototype._addValueCurrent = function($value) {
  var $current = document.createElement('div');

  $current.classList.add('dropdown-current');

  // Если без поиска, то добавляем плейсхолдер
  if (!this._autocomplete) {
    $current.appendChild(this._createValuePlaceholder());

    // Если можно выбрать только 1 пункт, то будет обрезать его
    if (!this._multi) {
      $current.classList.add('dropdown_one-line');
    }
  }

  $value.appendChild($current);
};

/**
 * Создаем блок плейсхолдера для дропдауна без поиска
 *
 * @return {HTMLElement}
 */
DropDown.prototype._createValuePlaceholder = function() {
  var $placeholder = document.createElement('span');

  $placeholder.classList.add('dropdown-current-placeholder');
  $placeholder.textContent = this._placeholder;

  return $placeholder;
};

/**
 * Добавляет инпут для поиска
 *
 * @param {HTMLElement} $value
 */
DropDown.prototype._addValueInput = function($value) {
  // Если поиск не включен, то добавим спрятанный инпут, чтобы было куда фокус ставить
  if (!this._autocomplete) {
    this._addValueHiddenInput($value);
    return;
  }

  this._$input = document.createElement('input');
  this._$input.type = 'search';
  this._$input.classList.add('dropdown-input');
  this._$input.placeholder = this._placeholder;

  // При изменении обновляем список
  this._$input.addEventListener('input', this._onSearch);

  // При фокусе показываем список и наоборот
  this._$input.addEventListener('focus', function() {
    this._$container.classList.add('dropdown_open');
  }.bind(this));
  this._$input.addEventListener('blur', function() {
    this._$container.classList.remove('dropdown_open');
  }.bind(this));

  $value.appendChild(this._$input);
};

/**
 * Добавляет спрятанный инпут
 * нужен он, чтобы при потере фокуса с дропдауна он закрывался
 *
 * @param {HTMLElement} $value
 */
DropDown.prototype._addValueHiddenInput = function($value) {
  var that = this;

  this._$input = document.createElement('input');

  this._$input.classList.add('dropdown-input_hidden');

  // При фокусе показываем список и наоборот
  this._$input.addEventListener('focus', function() {
    that._$container.classList.add('dropdown_open');
  });
  this._$input.addEventListener('blur', function() {
    that._$container.classList.remove('dropdown_open');
  });

  // Ввод нам в него не нужен
  this._$input.addEventListener('keydown', function(e) {
    e.preventDefault();
  });

  $value.appendChild(this._$input);

  // По нажатию на элемент ставим фокус
  $value.addEventListener('mousedown', function(e) {
    e.preventDefault();
    that._$input.focus();
  });
};

/**
 * Создает блок со списком
 *
 * @return {HTMLElement}
 */
DropDown.prototype._createPopup = function() {
  this._$popup = document.createElement('div');
  this._$popup.classList.add('dropdown-popup');

  // Список
  this._$list = document.createElement('ul');
  this._$list.classList.add('dropdown-list');
  this._$popup.appendChild(this._$list);

  // Сообщение о пустом списке
  this._$noData = document.createElement('div');
  this._$noData.classList.add('dropdown-list-no-data');
  this._$noData.textContent = '';
  this._$popup.appendChild(this._$noData);

  return this._$popup;
};

/**
 * Создает пункт списка
 *
 * @param {Object} item - данные пункта
 * @return {HTMLElement}
 */
DropDown.prototype._createItem = function(item) {
  var $item = document.createElement('li');

  $item.classList.add('dropdown-list-item');
  $item.classList.add('dropdown_one-line');
  $item.textContent = item.title;
  // Добавляем дату со значением, по которому потом можно будет найти пункт
  $item.setAttribute('data-value', item.value);

  return $item;
};

/**
 * Создает элемент текущего значения, для дропдауна со множественным выбором
 *
 * @param {Object} item - данные пункта
 * @return {HTMLElement}
 */
DropDown.prototype._createCurrentItem = function(item) {
  var $item = document.createElement('span');
  var $title = document.createElement('span');
  var $del = document.createElement('span');

  $item.classList.add('dropdown-current-item');
  $item.classList.add('dropdown_one-line');

  // Удаление значения
  $del.classList.add('dropdown-current-item-delete');
  $del.addEventListener('click', function() {
    $item.parentNode.removeChild($item);
    this._onRemoveCurrentItem(item);
  }.bind(this));
  $item.appendChild($del);

  $title.textContent = item.title;
  $item.appendChild($title);

  return $item;
};

/**
 * Обновляет элементы списка
 *
 * @param {Object[]} items - данные пунктов списка
 */
DropDown.prototype._showList = function(items) {
  var that = this;

  // Скрываем сообщение о пустом списке
  this._$container.classList.remove('dropdown_no-data');
  // Очищаем список
  this._$list.innerHTML = '';

  items
    // Берем только не выбранные пункты
    .filter(function(item) {
      return (that._multi
        ? that._value.indexOf(item.value) === -1
        : that._value !== item.value);
    })
    .forEach(function(item) {
      var $item = that._createItem(item);

      // Вешаем хендлер на выбор пункта
      $item.addEventListener('mousedown', function() {
        that._onSelect($item, item);
      });

      that._$list.appendChild($item);
    });
};

/**
 * Показывает сообщение, что список пустой
 *
 * @param {String} [name] - Сообщение о пустом списке
 */
DropDown.prototype._showNoData = function(message) {
  message = message || 'Нет данных';

  this._$container.classList.add('dropdown_no-data');
  this._$noData.innerHTML = message;
};

/**
 * Отменяет выбранный пункт
 *
 * @param {Object} item
 */
DropDown.prototype._onRemoveCurrentItem = function(item) {
  var $current = this._$container.querySelector('.dropdown-current');
  var prevSelectedSelector = '.dropdown-list-item_selected';
  var $prevSelected;
  var index;

  // Для множественного выбора, находим нужный пункт и убираем его
  if (this._multi) {
    index = this._value.indexOf(item.value);

    if (index >= 0) {
      this._value = this._value.slice(0, index).concat(this._value.slice(index + 1));
    }

    // Будем делать поиск конкретного пункта
    prevSelectedSelector += '[data-value="' + item.value + '"]';

  // Для единичного просто обнуляем значение
  } else {
    this._value = null;
    $current.innerHTML = '';
  }

  // Показываем пункт в списке
  $prevSelected = this._$container.querySelector(prevSelectedSelector);

  if ($prevSelected) {
    $prevSelected.classList.remove('dropdown-list-item_selected');
  }

  // Если больше нет выбранных пунктов, помечаем текущее значение пустым
  if (!this._value || !this._value.length) {
    this._$container
      .querySelector('.dropdown-value')
      .classList.add('dropdown-value_empty');

    // Если без поиска, то добавляем плейсхолдер
    if (!this._autocomplete) {
      $current.appendChild(this._createValuePlaceholder());
    }
  }

  // Сбрасываем поиск при выборе пункта
  if (this._autocomplete) {
    this._$input.value = '';
    this._onSearch();
  }
};

/**
 * Выбираем указанный пункт
 *
 * @param {HTMLElement} $item
 * @param {Object} item
 */
DropDown.prototype._onSelect = function($item, item) {
  var $current = this._$container.querySelector('.dropdown-current');
  var $value = this._$container.querySelector('.dropdown-value');
  var $currentValue;
  var $prevSelected;
  var $placeholder;

  // Для множественного выбора убираем плейсхолдер и добавляем значение в список текущих
  if (this._multi) {
    // Добавляем выбранный пункт к текущим значениям
    this._value.push(item.value);
    $current.appendChild(this._createCurrentItem(item));

    // Убираем плейсхолдер, если есть
    $placeholder = $current.querySelector('.dropdown-current-placeholder');

    if ($placeholder) {
      $placeholder.parentNode.removeChild($placeholder);
    }

  // Для одиночного текущий пункт делаем невыбранным и выставляем новый
  } else {
    // Если выбран другой пункт, то сначала делаем его видимым в списке
    $prevSelected = this._$container.querySelector('.dropdown-list-item_selected');

    if ($prevSelected) {
      $prevSelected.classList.remove('dropdown-list-item_selected');
    }

    // Выставляем как текущее значение выбранный пункт
    this._value = item.value;

    $currentValue = document.createElement('span');
    $currentValue.classList.add('dropdown-current-value');
    $currentValue.classList.add('dropdown_one-line');
    $currentValue.textContent = item.title
    $current.innerHTML = '';
    $current.appendChild($currentValue);
  }

  // Сбрасываем поиск при выборе пункта
  if (this._autocomplete) {
    this._$input.value = '';
    this._onSearch();
  }

  // Убираем пункт из списка
  $item.classList.add('dropdown-list-item_selected');

  $value.classList.remove('dropdown-value_empty');
};

/**
 * Делает поиск пунктов соответствующих запросу
 */
DropDown.prototype._onSearch = function() {
  // Получаем список id соответствующих пунктов
  var ids = this._getSearchIds();

  // Исключаем из списка выбранные пункты
  ids = ids.filter(function(id) {
    return (this._multi
      ? this._value.indexOf(Number(id)) === -1
      : this._value !== Number(id));
  }.bind(this));

  if (ids.length) {
    // Показываем только пункты, соответствующие поиску
    this._hideNotFoundItems(ids);

  } else {
    this._showNoData('Ничего не найдено');
  }
};

/**
 * Делает поиск пунктов соответствующих запросу
 *
 * @param {String[]} ids - список пунктов, которые должны быть видимы
 */
DropDown.prototype._hideNotFoundItems = function(ids) {
  var $items = this._$container.querySelectorAll('.dropdown-list-item');
  var $item;
  var method;
  var i;
  var end;

  this._$container.classList.remove('dropdown_no-data');

  for (i = 0, end = $items.length; i < end; i++) {
    $item = $items[i];
    method = ids.indexOf($item.getAttribute('data-value')) === -1 ? 'add' : 'remove';

    $item.classList[method]('dropdown-list-item_hidden');
  }
};

/**
 * Получает текущее значение поиска в виде слов в различных вариациях(раскладка, транслит)
 *
 * @return {String[]}
 */
DropDown.prototype._getSearchWords = function() {
  return this._$input.value
    .trim()
    // Игнорим регист при поиске
    .toLowerCase()
    // Ищем каждое слово
    .split(' ')
    .map(function(str) {
      // Пустые убираем
      if (!str) return;

      // Получаем разные вариации для каждого слова
      return utils.getAllVariations(str);
    })
    // Собственно убираем пустые
    .filter(Boolean);
};

/**
 * Получает список id пунктов, которые соответсвуют текущему значению поиска
 *
 * @return {String[]}
 */
DropDown.prototype._getSearchIds = function() {
  var searchWords = this._getSearchWords();

  // Находим все соответствующие поиску пункты
  return this._items
    .filter(function(item) {
      // Ищем более точные соответствия заданные несколькими словами
      // В улучшенной версии можно было бы искать, например, и по вхождению любого слова
      // просто опускать их ниже в приоритете(в зависимости от кол-ва соответствующих слов)
      return searchWords.every(function(word) {
        // Проверяем все варианты
        return word.some(function(str) {
          return (
            // Для каждого варианта пробуем найти вхождение в любое слово
            item.search.original.some(function(search) {
              return search.indexOf(str) !== -1;
            }) ||
            item.search.translite.some(function(search) {
              return search.indexOf(str) !== -1;
            })
          );
        });
      });
    })
    .map(function(item) {
      return String(item.value);
    });
};

module.exports = DropDown;
