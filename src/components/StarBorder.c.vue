<template>
  <component
    :is="as"
    class="star-border-container"
    :class="customClass"
    :style="componentStyle"
    v-on="$listeners"
  >
    <div class="star-movement-bottom" :style="bottomStarStyle"></div>

    <div class="star-movement-top" :style="topStarStyle"></div>

    <div class="star-border-content">
      <slot />
    </div>
  </component>
</template>

<script>
export default {
  name: "StarBorder",
  props: {
    as: {
      type: String,
      default: "button",
    },
    customClass: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "white",
    },
    speed: {
      type: String,
      default: "6s",
    },
    thickness: {
      type: Number,
      default: 1,
    },
  },
  computed: {
    componentStyle: function () {
      return {
        padding: this.thickness + "px 0",
      };
    },
    bottomStarStyle: function () {
      return {
        background:
          "radial-gradient(circle, " + this.color + ", transparent 10%)",
        animationDuration: this.speed,
      };
    },
    topStarStyle: function () {
      return {
        background:
          "radial-gradient(circle, " + this.color + ", transparent 10%)",
        animationDuration: this.speed,
      };
    },
  },
};
</script>

<style scoped>
.star-border-container {
  position: relative;
  display: inline-block;
  overflow: hidden;
  background: transparent !important;
  border: none !important;
  border-radius: 20px;
  cursor: pointer;
}

.star-movement-bottom {
  position: absolute;
  width: 300%;
  height: 50%;
  opacity: 0.7;
  bottom: -11px;
  right: -250%;
  border-radius: 9999px;
  z-index: 0;
  animation: star-movement-bottom linear infinite alternate;
}

.star-movement-top {
  position: absolute;
  width: 300%;
  height: 50%;
  opacity: 0.7;
  top: -10px;
  left: -250%;
  border-radius: 9999px;
  z-index: 0;
  animation: star-movement-top linear infinite alternate;
}

.star-border-content {
  position: relative;
  z-index: 10;
  border: 1px solid #333;
  background-color: #0b0b0b;
  color: white;
  font-size: 16px;
  text-align: center;
  padding: 24px 64px;
  border-radius: 20px;
}

@keyframes star-movement-bottom {
  0% {
    transform: translate(0%, 0%);
    opacity: 1;
  }
  100% {
    transform: translate(-100%, 0%);
    opacity: 0;
  }
}

@keyframes star-movement-top {
  0% {
    transform: translate(0%, 0%);
    opacity: 1;
  }
  100% {
    transform: translate(100%, 0%);
    opacity: 0;
  }
}
</style>
