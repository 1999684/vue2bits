<template>
  <div ref="containerRef" :class="['ascii-text-container', className]"></div>
</template>

<script>
export default {
  name: "AsciiText",
  props: {
    // 文字内容
    text: {
      type: String,
      default: "David!",
    },
    // ASCII字体大小
    asciiFontSize: {
      type: Number,
      default: 3,
    },
    // 文字字体大小
    textFontSize: {
      type: Number,
      default: 20,
    },
    // 文字颜色
    textColor: {
      type: String,
      default: "#fdf9f3",
    },
    // 平面基础高度
    planeBaseHeight: {
      type: Number,
      default: 8,
    },
    // 是否启用波浪效果
    enableWaves: {
      type: Boolean,
      default: true,
    },
    // CSS类名
    className: {
      type: String,
      default: "",
    },
  },
  data: function () {
    return {
      asciiInstance: null,
    };
  },
  mounted: function () {
    // 检查是否在浏览器环境中
    if (typeof window !== "undefined" && typeof window.THREE !== "undefined") {
      this.initAscii();
    } else {
      console.warn(
        "THREE.js is not available. Please include it before using AsciiText component."
      );
    }
  },
  beforeDestroy: function () {
    if (this.asciiInstance) {
      this.asciiInstance.dispose();
    }
  },
  watch: {
    text: function () {
      this.refreshAscii();
    },
    asciiFontSize: function () {
      this.refreshAscii();
    },
    textFontSize: function () {
      this.refreshAscii();
    },
    textColor: function () {
      this.refreshAscii();
    },
    planeBaseHeight: function () {
      this.refreshAscii();
    },
    enableWaves: function () {
      this.refreshAscii();
    },
  },
  methods: {
    initAscii: function () {
      if (
        typeof window === "undefined" ||
        !this.$refs.containerRef ||
        !window.THREE
      )
        return;

      var container = this.$refs.containerRef;
      var width = container.clientWidth || container.offsetWidth;
      var height = container.clientHeight || container.offsetHeight;

      // 创建场景
      var scene = new window.THREE.Scene();

      // 创建相机
      var camera = new window.THREE.PerspectiveCamera(
        45,
        width / height,
        1,
        1000
      );
      camera.position.z = 30;

      // 创建渲染器
      var renderer = new window.THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
      });
      renderer.setPixelRatio(1);
      renderer.setClearColor(0x000000, 0);
      renderer.setSize(width, height);

      // 创建文字纹理
      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");
      context.font = `600 ${this.textFontSize}px IBM Plex Mono`;
      context.fillStyle = this.textColor;

      var metrics = context.measureText(this.text);
      var textWidth = Math.ceil(metrics.width) + 20;
      var textHeight =
        Math.ceil(
          metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
        ) + 20;

      canvas.width = textWidth;
      canvas.height = textHeight;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = this.textColor;
      context.font = `600 ${this.textFontSize}px IBM Plex Mono`;
      context.fillText(this.text, 10, 10 + metrics.actualBoundingBoxAscent);

      var texture = new window.THREE.CanvasTexture(canvas);
      texture.minFilter = window.THREE.NearestFilter;

      // 创建平面几何体
      var textAspect = textWidth / textHeight;
      var baseH = this.planeBaseHeight;
      var planeW = baseH * textAspect;
      var planeH = baseH;

      var geometry = new window.THREE.PlaneGeometry(planeW, planeH, 36, 36);

      // 顶点着色器
      var vertexShader = `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uEnableWaves;

        void main() {
            vUv = uv;
            float time = uTime * 5.;

            float waveFactor = uEnableWaves;

            vec3 transformed = position;

            transformed.x += sin(time + position.y) * 0.5 * waveFactor;
            transformed.y += cos(time + position.z) * 0.15 * waveFactor;
            transformed.z += sin(time + position.x) * waveFactor;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
        }
      `;

      // 片段着色器
      var fragmentShader = `
        varying vec2 vUv;
        uniform sampler2D uTexture;

        void main() {
            vec2 pos = vUv;
            vec4 tex = texture2D(uTexture, pos);
            gl_FragColor = tex;
        }
      `;

      // 创建材质
      var material = new window.THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        uniforms: {
          uTime: { value: 0 },
          uTexture: { value: texture },
          uEnableWaves: { value: this.enableWaves ? 1.0 : 0.0 },
        },
      });

      // 创建网格
      var mesh = new window.THREE.Mesh(geometry, material);
      scene.add(mesh);

      // 添加到容器
      container.appendChild(renderer.domElement);

      // 动画循环
      var self = this;
      var animate = function () {
        requestAnimationFrame(animate);

        var time = new Date().getTime() * 0.001;
        material.uniforms.uTime.value = Math.sin(time);

        // 更新旋转
        var mouseX = 0;
        var mouseY = 0;

        if (container.mouseX !== undefined && container.mouseY !== undefined) {
          mouseX = (container.mouseX / width) * 2 - 1;
          mouseY = -(container.mouseY / height) * 2 + 1;
        }

        mesh.rotation.x += (mouseY * 0.5 - mesh.rotation.x) * 0.05;
        mesh.rotation.y += (mouseX * 0.5 - mesh.rotation.y) * 0.05;

        renderer.render(scene, camera);
      };

      animate();

      // 鼠标移动事件
      var onMouseMove = function (event) {
        var rect = container.getBoundingClientRect();
        container.mouseX = event.clientX - rect.left;
        container.mouseY = event.clientY - rect.top;
      };

      container.addEventListener("mousemove", onMouseMove);

      // 窗口大小调整
      var onWindowResize = function () {
        var width = container.clientWidth || container.offsetWidth;
        var height = container.clientHeight || container.offsetHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };

      window.addEventListener("resize", onWindowResize);

      // 保存实例以便销毁
      this.asciiInstance = {
        scene: scene,
        camera: camera,
        renderer: renderer,
        mesh: mesh,
        material: material,
        texture: texture,
        geometry: geometry,
        canvas: canvas,
        container: container,
        onMouseMove: onMouseMove,
        onWindowResize: onWindowResize,
        dispose: function () {
          container.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("resize", onWindowResize);
          scene.remove(mesh);
          geometry.dispose();
          material.dispose();
          texture.dispose();
          renderer.dispose();
          if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
        },
      };
    },
    refreshAscii: function () {
      if (this.asciiInstance) {
        this.asciiInstance.dispose();
        this.asciiInstance = null;
        this.$nextTick(this.initAscii);
      }
    },
  },
};
</script>

<style scoped>
/* cyrillic-ext */
@font-face {
  font-family: "IBM Plex Mono";
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/ibmplexmono/v20/-F6qfjptAgt5VM-kVkqdyU8n3twJwl1FgtIU.woff2)
    format("woff2");
  unicode-range: U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F,
    U+FE2E-FE2F;
}
/* cyrillic */
@font-face {
  font-family: "IBM Plex Mono";
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/ibmplexmono/v20/-F6qfjptAgt5VM-kVkqdyU8n3twJwlRFgtIU.woff2)
    format("woff2");
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
/* vietnamese */
@font-face {
  font-family: "IBM Plex Mono";
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/ibmplexmono/v20/-F6qfjptAgt5VM-kVkqdyU8n3twJwl9FgtIU.woff2)
    format("woff2");
  unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1,
    U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329,
    U+1EA0-1EF9, U+20AB;
}
/* latin-ext */
@font-face {
  font-family: "IBM Plex Mono";
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/ibmplexmono/v20/-F6qfjptAgt5VM-kVkqdyU8n3twJwl5FgtIU.woff2)
    format("woff2");
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF,
    U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020,
    U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: "IBM Plex Mono";
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/ibmplexmono/v20/-F6qfjptAgt5VM-kVkqdyU8n3twJwlBFgg.woff2)
    format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
    U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193,
    U+2212, U+2215, U+FEFF, U+FFFD;
}
.ascii-text-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.ascii-text-container canvas {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  image-rendering: optimizeSpeed;
  image-rendering: -moz-crisp-edges;
  image-rendering: -o-crisp-edges;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: optimize-contrast;
  image-rendering: crisp-edges;
  image-rendering: pixelated;
}
</style>
