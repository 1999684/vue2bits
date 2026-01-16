<template>
  <component
    :is="componentType"
    :style="componentStyle"
    :class="componentClasses"
    v-bind="componentAttrs"
    v-html="isNodeItem ? item.node : undefined"
  />
</template>

<script>
export default {
  name: 'LogoContent',
  props: {
    item: {
      type: Object,
      required: true
    },
    scaleOnHover: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    isNodeItem() {
      return 'node' in this.item;
    },

    componentType() {
      return this.isNodeItem ? 'span' : 'img';
    },

    componentStyle() {
      const baseStyle = {
        display: 'inline-flex',
        alignItems: 'center'
      };

      if (this.isNodeItem) {
        return {
          ...baseStyle,
          fontSize: 'var(--logoloop-logoHeight)',
          lineHeight: 1
        };
      } else {
        // 图片样式
        return {
          height: 'var(--logoloop-logoHeight)',
          width: 'auto',
          display: 'block',
          objectFit: 'contain',
          userSelect: 'none',
          pointerEvents: 'none',
          imageRendering: '-webkit-optimize-contrast'
        };
      }
    },

    componentClasses() {
      const classes = [];

      if (this.scaleOnHover) {
        classes.push('scale-on-hover2');
      }

      return classes;
    },

    componentAttrs() {
      if (this.isNodeItem) {
        return {
          'aria-hidden': !this.item.ariaLabel ? 'true' : 'false'
        };
      } else {
        // 图片属性
        return {
          src: this.item.src,
          srcset: this.item.srcSet,
          sizes: this.item.sizes,
          width: this.item.width,
          height: this.item.height,
          alt: this.item.alt || '',
          title: this.item.title,
          loading: 'lazy',
          decoding: 'async',
          draggable: false
        };
      }
    }
  }
};
</script>

<style scoped>
.scale-on-hover2 {
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  .scale-on-hover2 {
    transition: none;
  }
}

/* 父级悬停时缩放 */
.logo-item.scale-on-hover:hover .scale-on-hover2 {
  transform: scale(1.2);
}
</style>
