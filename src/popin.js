Popin.elements = [];

function Popin(options = {}) {
  this.opt = {
    destroyOnClose: true,
    footer: false,
    cssClasses: [],
    closeMethods: ["button", "overlay", "escape"],
    ...options,
  };
  this.template = document.querySelector(`#${this.opt.templateId}`);

  if (!this.template) {
    console.error(`#${this.opt.templateId} not found`);
    return;
  }

  const { closeMethods } = this.opt;
  this._allowButtonClose = closeMethods.includes("button");
  this._allowBackdropClose = closeMethods.includes("overlay");
  this._allowEscapeClose = closeMethods.includes("escape");

  this._footerButtons = [];

  this._handleEscapeKey = this._handleEscapeKey.bind(this);
}

Popin.prototype._build = function () {
  const content = this.template.content.cloneNode(true);

  this._backdrop = document.createElement("div");
  this._backdrop.className = "popin__backdrop";

  const container = document.createElement("div");
  container.className = "popin__container";

  this.opt.cssClasses.forEach((className) => {
    if (typeof className === "string") {
      container.classList.add(className);
    }
  });

  if (this._allowButtonClose) {
    const closeBtn = this._createButton("&times;", "popin__close", () =>
      this.close()
    );

    container.append(closeBtn);
  }

  const modalContent = document.createElement("div");
  modalContent.className = "popin__content";

  modalContent.append(content);
  container.append(modalContent);

  if (this.opt.footer) {
    this._modalFooter = document.createElement("div");
    this._modalFooter.className = "popin__footer";

    this._renderFooterContent();
    this._renderFooterButtons();

    container.append(this._modalFooter);
  }

  this._backdrop.append(container);
  document.body.append(this._backdrop);
};

Popin.prototype.setFooterContent = function (html) {
  this._footerContent = html;
  this._renderFooterContent();
};

Popin.prototype.addFooterButton = function (title, cssClass, callback) {
  const button = this._createButton(title, cssClass, callback);
  this._footerButtons.push(button);
  this._renderFooterButtons();
};

Popin.prototype._renderFooterContent = function () {
  if (this._modalFooter && this._footerContent) {
    this._modalFooter.innerHTML = this._footerContent;
  }
};

Popin.prototype._renderFooterButtons = function () {
  if (this._modalFooter) {
    this._footerButtons.forEach((button) => {
      this._modalFooter.append(button);
    });
  }
};

Popin.prototype._createButton = function (title, cssClass, callback) {
  const button = document.createElement("button");
  button.className = cssClass;
  button.innerHTML = title;
  button.onclick = callback;

  return button;
};

Popin.prototype.open = function () {
  Popin.elements.push(this);

  if (!this._backdrop) {
    this._build();
  }

  setTimeout(() => {
    this._backdrop.classList.add("popin--show");
  }, 0);

  document.body.classList.add("popin--no-scroll");
  document.body.style.paddingRight = this._getScrollbarWidth() + "px";

  if (this._allowBackdropClose) {
    this._backdrop.onclick = (e) => {
      if (e.target === this._backdrop) {
        this.close();
      }
    };
  }

  if (this._allowEscapeClose) {
    document.addEventListener("keydown", this._handleEscapeKey);
  }

  this._onTransitionEnd(this.opt.onOpen);

  return this._backdrop;
};

Popin.prototype._handleEscapeKey = function (e) {
  const lastModal = Popin.elements[Popin.elements.length - 1];
  if (e.key === "Escape" && this === lastModal) {
    this.close();
  }
};

Popin.prototype._onTransitionEnd = function (callback) {
  this._backdrop.ontransitionend = (e) => {
    if (e.propertyName !== "transform") return;
    if (typeof callback === "function") callback();
  };
};

Popin.prototype.close = function (destroy = this.opt.destroyOnClose) {
  Popin.elements.pop();

  this._backdrop.classList.remove("popin--show");

  if (this._allowEscapeClose) {
    document.removeEventListener("keydown", this._handleEscapeKey);
  }

  this._onTransitionEnd(() => {
    if (this._backdrop && destroy) {
      this._backdrop.remove();
      this._backdrop = null;
    }

    if (!Popin.elements.length) {
      document.body.classList.remove("popin--no-scroll");
      document.body.style.paddingRight = "";
    }

    if (typeof this.opt.onClose === "function") this.opt.onClose();
  });
};

Popin.prototype.destroy = function () {
  this.close(true);
};

Popin.prototype._getScrollbarWidth = function () {
  if (this._scrollbarWidth) return this._scrollbarWidth;

  const div = document.createElement("div");
  Object.assign(div.style, {
    overflow: "scroll",
    position: "absolute",
    top: "-9999px",
  });

  document.body.appendChild(div);

  this._scrollbarWidth = div.offsetWidth - div.clientWidth;

  document.body.removeChild(div);

  return this._scrollbarWidth;
};
