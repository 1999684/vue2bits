<script>
export default {
  name: "AnimatedList",
  props: {
    items: {
      type: Array,
      default: () => [
        "Item 1", "Item 2", "Item 3", "Item 4", "Item 5",
        "Item 6", "Item 7", "Item 8", "Item 9", "Item 10",
        "Item 11", "Item 12", "Item 13", "Item 14", "Item 15"
      ],
    },
    showGradients: {
      type: Boolean,
      default: true,
    },
    enableArrowNavigation: {
      type: Boolean,
      default: true,
    },
    className: {
      type: String,
      default: "",
    },
    itemClassName: {
      type: String,
      default: "",
    },
    displayScrollbar: {
      type: Boolean,
      default: true,
    },
    initialSelectedIndex: {
      type: Number,
      default: -1,
    },
    maxHeight: {
      type: String,
      default: "400px",
    },
    mainBackgroundColor: {
      type: String,
      default: "#0b0b0b",
    },
    itemBackgroundColor: {
      type: String,
      default: "#111",
    },
    itemSelectedBackgroundColor: {
      type: String,
      default: "#222",
    },
  },
  data() {
    return {
      selectedIndex: this.initialSelectedIndex,
      keyboardNav: false,
      topGradientOpacity: 0,
      bottomGradientOpacity: 1,
      itemsInView: [],
    };
  },
  computed: {
    listClasses() {
      return [
        "animated-list-content",
        this.displayScrollbar ? "with-scrollbar" : "hide-scrollbar",
      ];
    },
    cssVars() {
      return {
        "--main-bg": this.mainBackgroundColor,
        "--item-bg": this.itemBackgroundColor,
        "--item-selected-bg": this.itemSelectedBackgroundColor,
        "--list-max-height": this.maxHeight,
      };
    },
  },
  watch: {
    selectedIndex(newIndex) {
      if (!this.keyboardNav || newIndex < 0) return;
      this.scrollToSelected(newIndex);
      this.keyboardNav = false;
    },
    items: {
      immediate: true,
      handler(newItems) {
        this.itemsInView = new Array(newItems.length).fill(true);
        this.$nextTick(() => {
          this.updateItemsInView();
        });
      },
    },
  },
  mounted() {
    if (this.enableArrowNavigation) {
      window.addEventListener("keydown", this.handleKeyDown);
    }
    this.$nextTick(() => {
      if (this.$refs.listRef) {
        this.handleScroll({ target: this.$refs.listRef });
      }
      this.updateItemsInView();
    });
  },
  beforeDestroy() {
    if (this.enableArrowNavigation) {
      window.removeEventListener("keydown", this.handleKeyDown);
    }
  },
  methods: {
    setSelectedIndex(index) {
      this.selectedIndex = index;
    },
    handleScroll(e) {
      const target = e.target;
      const { scrollTop, scrollHeight, clientHeight } = target;

      this.topGradientOpacity = Math.min(scrollTop / 50, 1);
      const bottomDistance = scrollHeight - (scrollTop + clientHeight);
      this.bottomGradientOpacity = scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1);

      this.updateItemsInView();
    },
    updateItemsInView() {
      const container = this.$refs.listRef;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const viewHeight = containerRect.height;

      this.itemsInView = this.items.map((_, index) => {
        const item = container.querySelector(`[data-index="${index}"]`);
        if (!item) return false;

        const itemRect = item.getBoundingClientRect();
        const itemTop = itemRect.top - containerRect.top;
        const itemBottom = itemTop + itemRect.height;

        return itemTop < viewHeight && itemBottom > 0;
      });
    },
    handleKeyDown(e) {
      if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
        e.preventDefault();
        this.keyboardNav = true;
        this.setSelectedIndex(Math.min(this.selectedIndex + 1, this.items.length - 1));
      } else if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
        e.preventDefault();
        this.keyboardNav = true;
        this.setSelectedIndex(Math.max(this.selectedIndex - 1, 0));
      } else if (e.key === "Enter") {
        if (this.selectedIndex >= 0 && this.selectedIndex < this.items.length) {
          e.preventDefault();
          this.onItemClick(this.items[this.selectedIndex], this.selectedIndex);
        }
      }
    },
    scrollToSelected(index) {
      const container = this.$refs.listRef;
      const selectedItem = container.querySelector(`[data-index="${index}"]`);
      if (selectedItem) {
        const extraMargin = 50;
        const containerScrollTop = container.scrollTop;
        const containerHeight = container.clientHeight;
        const itemTop = selectedItem.offsetTop;
        const itemBottom = itemTop + selectedItem.offsetHeight;

        let targetScroll = -1;
        if (itemTop < containerScrollTop + extraMargin) {
          targetScroll = itemTop - extraMargin;
        } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
          targetScroll = itemBottom - containerHeight + extraMargin;
        }

        if (targetScroll !== -1) {
          if (typeof gsap !== "undefined") {
            gsap.to(container, { scrollTop: targetScroll, duration: 0.4, ease: "power2.out" });
          } else {
            container.scrollTo({ top: targetScroll, behavior: "smooth" });
          }
        }
      }
    },
    onItemClick(item, index) {
      this.setSelectedIndex(index);
      this.$emit("itemSelected", item, index);
    }
  },
};
</script>

<template>
  <div 
    ref="containerRef" 
    :class="['animated-list-container', className]"
    :style="cssVars"
  >
    <div
      ref="listRef"
      :class="listClasses"
      @scroll="handleScroll"
    >
      <div
        v-for="(item, index) in items"
        :key="index"
        :data-index="index"
        class="animated-list-item"
        :class="{ 'is-selected': selectedIndex === index, 'is-visible': itemsInView[index] }"
        @mouseenter="setSelectedIndex(index)"
        @click="onItemClick(item, index)"
      >
        <div :class="['item-inner', itemClassName]">
          <p class="item-text">{{ item }}</p>
        </div>
      </div>
    </div>

    <div
      v-if="showGradients"
      class="gradient-mask mask-top"
      :style="{ opacity: topGradientOpacity }"
    />
    <div
      v-if="showGradients"
      class="gradient-mask mask-bottom"
      :style="{ opacity: bottomGradientOpacity }"
    />
  </div>
</template>

<style scoped>
.animated-list-container {
  position: relative;
  width: 500px;
  background-color: var(--main-bg);
  overflow: hidden;
}

.animated-list-content {
  max-height: var(--list-max-height);
  overflow-y: auto;
  padding: 1rem;
}

.hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.with-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: var(--item-selected-bg) var(--main-bg);
}
.with-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.with-scrollbar::-webkit-scrollbar-track {
  background: var(--main-bg);
}
.with-scrollbar::-webkit-scrollbar-thumb {
  background: var(--item-selected-bg);
  border-radius: 4px;
}

.animated-list-item {
  margin-bottom: 1rem;
  cursor: pointer;
  transition: transform 0.4s ease, opacity 0.4s ease;
  transform: scale(0.7);
  opacity: 0;
}

.animated-list-item.is-visible {
  transform: scale(1);
  opacity: 1;
}

.item-inner {
  padding: 1rem;
  background-color: var(--item-bg);
  border-radius: 0.5rem;
  transition: background-color 0.2s ease;
}

.animated-list-item.is-selected .item-inner {
  background-color: var(--item-selected-bg);
}

.item-text {
  color: white;
  margin: 0;
}

.gradient-mask {
  position: absolute;
  left: 0;
  right: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 10;
}

.mask-top {
  top: 0;
  height: 50px;
  background: linear-gradient(to bottom, var(--main-bg), transparent);
}

.mask-bottom {
  bottom: 0;
  height: 100px;
  background: linear-gradient(to top, var(--main-bg), transparent);
}
</style>
