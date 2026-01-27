<template>
  <div ref="containerRef" class="image-trail-container">
    <div
      v-for="(url, i) in items"
      :key="i"
      class="image-trail-container-div content__img"
    >
      <div
        class="image-trail-container-div-inner content__img-inner"
        :style="{ backgroundImage: 'url(' + url + ')' }"
      />
    </div>
  </div>
</template>

<script>
function lerp(a, b, n) {
  return (1 - n) * a + n * b;
}

function getLocalPointerPos(e, rect) {
  let clientX = 0,
    clientY = 0;
  if ("touches" in e && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if ("clientX" in e) {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

function getMouseDistance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.hypot(dx, dy);
}

function ImageItem(DOM_el) {
  this.DOM = {
    el: DOM_el,
    inner: null,
  };
  this.defaultStyle = { scale: 1, x: 0, y: 0, opacity: 0 };
  this.rect = null;
  this.resize = null;

  this.init = function () {
    this.DOM.inner = this.DOM.el.querySelector(".content__img-inner");
    this.getRect();
    this.initEvents();
  };

  this.initEvents = function () {
    var self = this;
    this.resize = function () {
      if (window.gsap) {
        window.gsap.set(self.DOM.el, self.defaultStyle);
      } else {
        // 备用方案：如果没有 GSAP，使用原生 CSS
        self.DOM.el.style.transform = "scale(1) translate(0px, 0px)";
        self.DOM.el.style.opacity = "0";
      }
      self.getRect();
    };
    window.addEventListener("resize", this.resize);
  };

  this.getRect = function () {
    this.rect = this.DOM.el.getBoundingClientRect();
  };

  this.init();
}

function ImageTrailVariant1(container) {
  var self = this;
  this.container = container;
  this.DOM = { el: container };
  this.images = [...container.querySelectorAll(".content__img")].map(function (
    img
  ) {
    var imageItem = new ImageItem(img);
    imageItem.init();
    return imageItem;
  });
  this.imagesTotal = this.images.length;
  this.imgPosition = 0;
  this.zIndexVal = 1;
  this.activeImagesCount = 0;
  this.isIdle = true;
  this.threshold = 80;
  this.mousePos = { x: 0, y: 0 };
  this.lastMousePos = { x: 0, y: 0 };
  this.cacheMousePos = { x: 0, y: 0 };

  var handlePointerMove = function (ev) {
    var rect = self.container.getBoundingClientRect();
    self.mousePos = getLocalPointerPos(ev, rect);
  };
  container.addEventListener("mousemove", handlePointerMove);
  container.addEventListener("touchmove", handlePointerMove);

  var initRender = function (ev) {
    var rect = self.container.getBoundingClientRect();
    self.mousePos = getLocalPointerPos(ev, rect);
    self.cacheMousePos = { x: self.mousePos.x, y: self.mousePos.y };
    requestAnimationFrame(function () {
      self.render();
    });
    container.removeEventListener("mousemove", initRender);
    container.removeEventListener("touchmove", initRender);
  };
  container.addEventListener("mousemove", initRender);
  container.addEventListener("touchmove", initRender);
}

ImageTrailVariant1.prototype.render = function () {
  var distance = getMouseDistance(this.mousePos, this.lastMousePos);
  this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.1);
  this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.1);

  if (distance > this.threshold) {
    this.showNextImage();
    this.lastMousePos = { x: this.mousePos.x, y: this.mousePos.y };
  }
  if (this.isIdle && this.zIndexVal !== 1) {
    this.zIndexVal = 1;
  }
  var self = this;
  requestAnimationFrame(function () {
    self.render();
  });
};

ImageTrailVariant1.prototype.showNextImage = function () {
  ++this.zIndexVal;
  this.imgPosition =
    this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0;
  var img = this.images[this.imgPosition];

  if (window.gsap) {
    window.gsap.killTweensOf(img.DOM.el);
    window.gsap
      .timeline({
        onStart: function () {
          self.onImageActivated();
        },
        onComplete: function () {
          self.onImageDeactivated();
        },
      })
      .fromTo(
        img.DOM.el,
        {
          opacity: 1,
          scale: 1,
          zIndex: this.zIndexVal,
          x: this.cacheMousePos.x - (img.rect ? img.rect.width : 0) / 2,
          y: this.cacheMousePos.y - (img.rect ? img.rect.height : 0) / 2,
        },
        {
          duration: 0.4,
          ease: "power1",
          x: this.mousePos.x - (img.rect ? img.rect.width : 0) / 2,
          y: this.mousePos.y - (img.rect ? img.rect.height : 0) / 2,
        },
        0
      )
      .to(
        img.DOM.el,
        {
          duration: 0.4,
          ease: "power3",
          opacity: 0,
          scale: 0.2,
        },
        0.4
      );
  } else {
    // 备用方案：如果没有 GSAP，使用原生 CSS 动画
    var self = this;
    var el = img.DOM.el;
    el.style.transition = "none";
    el.style.opacity = "1";
    el.style.transform =
      "scale(1) translate(" +
      (this.cacheMousePos.x - (img.rect ? img.rect.width : 0) / 2) +
      "px, " +
      (this.cacheMousePos.y - (img.rect ? img.rect.height : 0) / 2) +
      "px)";
    el.style.zIndex = this.zIndexVal;

    this.onImageActivated();

    setTimeout(function () {
      el.style.transition = "transform 0.4s ease, opacity 0.4s ease";
      el.style.transform =
        "scale(0.2) translate(" +
        (self.mousePos.x - (img.rect ? img.rect.width : 0) / 2) +
        "px, " +
        (self.mousePos.y - (img.rect ? img.rect.height : 0) / 2) +
        "px)";
      el.style.opacity = "0";
    }, 10);

    setTimeout(function () {
      self.onImageDeactivated();
    }, 400);
  }
};

ImageTrailVariant1.prototype.onImageActivated = function () {
  this.activeImagesCount++;
  this.isIdle = false;
};

ImageTrailVariant1.prototype.onImageDeactivated = function () {
  this.activeImagesCount--;
  if (this.activeImagesCount === 0) {
    this.isIdle = true;
  }
};

function ImageTrailVariant2(container) {
  var self = this;
  this.container = container;
  this.DOM = { el: container };
  this.images = [...container.querySelectorAll(".content__img")].map(function (
    img
  ) {
    var imageItem = new ImageItem(img);
    imageItem.init();
    return imageItem;
  });
  this.imagesTotal = this.images.length;
  this.imgPosition = 0;
  this.zIndexVal = 1;
  this.activeImagesCount = 0;
  this.isIdle = true;
  this.threshold = 80;
  this.mousePos = { x: 0, y: 0 };
  this.lastMousePos = { x: 0, y: 0 };
  this.cacheMousePos = { x: 0, y: 0 };

  var handlePointerMove = function (ev) {
    var rect = container.getBoundingClientRect();
    self.mousePos = getLocalPointerPos(ev, rect);
  };
  container.addEventListener("mousemove", handlePointerMove);
  container.addEventListener("touchmove", handlePointerMove);

  var initRender = function (ev) {
    var rect = container.getBoundingClientRect();
    self.mousePos = getLocalPointerPos(ev, rect);
    self.cacheMousePos = { x: self.mousePos.x, y: self.mousePos.y };
    requestAnimationFrame(function () {
      self.render();
    });
    container.removeEventListener("mousemove", initRender);
    container.removeEventListener("touchmove", initRender);
  };
  container.addEventListener("mousemove", initRender);
  container.addEventListener("touchmove", initRender);
}

ImageTrailVariant2.prototype.render = function () {
  var distance = getMouseDistance(this.mousePos, this.lastMousePos);
  this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.1);
  this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.1);

  if (distance > this.threshold) {
    this.showNextImage();
    this.lastMousePos = { x: this.mousePos.x, y: this.mousePos.y };
  }
  if (this.isIdle && this.zIndexVal !== 1) {
    this.zIndexVal = 1;
  }
  var self = this;
  requestAnimationFrame(function () {
    self.render();
  });
};

ImageTrailVariant2.prototype.showNextImage = function () {
  ++this.zIndexVal;
  this.imgPosition =
    this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0;
  var img = this.images[this.imgPosition];

  if (window.gsap) {
    window.gsap.killTweensOf(img.DOM.el);
    window.gsap
      .timeline({
        onStart: function () {
          this.onImageActivated();
        }.bind(this),
        onComplete: function () {
          this.onImageDeactivated();
        }.bind(this),
      })
      .fromTo(
        img.DOM.el,
        {
          opacity: 1,
          scale: 0,
          zIndex: this.zIndexVal,
          x: this.cacheMousePos.x - (img.rect ? img.rect.width : 0) / 2,
          y: this.cacheMousePos.y - (img.rect ? img.rect.height : 0) / 2,
        },
        {
          duration: 0.4,
          ease: "power1",
          scale: 1,
          x: this.mousePos.x - (img.rect ? img.rect.width : 0) / 2,
          y: this.mousePos.y - (img.rect ? img.rect.height : 0) / 2,
        },
        0
      )
      .fromTo(
        img.DOM.inner,
        { scale: 2.8, filter: "brightness(250%)" },
        {
          duration: 0.4,
          ease: "power1",
          scale: 1,
          filter: "brightness(100%)",
        },
        0
      )
      .to(
        img.DOM.el,
        {
          duration: 0.4,
          ease: "power2",
          opacity: 0,
          scale: 0.2,
        },
        0.45
      );
  } else {
    // 备用方案：如果没有 GSAP，使用原生 CSS 动画
    var self = this;
    var el = img.DOM.el;
    var inner = img.DOM.inner;
    el.style.transition = "none";
    inner.style.transition = "none";
    el.style.opacity = "1";
    el.style.transform =
      "scale(0) translate(" +
      (this.cacheMousePos.x - (img.rect ? img.rect.width : 0) / 2) +
      "px, " +
      (this.cacheMousePos.y - (img.rect ? img.rect.height : 0) / 2) +
      "px)";
    el.style.zIndex = this.zIndexVal;
    inner.style.transform = "scale(2.8)";
    inner.style.filter = "brightness(250%)";

    this.onImageActivated();

    setTimeout(function () {
      el.style.transition = "transform 0.4s ease, opacity 0.4s ease";
      inner.style.transition = "transform 0.4s ease, filter 0.4s ease";
      el.style.transform =
        "scale(1) translate(" +
        (self.mousePos.x - (img.rect ? img.rect.width : 0) / 2) +
        "px, " +
        (self.mousePos.y - (img.rect ? img.rect.height : 0) / 2) +
        "px)";
      inner.style.transform = "scale(1)";
      inner.style.filter = "brightness(100%)";
    }, 10);

    setTimeout(function () {
      el.style.transition = "transform 0.4s ease, opacity 0.4s ease";
      el.style.opacity = "0";
      el.style.transform =
        "scale(0.2) translate(" +
        (self.mousePos.x - (img.rect ? img.rect.width : 0) / 2) +
        "px, " +
        (self.mousePos.y - (img.rect ? img.rect.height : 0) / 2) +
        "px)";
    }, 400);

    setTimeout(function () {
      self.onImageDeactivated();
    }, 850);
  }
};

ImageTrailVariant2.prototype.onImageActivated = function () {
  this.activeImagesCount++;
  this.isIdle = false;
};

ImageTrailVariant2.prototype.onImageDeactivated = function () {
  this.activeImagesCount--;
  if (this.activeImagesCount === 0) {
    this.isIdle = true;
  }
};

function ImageTrailVariant3(container) {
  var self = this;
  this.container = container;
  this.DOM = { el: container };
  this.images = [...container.querySelectorAll(".content__img")].map(function (
    img
  ) {
    var imageItem = new ImageItem(img);
    imageItem.init();
    return imageItem;
  });
  this.imagesTotal = this.images.length;
  this.imgPosition = 0;
  this.zIndexVal = 1;
  this.activeImagesCount = 0;
  this.isIdle = true;
  this.threshold = 80;
  this.mousePos = { x: 0, y: 0 };
  this.lastMousePos = { x: 0, y: 0 };
  this.cacheMousePos = { x: 0, y: 0 };

  var handlePointerMove = function (ev) {
    var rect = container.getBoundingClientRect();
    self.mousePos = getLocalPointerPos(ev, rect);
  };
  container.addEventListener("mousemove", handlePointerMove);
  container.addEventListener("touchmove", handlePointerMove);

  var initRender = function (ev) {
    var rect = container.getBoundingClientRect();
    self.mousePos = getLocalPointerPos(ev, rect);
    self.cacheMousePos = { x: self.mousePos.x, y: self.mousePos.y };
    requestAnimationFrame(function () {
      self.render();
    });
    container.removeEventListener("mousemove", initRender);
    container.removeEventListener("touchmove", initRender);
  };
  container.addEventListener("mousemove", initRender);
  container.addEventListener("touchmove", initRender);
}

ImageTrailVariant3.prototype.render = function () {
  var distance = getMouseDistance(this.mousePos, this.lastMousePos);
  this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.1);
  this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.1);

  if (distance > this.threshold) {
    this.showNextImage();
    this.lastMousePos = { x: this.mousePos.x, y: this.mousePos.y };
  }
  if (this.isIdle && this.zIndexVal !== 1) {
    this.zIndexVal = 1;
  }
  var self = this;
  requestAnimationFrame(function () {
    self.render();
  });
};

ImageTrailVariant3.prototype.showNextImage = function () {
  ++this.zIndexVal;
  this.imgPosition =
    this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0;
  var img = this.images[this.imgPosition];

  if (window.gsap) {
    window.gsap.killTweensOf(img.DOM.el);
    window.gsap
      .timeline({
        onStart: function () {
          this.onImageActivated();
        }.bind(this),
        onComplete: function () {
          this.onImageDeactivated();
        }.bind(this),
      })
      .fromTo(
        img.DOM.el,
        {
          opacity: 1,
          scale: 0,
          zIndex: this.zIndexVal,
          xPercent: 0,
          yPercent: 0,
          x: this.cacheMousePos.x - (img.rect ? img.rect.width : 0) / 2,
          y: this.cacheMousePos.y - (img.rect ? img.rect.height : 0) / 2,
        },
        {
          duration: 0.4,
          ease: "power1",
          scale: 1,
          x: this.mousePos.x - (img.rect ? img.rect.width : 0) / 2,
          y: this.mousePos.y - (img.rect ? img.rect.height : 0) / 2,
        },
        0
      )
      .fromTo(
        img.DOM.inner,
        { scale: 1.2 },
        {
          duration: 0.4,
          ease: "power1",
          scale: 1,
        },
        0
      )
      .to(
        img.DOM.el,
        {
          duration: 0.6,
          ease: "power2",
          opacity: 0,
          scale: 0.2,
          xPercent: function () {
            return window.gsap.utils.random(-30, 30);
          },
          yPercent: -200,
        },
        0.6
      );
  } else {
    // 备用方案：如果没有 GSAP，使用原生 CSS 动画
    var self = this;
    var el = img.DOM.el;
    var inner = img.DOM.inner;
    el.style.transition = "none";
    inner.style.transition = "none";
    el.style.opacity = "1";
    el.style.transform =
      "scale(0) translate(" +
      (this.cacheMousePos.x - (img.rect ? img.rect.width : 0) / 2) +
      "px, " +
      (this.cacheMousePos.y - (img.rect ? img.rect.height : 0) / 2) +
      "px)";
    el.style.zIndex = this.zIndexVal;
    inner.style.transform = "scale(1.2)";

    this.onImageActivated();

    setTimeout(function () {
      el.style.transition = "transform 0.4s ease, opacity 0.4s ease";
      inner.style.transition = "transform 0.4s ease";
      el.style.transform =
        "scale(1) translate(" +
        (self.mousePos.x - (img.rect ? img.rect.width : 0) / 2) +
        "px, " +
        (self.mousePos.y - (img.rect ? img.rect.height : 0) / 2) +
        "px)";
      inner.style.transform = "scale(1)";
    }, 10);

    setTimeout(function () {
      el.style.transition = "transform 0.6s ease, opacity 0.6s ease";
      el.style.opacity = "0";
      el.style.transform = "scale(0.2) translate(0, -200%)";
    }, 400);

    setTimeout(function () {
      self.onImageDeactivated();
    }, 1000);
  }
};

ImageTrailVariant3.prototype.onImageActivated = function () {
  this.activeImagesCount++;
  this.isIdle = false;
};

ImageTrailVariant3.prototype.onImageDeactivated = function () {
  this.activeImagesCount--;
  if (this.activeImagesCount === 0) {
    this.isIdle = true;
  }
};

function ImageTrailVariant4(container) {
  var self = this;
  this.container = container;
  this.DOM = { el: container };
  this.images = [...container.querySelectorAll(".content__img")].map(function (
    img
  ) {
    var imageItem = new ImageItem(img);
    imageItem.init();
    return imageItem;
  });
  this.imagesTotal = this.images.length;
  this.imgPosition = 0;
  this.zIndexVal = 1;
  this.activeImagesCount = 0;
  this.isIdle = true;
  this.threshold = 80;
  this.mousePos = { x: 0, y: 0 };
  this.lastMousePos = { x: 0, y: 0 };
  this.cacheMousePos = { x: 0, y: 0 };

  var handlePointerMove = function (ev) {
    var rect = container.getBoundingClientRect();
    self.mousePos = getLocalPointerPos(ev, rect);
  };
  container.addEventListener("mousemove", handlePointerMove);
  container.addEventListener("touchmove", handlePointerMove);

  var initRender = function (ev) {
    var rect = container.getBoundingClientRect();
    self.mousePos = getLocalPointerPos(ev, rect);
    self.cacheMousePos = { x: self.mousePos.x, y: self.mousePos.y };
    requestAnimationFrame(function () {
      self.render();
    });
    container.removeEventListener("mousemove", initRender);
    container.removeEventListener("touchmove", initRender);
  };
  container.addEventListener("mousemove", initRender);
  container.addEventListener("touchmove", initRender);
}

ImageTrailVariant4.prototype.render = function () {
  var distance = getMouseDistance(this.mousePos, this.lastMousePos);
  if (distance > this.threshold) {
    this.showNextImage();
    this.lastMousePos = { x: this.mousePos.x, y: this.mousePos.y };
  }
  this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.1);
  this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.1);

  if (this.isIdle && this.zIndexVal !== 1) this.zIndexVal = 1;
  var self = this;
  requestAnimationFrame(function () {
    self.render();
  });
};

ImageTrailVariant4.prototype.showNextImage = function () {
  ++this.zIndexVal;
  this.imgPosition =
    this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0;
  var img = this.images[this.imgPosition];

  if (window.gsap) {
    window.gsap.killTweensOf(img.DOM.el);

    var dx = this.mousePos.x - this.cacheMousePos.x;
    var dy = this.mousePos.y - this.cacheMousePos.y;
    var distance = Math.sqrt(dx * dx + dy * dy);
    if (distance !== 0) {
      dx /= distance;
      dy /= distance;
    }
    dx *= distance / 100;
    dy *= distance / 100;

    window.gsap
      .timeline({
        onStart: function () {
          this.onImageActivated();
        }.bind(this),
        onComplete: function () {
          this.onImageDeactivated();
        }.bind(this),
      })
      .fromTo(
        img.DOM.el,
        {
          opacity: 1,
          scale: 0,
          zIndex: this.zIndexVal,
          x: this.cacheMousePos.x - (img.rect ? img.rect.width : 0) / 2,
          y: this.cacheMousePos.y - (img.rect ? img.rect.height : 0) / 2,
        },
        {
          duration: 0.4,
          ease: "power1",
          scale: 1,
          x: this.mousePos.x - (img.rect ? img.rect.width : 0) / 2,
          y: this.mousePos.y - (img.rect ? img.rect.height : 0) / 2,
        },
        0
      )
      .fromTo(
        img.DOM.inner,
        {
          scale: 2,
          filter:
            "brightness(" +
            Math.max((400 * distance) / 100, 100) +
            "%) contrast(" +
            Math.max((400 * distance) / 100, 100) +
            "%)",
        },
        {
          duration: 0.4,
          ease: "power1",
          scale: 1,
          filter: "brightness(100%) contrast(100%)",
        },
        0
      )
      .to(
        img.DOM.el,
        {
          duration: 0.4,
          ease: "power3",
          opacity: 0,
        },
        0.4
      )
      .to(
        img.DOM.el,
        {
          duration: 1.5,
          ease: "power4",
          x: "+=" + dx * 110,
          y: "+=" + dy * 110,
        },
        0.05
      );
  } else {
    // 备用方案：如果没有 GSAP，使用原生 CSS 动画
    var self = this;
    var dx = this.mousePos.x - this.cacheMousePos.x;
    var dy = this.mousePos.y - this.cacheMousePos.y;
    var distance = Math.sqrt(dx * dx + dy * dy);
    if (distance !== 0) {
      dx /= distance;
      dy /= distance;
    }
    dx *= distance / 100;
    dy *= distance / 100;

    var el = img.DOM.el;
    var inner = img.DOM.inner;
    el.style.transition = "none";
    inner.style.transition = "none";
    el.style.opacity = "1";
    el.style.transform =
      "scale(0) translate(" +
      (this.cacheMousePos.x - (img.rect ? img.rect.width : 0) / 2) +
      "px, " +
      (this.cacheMousePos.y - (img.rect ? img.rect.height : 0) / 2) +
      "px)";
    el.style.zIndex = this.zIndexVal;
    inner.style.transform = "scale(2)";
    inner.style.filter =
      "brightness(" +
      Math.max((400 * distance) / 100, 100) +
      "%) contrast(" +
      Math.max((400 * distance) / 100, 100) +
      "%)";

    this.onImageActivated();

    setTimeout(function () {
      el.style.transition = "transform 0.4s ease, opacity 0.4s ease";
      inner.style.transition = "transform 0.4s ease, filter 0.4s ease";
      el.style.transform =
        "scale(1) translate(" +
        (self.mousePos.x - (img.rect ? img.rect.width : 0) / 2) +
        "px, " +
        (self.mousePos.y - (img.rect ? img.rect.height : 0) / 2) +
        "px)";
      inner.style.transform = "scale(1)";
      inner.style.filter = "brightness(100%) contrast(100%)";
    }, 10);

    setTimeout(function () {
      el.style.transition = "opacity 0.4s ease, transform 1.5s ease";
      el.style.opacity = "0";
      el.style.transform =
        "scale(1) translate(" +
        (self.mousePos.x - (img.rect ? img.rect.width : 0) / 2 + dx * 110) +
        "px, " +
        (self.mousePos.y - (img.rect ? img.rect.height : 0) + dy * 110) +
        "px)";
    }, 400);

    setTimeout(function () {
      self.onImageDeactivated();
    }, 2000);
  }
};

ImageTrailVariant4.prototype.onImageActivated = function () {
  this.activeImagesCount++;
  this.isIdle = false;
};

ImageTrailVariant4.prototype.onImageDeactivated = function () {
  this.activeImagesCount--;
  if (this.activeImagesCount === 0) {
    this.isIdle = true;
  }
};

function ImageTrailVariant5(container) {
  var self = this;
  this.container = container;
  this.DOM = { el: container };
  this.images = [...container.querySelectorAll(".content__img")].map(function (
    img
  ) {
    var imageItem = new ImageItem(img);
    imageItem.init();
    return imageItem;
  });
  this.imagesTotal = this.images.length;
  this.imgPosition = 0;
  this.zIndexVal = 1;
  this.activeImagesCount = 0;
  this.isIdle = true;
  this.threshold = 80;
  this.mousePos = { x: 0, y: 0 };
  this.lastMousePos = { x: 0, y: 0 };
  this.cacheMousePos = { x: 0, y: 0 };
  this.lastAngle = 0;

  var handlePointerMove = function (ev) {
    var rect = container.getBoundingClientRect();
    self.mousePos = getLocalPointerPos(ev, rect);
  };
  container.addEventListener("mousemove", handlePointerMove);
  container.addEventListener("touchmove", handlePointerMove);

  var initRender = function (ev) {
    var rect = container.getBoundingClientRect();
    self.mousePos = getLocalPointerPos(ev, rect);
    self.cacheMousePos = { x: self.mousePos.x, y: self.mousePos.y };
    requestAnimationFrame(function () {
      self.render();
    });
    container.removeEventListener("mousemove", initRender);
    container.removeEventListener("touchmove", initRender);
  };
  container.addEventListener("mousemove", initRender);
  container.addEventListener("touchmove", initRender);
}

ImageTrailVariant5.prototype.render = function () {
  var distance = getMouseDistance(this.mousePos, this.lastMousePos);
  if (distance > this.threshold) {
    this.showNextImage();
    this.lastMousePos = { x: this.mousePos.x, y: this.mousePos.y };
  }
  this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.1);
  this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.1);
  if (this.isIdle && this.zIndexVal !== 1) this.zIndexVal = 1;
  var self = this;
  requestAnimationFrame(function () {
    self.render();
  });
};

ImageTrailVariant5.prototype.showNextImage = function () {
  var dx = this.mousePos.x - this.cacheMousePos.x;
  var dy = this.mousePos.y - this.cacheMousePos.y;
  var angle = Math.atan2(dy, dx) * (180 / Math.PI);
  if (angle < 0) angle += 360;
  if (angle > 90 && angle <= 270) angle += 180;
  var isMovingClockwise = angle >= this.lastAngle;
  this.lastAngle = angle;
  var startAngle = isMovingClockwise ? angle - 10 : angle + 10;
  var distance = Math.sqrt(dx * dx + dy * dy);
  if (distance !== 0) {
    dx /= distance;
    dy /= distance;
  }
  dx *= distance / 150;
  dy *= distance / 150;

  ++this.zIndexVal;
  this.imgPosition =
    this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0;
  var img = this.images[this.imgPosition];

  if (window.gsap) {
    window.gsap.killTweensOf(img.DOM.el);

    window.gsap
      .timeline({
        onStart: function () {
          this.onImageActivated();
        }.bind(this),
        onComplete: function () {
          this.onImageDeactivated();
        }.bind(this),
      })
      .fromTo(
        img.DOM.el,
        {
          opacity: 1,
          filter: "brightness(80%)",
          scale: 0.1,
          zIndex: this.zIndexVal,
          x: this.cacheMousePos.x - (img.rect ? img.rect.width : 0) / 2,
          y: this.cacheMousePos.y - (img.rect ? img.rect.height : 0) / 2,
          rotation: startAngle,
        },
        {
          duration: 1,
          ease: "power2",
          scale: 1,
          filter: "brightness(100%)",
          x: this.mousePos.x - (img.rect ? img.rect.width : 0) / 2 + dx * 70,
          y: this.mousePos.y - (img.rect ? img.rect.height : 0) / 2 + dy * 70,
          rotation: this.lastAngle,
        },
        0
      )
      .to(
        img.DOM.el,
        {
          duration: 0.4,
          ease: "expo",
          opacity: 0,
        },
        0.5
      )
      .to(
        img.DOM.el,
        {
          duration: 1.5,
          ease: "power4",
          x: "+=" + dx * 120,
          y: "+=" + dy * 120,
        },
        0.05
      );
  } else {
    // 备用方案：如果没有 GSAP，使用原生 CSS 动画
    var self = this;
    var dx = this.mousePos.x - this.cacheMousePos.x;
    var dy = this.mousePos.y - this.cacheMousePos.y;
    var angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    if (angle > 90 && angle <= 270) angle += 180;
    var isMovingClockwise = angle >= this.lastAngle;
    this.lastAngle = angle;
    var startAngle = isMovingClockwise ? angle - 10 : angle + 10;
    var distance = Math.sqrt(dx * dx + dy * dy);
    if (distance !== 0) {
      dx /= distance;
      dy /= distance;
    }
    dx *= distance / 150;
    dy *= distance / 150;

    var el = img.DOM.el;
    el.style.transition = "none";
    el.style.opacity = "1";
    el.style.filter = "brightness(80%)";
    el.style.transform =
      "scale(0.1) rotate(" +
      startAngle +
      "deg) translate(" +
      (this.cacheMousePos.x - (img.rect ? img.rect.width : 0) / 2) +
      "px, " +
      (this.cacheMousePos.y - (img.rect ? img.rect.height : 0) / 2) +
      "px)";
    el.style.zIndex = this.zIndexVal;

    this.onImageActivated();

    setTimeout(function () {
      el.style.transition =
        "transform 1s ease, opacity 0.4s ease, filter 1s ease";
      el.style.transform =
        "scale(1) rotate(" +
        self.lastAngle +
        "deg) translate(" +
        (self.mousePos.x - (img.rect ? img.rect.width : 0) / 2 + dx * 70) +
        "px, " +
        (self.mousePos.y - (img.rect ? img.rect.height : 0) / 2 + dy * 70) +
        "px)";
      el.style.filter = "brightness(100%)";
    }, 10);

    setTimeout(function () {
      el.style.transition = "opacity 0.4s ease";
      el.style.opacity = "0";
    }, 1500);

    setTimeout(function () {
      el.style.transition = "transform 1.5s ease";
      var currentTransform = window.getComputedStyle(el).transform;
      var matrix = new DOMMatrix(currentTransform);
      var translateX = matrix.m41;
      var translateY = matrix.m42;
      el.style.transform =
        "rotate(" +
        self.lastAngle +
        "deg) translate(" +
        (translateX + dx * 120) +
        "px, " +
        (translateY + dy * 120) +
        "px)";
    }, 1550);

    setTimeout(function () {
      self.onImageDeactivated();
    }, 3000);
  }
};

ImageTrailVariant5.prototype.onImageActivated = function () {
  this.activeImagesCount++;
  this.isIdle = false;
};

ImageTrailVariant5.prototype.onImageDeactivated = function () {
  this.activeImagesCount--;
  if (this.activeImagesCount === 0) this.isIdle = true;
};

function ImageTrailVariant6(container) {
  var self = this;
  this.container = container;
  this.DOM = { el: container };
  this.images = [...container.querySelectorAll(".content__img")].map(function (
    img
  ) {
    var imageItem = new ImageItem(img);
    imageItem.init();
    return imageItem;
  });
  this.imagesTotal = this.images.length;
  this.imgPosition = 0;
  this.zIndexVal = 1;
  this.activeImagesCount = 0;
  this.isIdle = true;
  this.threshold = 80;
  this.mousePos = { x: 0, y: 0 };
  this.lastMousePos = { x: 0, y: 0 };
  this.cacheMousePos = { x: 0, y: 0 };

  var handlePointerMove = function (ev) {
    var rect = container.getBoundingClientRect();
    self.mousePos = getLocalPointerPos(ev, rect);
  };
  container.addEventListener("mousemove", handlePointerMove);
  container.addEventListener("touchmove", handlePointerMove);

  var initRender = function (ev) {
    var rect = container.getBoundingClientRect();
    self.mousePos = getLocalPointerPos(ev, rect);
    self.cacheMousePos = { x: self.mousePos.x, y: self.mousePos.y };
    requestAnimationFrame(function () {
      self.render();
    });
    container.removeEventListener("mousemove", initRender);
    container.removeEventListener("touchmove", initRender);
  };
  container.addEventListener("mousemove", initRender);
  container.addEventListener("touchmove", initRender);
}

ImageTrailVariant6.prototype.render = function () {
  var distance = getMouseDistance(this.mousePos, this.lastMousePos);
  this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.3);
  this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.3);

  if (distance > this.threshold) {
    this.showNextImage();
    this.lastMousePos = { x: this.mousePos.x, y: this.mousePos.y };
  }
  if (this.isIdle && this.zIndexVal !== 1) {
    this.zIndexVal = 1;
  }
  var self = this;
  requestAnimationFrame(function () {
    self.render();
  });
};

ImageTrailVariant6.prototype.mapSpeedToSize = function (
  speed,
  minSize,
  maxSize
) {
  var maxSpeed = 200;
  return minSize + (maxSize - minSize) * Math.min(speed / maxSpeed, 1);
};

ImageTrailVariant6.prototype.mapSpeedToBrightness = function (
  speed,
  minB,
  maxB
) {
  var maxSpeed = 70;
  return minB + (maxB - minB) * Math.min(speed / maxSpeed, 1);
};

ImageTrailVariant6.prototype.mapSpeedToBlur = function (
  speed,
  minBlur,
  maxBlur
) {
  var maxSpeed = 90;
  return minBlur + (maxBlur - minBlur) * Math.min(speed / maxSpeed, 1);
};

ImageTrailVariant6.prototype.mapSpeedToGrayscale = function (
  speed,
  minG,
  maxG
) {
  var maxSpeed = 90;
  return minG + (maxG - minG) * Math.min(speed / maxSpeed, 1);
};

ImageTrailVariant6.prototype.showNextImage = function () {
  var dx = this.mousePos.x - this.cacheMousePos.x;
  var dy = this.mousePos.y - this.cacheMousePos.y;
  var speed = Math.sqrt(dx * dx + dy * dy);

  ++this.zIndexVal;
  this.imgPosition =
    this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0;
  var img = this.images[this.imgPosition];

  var scaleFactor = this.mapSpeedToSize(speed, 0.3, 2);
  var brightnessValue = this.mapSpeedToBrightness(speed, 0, 1.3);
  var blurValue = this.mapSpeedToBlur(speed, 20, 0);
  var grayscaleValue = this.mapSpeedToGrayscale(speed, 600, 0);

  if (window.gsap) {
    window.gsap.killTweensOf(img.DOM.el);
    window.gsap
      .timeline({
        onStart: function () {
          this.onImageActivated();
        }.bind(this),
        onComplete: function () {
          this.onImageDeactivated();
        }.bind(this),
      })
      .fromTo(
        img.DOM.el,
        {
          opacity: 1,
          scale: 0,
          zIndex: this.zIndexVal,
          x: this.cacheMousePos.x - (img.rect ? img.rect.width : 0) / 2,
          y: this.cacheMousePos.y - (img.rect ? img.rect.height : 0) / 2,
        },
        {
          duration: 0.8,
          ease: "power3",
          scale: scaleFactor,
          filter:
            "grayscale(" +
            grayscaleValue * 100 +
            "%) brightness(" +
            brightnessValue * 100 +
            "%) blur(" +
            blurValue +
            "px)",
          x: this.mousePos.x - (img.rect ? img.rect.width : 0) / 2,
          y: this.mousePos.y - (img.rect ? img.rect.height : 0) / 2,
        },
        0
      )
      .fromTo(
        img.DOM.inner,
        { scale: 2 },
        {
          duration: 0.8,
          ease: "power3",
          scale: 1,
        },
        0
      )
      .to(
        img.DOM.el,
        {
          duration: 0.4,
          ease: "power3.in",
          opacity: 0,
          scale: 0.2,
        },
        0.45
      );
  } else {
    // 备用方案：如果没有 GSAP，使用原生 CSS 动画
    var self = this;
    var dx = this.mousePos.x - this.cacheMousePos.x;
    var dy = this.mousePos.y - this.cacheMousePos.y;
    var speed = Math.sqrt(dx * dx + dy * dy);

    var el = img.DOM.el;
    var inner = img.DOM.inner;
    el.style.transition = "none";
    inner.style.transition = "none";
    el.style.opacity = "1";
    el.style.transform =
      "scale(0) translate(" +
      (this.cacheMousePos.x - (img.rect ? img.rect.width : 0) / 2) +
      "px, " +
      (this.cacheMousePos.y - (img.rect ? img.rect.height : 0) / 2) +
      "px)";
    el.style.zIndex = this.zIndexVal;
    el.style.filter =
      "grayscale(" +
      grayscaleValue * 100 +
      "%) brightness(" +
      brightnessValue * 100 +
      "%) blur(" +
      blurValue +
      "px)";
    inner.style.transform = "scale(2)";

    this.onImageActivated();

    setTimeout(function () {
      el.style.transition =
        "transform 0.8s ease, opacity 0.8s ease, filter 0.8s ease";
      inner.style.transition = "transform 0.8s ease";
      el.style.transform =
        "scale(" +
        scaleFactor +
        ") translate(" +
        (self.mousePos.x - (img.rect ? img.rect.width : 0) / 2) +
        "px, " +
        (self.mousePos.y - (img.rect ? img.rect.height : 0) / 2) +
        "px)";
      inner.style.transform = "scale(1)";
    }, 10);

    setTimeout(function () {
      el.style.transition = "transform 0.4s ease, opacity 0.4s ease";
      el.style.opacity = "0";
      el.style.transform =
        "scale(0.2) translate(" +
        (self.mousePos.x - (img.rect ? img.rect.width : 0) / 2) +
        "px, " +
        (self.mousePos.y - (img.rect ? img.rect.height : 0) / 2) +
        "px)";
    }, 800);

    setTimeout(function () {
      self.onImageDeactivated();
    }, 1250);
  }
};

ImageTrailVariant6.prototype.onImageActivated = function () {
  this.activeImagesCount++;
  this.isIdle = false;
};

ImageTrailVariant6.prototype.onImageDeactivated = function () {
  this.activeImagesCount--;
  if (this.activeImagesCount === 0) {
    this.isIdle = true;
  }
};

function getNewPosition(position, offset, arr) {
  var realOffset = Math.abs(offset) % arr.length;
  if (position - realOffset >= 0) {
    return position - realOffset;
  } else {
    return arr.length - (realOffset - position);
  }
}

function ImageTrailVariant7(container) {
  var self = this;
  this.container = container;
  this.DOM = { el: container };
  this.images = [...container.querySelectorAll(".content__img")].map(function (
    img
  ) {
    var imageItem = new ImageItem(img);
    imageItem.init();
    return imageItem;
  });
  this.imagesTotal = this.images.length;
  this.imgPosition = 0;
  this.zIndexVal = 1;
  this.activeImagesCount = 0;
  this.isIdle = true;
  this.threshold = 80;
  this.mousePos = { x: 0, y: 0 };
  this.lastMousePos = { x: 0, y: 0 };
  this.cacheMousePos = { x: 0, y: 0 };
  this.visibleImagesCount = 0;
  this.visibleImagesTotal = 9;
  this.visibleImagesTotal = Math.min(
    this.visibleImagesTotal,
    this.imagesTotal - 1
  );

  var handlePointerMove = function (ev) {
    var rect = container.getBoundingClientRect();
    self.mousePos = getLocalPointerPos(ev, rect);
  };
  container.addEventListener("mousemove", handlePointerMove);
  container.addEventListener("touchmove", handlePointerMove);

  var initRender = function (ev) {
    var rect = container.getBoundingClientRect();
    self.mousePos = getLocalPointerPos(ev, rect);
    self.cacheMousePos = { x: self.mousePos.x, y: self.mousePos.y };
    requestAnimationFrame(function () {
      self.render();
    });
    container.removeEventListener("mousemove", initRender);
    container.removeEventListener("touchmove", initRender);
  };
  container.addEventListener("mousemove", initRender);
  container.addEventListener("touchmove", initRender);
}

ImageTrailVariant7.prototype.render = function () {
  var distance = getMouseDistance(this.mousePos, this.lastMousePos);
  this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.3);
  this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.3);

  if (distance > this.threshold) {
    this.showNextImage();
    this.lastMousePos = { x: this.mousePos.x, y: this.mousePos.y };
  }
  if (this.isIdle && this.zIndexVal !== 1) this.zIndexVal = 1;

  var self = this;
  requestAnimationFrame(function () {
    self.render();
  });
};

ImageTrailVariant7.prototype.showNextImage = function () {
  ++this.zIndexVal;
  this.imgPosition =
    this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0;
  var img = this.images[this.imgPosition];
  ++this.visibleImagesCount;

  if (window.gsap) {
    window.gsap.killTweensOf(img.DOM.el);
    var scaleValue = window.gsap.utils.random(0.5, 1.6);

    window.gsap
      .timeline({
        onStart: function () {
          this.onImageActivated();
        }.bind(this),
        onComplete: function () {
          this.onImageDeactivated();
        }.bind(this),
      })
      .fromTo(
        img.DOM.el,
        {
          scale: scaleValue - Math.max(window.gsap.utils.random(0.2, 0.6), 0),
          rotationZ: 0,
          opacity: 1,
          zIndex: this.zIndexVal,
          x: this.cacheMousePos.x - (img.rect ? img.rect.width : 0) / 2,
          y: this.cacheMousePos.y - (img.rect ? img.rect.height : 0) / 2,
        },
        {
          duration: 0.4,
          ease: "power3",
          scale: scaleValue,
          rotationZ: window.gsap.utils.random(-3, 3),
          x: this.mousePos.x - (img.rect ? img.rect.width : 0) / 2,
          y: this.mousePos.y - (img.rect ? img.rect.height : 0) / 2,
        },
        0
      );
  } else {
    // 备用方案：如果没有 GSAP，使用原生 CSS 动画
    var scaleValue = Math.random() * 1.1 + 0.5; // 模拟 gsap.utils.random(0.5, 1.6)
    var rotationZ = Math.random() * 6 - 3; // 模拟 gsap.utils.random(-3, 3)

    var el = img.DOM.el;
    el.style.transition = "none";
    el.style.opacity = "1";
    el.style.transform =
      "scale(" +
      (scaleValue - Math.max(Math.random() * 0.4 + 0.2, 0)) +
      ") rotateZ(0deg) translate(" +
      (this.cacheMousePos.x - (img.rect ? img.rect.width : 0) / 2) +
      "px, " +
      (this.cacheMousePos.y - (img.rect ? img.rect.height : 0) / 2) +
      "px)";
    el.style.zIndex = this.zIndexVal;

    this.onImageActivated();

    setTimeout(function () {
      el.style.transition = "transform 0.4s ease, opacity 0.4s ease";
      el.style.transform =
        "scale(" +
        scaleValue +
        ") rotateZ(" +
        rotationZ +
        "deg) translate(" +
        (self.mousePos.x - (img.rect ? img.rect.width : 0) / 2) +
        "px, " +
        (self.mousePos.y - (img.rect ? img.rect.height : 0) / 2) +
        "px)";
    }, 10);

    if (this.visibleImagesCount >= this.visibleImagesTotal) {
      var lastInQueue = getNewPosition(
        this.imgPosition,
        this.visibleImagesTotal,
        this.images
      );
      var oldImg = this.images[lastInQueue];
      setTimeout(function () {
        var oldEl = oldImg.DOM.el;
        oldEl.style.transition = "opacity 0.4s ease, transform 0.4s ease";
        oldEl.style.opacity = "0";
        oldEl.style.transform =
          "scale(1.3) translate(" +
          (self.mousePos.x - (oldImg.rect ? oldImg.rect.width : 0) / 2) +
          "px, " +
          (self.mousePos.y - (oldImg.rect ? oldImg.rect.height : 0) / 2) +
          "px)";

        if (self.activeImagesCount === 1) {
          self.isIdle = true;
        }
      }, 100);
    }

    setTimeout(function () {
      self.onImageDeactivated();
    }, 400);
  }
};

ImageTrailVariant7.prototype.onImageActivated = function () {
  this.activeImagesCount++;
  this.isIdle = false;
};

ImageTrailVariant7.prototype.onImageDeactivated = function () {
  this.activeImagesCount--;
};

function ImageTrailVariant8(container) {
  var self = this;
  this.container = container;
  this.DOM = { el: container };
  this.images = [...container.querySelectorAll(".content__img")].map(function (
    img
  ) {
    var imageItem = new ImageItem(img);
    imageItem.init();
    return imageItem;
  });
  this.imagesTotal = this.images.length;
  this.imgPosition = 0;
  this.zIndexVal = 1;
  this.activeImagesCount = 0;
  this.isIdle = true;
  this.threshold = 80;
  this.mousePos = { x: 0, y: 0 };
  this.lastMousePos = { x: 0, y: 0 };
  this.cacheMousePos = { x: 0, y: 0 };
  this.rotation = { x: 0, y: 0 };
  this.cachedRotation = { x: 0, y: 0 };
  this.zValue = 0;
  this.cachedZValue = 0;

  var handlePointerMove = function (ev) {
    var rect = container.getBoundingClientRect();
    self.mousePos = getLocalPointerPos(ev, rect);
  };
  container.addEventListener("mousemove", handlePointerMove);
  container.addEventListener("touchmove", handlePointerMove);

  var initRender = function (ev) {
    var rect = container.getBoundingClientRect();
    self.mousePos = getLocalPointerPos(ev, rect);
    self.cacheMousePos = { x: self.mousePos.x, y: self.mousePos.y };
    requestAnimationFrame(function () {
      self.render();
    });
    container.removeEventListener("mousemove", initRender);
    container.removeEventListener("touchmove", initRender);
  };
  container.addEventListener("mousemove", initRender);
  container.addEventListener("touchmove", initRender);
}

ImageTrailVariant8.prototype.render = function () {
  var distance = getMouseDistance(this.mousePos, this.lastMousePos);
  this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.1);
  this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.1);

  if (distance > this.threshold) {
    this.showNextImage();
    this.lastMousePos = { x: this.mousePos.x, y: this.mousePos.y };
  }
  if (this.isIdle && this.zIndexVal !== 1) {
    this.zIndexVal = 1;
  }
  var self = this;
  requestAnimationFrame(function () {
    self.render();
  });
};

ImageTrailVariant8.prototype.showNextImage = function () {
  var rect = this.container.getBoundingClientRect();
  var centerX = rect.width / 2;
  var centerY = rect.height / 2;
  var relX = this.mousePos.x - centerX;
  var relY = this.mousePos.y - centerY;

  this.rotation.x = -(relY / centerY) * 30;
  this.rotation.y = (relX / centerX) * 30;
  this.cachedRotation = { x: this.rotation.x, y: this.rotation.y };

  var distanceFromCenter = Math.sqrt(relX * relX + relY * relY);
  var maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
  var proportion = distanceFromCenter / maxDistance;
  this.zValue = proportion * 1200 - 600;
  this.cachedZValue = this.zValue;
  var normalizedZ = (this.zValue + 600) / 1200;
  var brightness = 0.2 + normalizedZ * 2.3;

  ++this.zIndexVal;
  this.imgPosition =
    this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0;
  var img = this.images[this.imgPosition];

  if (window.gsap) {
    window.gsap.killTweensOf(img.DOM.el);

    window.gsap
      .timeline({
        onStart: function () {
          this.onImageActivated();
        }.bind(this),
        onComplete: function () {
          this.onImageDeactivated();
        }.bind(this),
      })
      .set(this.DOM.el, { perspective: 1000 }, 0)
      .fromTo(
        img.DOM.el,
        {
          opacity: 1,
          z: 0,
          scale: 1 + this.cachedZValue / 1000,
          zIndex: this.zIndexVal,
          x: this.cacheMousePos.x - (img.rect ? img.rect.width : 0) / 2,
          y: this.cacheMousePos.y - (img.rect ? img.rect.height : 0) / 2,
          rotationX: this.cachedRotation.x,
          rotationY: this.cachedRotation.y,
          filter: "brightness(" + brightness + ")",
        },
        {
          duration: 1,
          ease: "expo",
          scale: 1 + this.zValue / 1000,
          x: this.mousePos.x - (img.rect ? img.rect.width : 0) / 2,
          y: this.mousePos.y - (img.rect ? img.rect.height : 0) / 2,
          rotationX: this.rotation.x,
          rotationY: this.rotation.y,
        },
        0
      )
      .to(
        img.DOM.el,
        {
          duration: 0.4,
          ease: "power2",
          opacity: 0,
          z: -800,
        },
        0.3
      );
  } else {
    // 备用方案：如果没有 GSAP，使用原生 CSS 动画
    var self = this;
    var rect = this.container.getBoundingClientRect();
    var centerX = rect.width / 2;
    var centerY = rect.height / 2;
    var relX = this.mousePos.x - centerX;
    var relY = this.mousePos.y - centerY;

    this.rotation.x = -(relY / centerY) * 30;
    this.rotation.y = (relX / centerX) * 30;
    this.cachedRotation = { x: this.rotation.x, y: this.rotation.y };

    var distanceFromCenter = Math.sqrt(relX * relX + relY * relY);
    var maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    var proportion = distanceFromCenter / maxDistance;
    this.zValue = proportion * 1200 - 600;
    this.cachedZValue = this.zValue;
    var normalizedZ = (this.zValue + 600) / 1200;
    var brightness = 0.2 + normalizedZ * 2.3;

    var el = img.DOM.el;
    el.style.transition = "none";
    el.style.opacity = "1";
    el.style.transform =
      "translateZ(0) scale(" +
      (1 + this.cachedZValue / 1000) +
      ") rotateX(" +
      this.cachedRotation.x +
      "deg) rotateY(" +
      this.cachedRotation.y +
      "deg) translate(" +
      (this.cacheMousePos.x - (img.rect ? img.rect.width : 0) / 2) +
      "px, " +
      (this.cacheMousePos.y - (img.rect ? img.rect.height : 0) / 2) +
      "px)";
    el.style.zIndex = this.zIndexVal;
    el.style.filter = "brightness(" + brightness + ")";

    this.onImageActivated();

    setTimeout(function () {
      el.style.transition =
        "transform 1s ease, opacity 1s ease, filter 1s ease";
      el.style.transform =
        "translateZ(" +
        self.zValue +
        "px) scale(" +
        (1 + self.zValue / 1000) +
        ") rotateX(" +
        self.rotation.x +
        "deg) rotateY(" +
        self.rotation.y +
        "deg) translate(" +
        (self.mousePos.x - (img.rect ? img.rect.width : 0) / 2) +
        "px, " +
        (self.mousePos.y - (img.rect ? img.rect.height : 0) / 2) +
        "px)";
    }, 10);

    setTimeout(function () {
      el.style.transition = "transform 0.4s ease, opacity 0.4s ease";
      el.style.opacity = "0";
      el.style.transform =
        "translateZ(-800px) scale(" +
        (1 + self.zValue / 1000) +
        ") rotateX(" +
        self.rotation.x +
        "deg) rotateY(" +
        self.rotation.y +
        "deg) translate(" +
        (self.mousePos.x - (img.rect ? img.rect.width : 0) / 2) +
        "px, " +
        (self.mousePos.y - (img.rect ? img.rect.height : 0) / 2) +
        "px)";
    }, 1000);

    setTimeout(function () {
      self.onImageDeactivated();
    }, 1400);
  }
};

ImageTrailVariant8.prototype.onImageActivated = function () {
  this.activeImagesCount++;
  this.isIdle = false;
};

ImageTrailVariant8.prototype.onImageDeactivated = function () {
  this.activeImagesCount--;
  if (this.activeImagesCount === 0) {
    this.isIdle = true;
  }
};

var variantMap = {
  1: ImageTrailVariant1,
  2: ImageTrailVariant2,
  3: ImageTrailVariant3,
  4: ImageTrailVariant4,
  5: ImageTrailVariant5,
  6: ImageTrailVariant6,
  7: ImageTrailVariant7,
  8: ImageTrailVariant8,
};

export default {
  name: "ImageTrail",
  props: {
    items: {
      type: Array,
      default: function () {
        return [];
      },
    },
    variant: {
      type: Number,
      default: 1,
    },
  },
  mounted: function () {
    var self = this;
    this.$nextTick(function () {
      if (!self.$refs.containerRef) return;

      var Cls = variantMap[self.variant] || variantMap[1];
      new Cls(self.$refs.containerRef);
    });
  },
};
</script>

<style scoped>
.image-trail-container {
  z-index: 100;
  position: absolute;
  background: transparent;
  border-radius: 8px;
  overflow: visible;
  width: 100%;
  height: 100%;
}
.image-trail-container-div {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  border-radius: 15px;
  width: 190px;
  aspect-ratio: 1.1;
  overflow: hidden;
  will-change: transform, filter;
}
.image-trail-container-div-inner {
  top: -10px;
  left: -10px;
  position: absolute;
  background-size: cover;
  background-position: center;
  width: calc(100% + 20px);
  height: calc(100% + 20px);
}
</style>
