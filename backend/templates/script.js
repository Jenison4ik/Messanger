"use strict";

// Загрузка mods.json выполнится динамически через fetch — это совместимо с большим
// количеством браузеров и не приводит к SyntaxError для 'assert'.
let modlist = [];
/**
 * Класс для управления модальным окном (показ и скрытие с анимацией).
 * Реализует открытие, закрытие по клику на фон и плавные переходы.
 */
class Modal {
  /**
   * Создаёт экземпляр модального окна.
   * @param {string} id - ID элемента модального окна (без #).
   * @param {Object} [options] - Дополнительные настройки.
   * @param {boolean} [options.closeOnEscape=true] - Разрешить закрытие модалки по клавише Escape.
   */
  constructor(id, { closeOnEscape = true } = {}) {
    /**
     * DOM-элемент модального окна.
     * @type {HTMLElement|null}
     * @private
     */
    this._element = document.querySelector(`#${id}`);

    /**
     * Флаг, чтобы избежать повторного закрытия во время анимации.
     * @type {boolean}
     * @private
     */
    this._isClosing = false;

    /**
     * Включено ли закрытие по Escape.
     * @type {boolean}
     * @private
     */
    this._closeOnEscape = closeOnEscape;

    this._handleWheel = this._handleWheel.bind(this);
    this._handleKeys = this._handleKeys.bind(this);

    this._element.addEventListener("click", (e) => {
      if (
        (e.target.classList.contains("modal") ||
          e.target.classList.contains("close-btn")) &&
        !this._isClosing
      ) {
        this._isClosing = true;
        this.close();
      }
    });
  }

  /**
   * Обработчик скролла для блокировки прокрутки.
   * @param {WheelEvent} e
   * @private
   */
  _handleWheel(e) {
    e.preventDefault();
  }

  /**
   * Обработчик клавиш для закрытия модалки и блокировки стрелок.
   * @param {KeyboardEvent} e
   * @private
   */
  _handleKeys(e) {
    if (e.key === "Escape" && this._closeOnEscape && !this._isClosing) {
      this._isClosing = true;
      this.close();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
    }
  }

  /**
   * Показывает модальное окно с анимацией появления.
   * Устанавливает display:flex, блокирует скролл и активирует слушатели клавиш и колеса.
   */
  show() {
    this._isClosing = false;
    this._element.style.display = "flex";
    document.body.style.overflow = "hidden";

    document.addEventListener("wheel", this._handleWheel, { passive: false });
    document.addEventListener("touchmove", this._handleWheel, {
      passive: false,
    });
    if (this._closeOnEscape) {
      document.addEventListener("keydown", this._handleKeys, {
        passive: false,
      });
    }

    this._element.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 300,
      fill: "forwards",
    });
  }

  /**
   * Закрывает модальное окно с анимацией исчезновения.
   * Снимает слушатели, снимает блокировку скролла и скрывает элемент.
   */
  close() {
    document.removeEventListener("wheel", this._handleWheel);
    document.removeEventListener("touchmove", this._handleWheel);
    if (this._closeOnEscape) {
      document.removeEventListener("keydown", this._handleKeys);
    }
    document.body.style.overflow = "";

    const anim = this._element.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 300,
      fill: "forwards",
      direction: "reverse",
    });

    anim.finished.then(() => {
      this._element.style.display = "none";
    });
  }
}

async function getServerData() {
  const res = await fetch("https://api.mcsrvstat.us/3/jenison.ru");
  if (res.ok) {
    const resJson = await res.json();
    return `Сейчас рубятся ${resJson.players.online} из ${resJson.players.max} игроков`;
  } else {
    return "Ошибка загрузки онлайна";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const modal = new Modal("mod");
  const online_elem = document.querySelector("#online");

  const players = getServerData();

  players.then((res) => {
    online_elem.innerHTML = res;
    const divAnim = document.createElement("div");
    divAnim.classList.add("online-anim");
    online_elem.before(divAnim);
    setInterval(async () => {
      online_elem.innerHTML = await getServerData();
    }, 30000);
  });

  document.querySelector("#play-btn").addEventListener("click", () => {
    modal.show();
  });
  document.querySelector("#start-link").addEventListener("click", () => {
    modal.show();
  });
  // Загрузим mods.json динамически — более совместимый подход, чем import assertion
  try {
    const resMods = await fetch("./mods.json");
    if (resMods.ok) {
      const modsJson = await resMods.json();
      // Если структура { mods: [...] } — используем mods, иначе используем весь объект
      modlist = modsJson.mods ?? modsJson;
    } else {
      console.warn("Failed to load mods.json:", resMods.status);
    }
  } catch (err) {
    console.warn("Error fetching mods.json:", err);
  }

  let modsElem = new DocumentFragment();
  console.log(modlist[1]);
  modlist.forEach((mod) => {
    const li = document.createElement("li");
    li.classList.add("mod-item");
    const name = document.createElement("h3");
    name.innerHTML = mod.name;
    li.appendChild(name);
    const description = document.createElement("p");
    description.innerHTML = mod.description;
    li.appendChild(description);
    modsElem.appendChild(li);
  });

  document.querySelector("#modlist").appendChild(modsElem);

  // Плавная анимация для <details> — перехватываем клик по <summary>
  const detailsList = document.querySelectorAll(".mods-details");
  detailsList.forEach((details) => {
    const summary = details.querySelector("summary");
    if (!summary) return;

    // Ensure overflow hidden on the element (extra safety)
    details.style.overflow = "hidden";

    summary.addEventListener("click", (e) => {
      e.preventDefault();

      const isOpen = details.open;
      const summaryHeight = summary.offsetHeight;

      if (!isOpen) {
        // expand
        // set initial height to summary height to start animation
        details.style.height = summaryHeight + "px";
        // open immediately so content is measurable
        details.open = true;
        // measure target full height
        const target = details.scrollHeight;
        details.style.transition = "height  1260ms ease";
        // kickoff animation on next frame
        requestAnimationFrame(() => {
          details.style.height = target + "px";
        });

        const onEnd = (ev) => {
          if (ev.propertyName === "height") {
            details.style.height = "auto";
            details.style.transition = "";
            details.removeEventListener("transitionend", onEnd);
          }
        };
        details.addEventListener("transitionend", onEnd);
      } else {
        // collapse
        // from current full height to summary height
        const full = details.scrollHeight;
        details.style.height = full + "px";
        // need next frame to apply collapse height
        requestAnimationFrame(() => {
          details.style.transition = "height 260ms ease";
          details.style.height = summaryHeight + "px";
        });

        const onEndCollapse = (ev) => {
          if (ev.propertyName === "height") {
            // actually close after animation
            details.open = false;
            details.style.transition = "";
            details.style.height = "";
            details.removeEventListener("transitionend", onEndCollapse);
          }
        };
        details.addEventListener("transitionend", onEndCollapse);
      }
    });
  });
});
