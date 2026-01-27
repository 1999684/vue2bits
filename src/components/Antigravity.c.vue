<template>
  <div ref="containerRef" class="antigravity" />
</template>

<script>
export default {
  name: "Antigravity",
  props: {
    count: {
      type: Number,
      default: 300,
    },
    magnetRadius: {
      type: Number,
      default: 10,
    },
    ringRadius: {
      type: Number,
      default: 10,
    },
    waveSpeed: {
      type: Number,
      default: 0.4,
    },
    waveAmplitude: {
      type: Number,
      default: 1,
    },
    particleSize: {
      type: Number,
      default: 2,
    },
    lerpSpeed: {
      type: Number,
      default: 0.1,
    },
    color: {
      type: String,
      default: "#27FF64",
    },
    autoAnimate: {
      type: Boolean,
      default: false,
    },
    particleVariance: {
      type: Number,
      default: 1,
    },
    rotationSpeed: {
      type: Number,
      default: 0,
    },
    depthFactor: {
      type: Number,
      default: 1,
    },
    pulseSpeed: {
      type: Number,
      default: 3,
    },
    particleShape: {
      type: String,
      default: "capsule",
      validator: function (value) {
        return (
          ["capsule", "sphere", "box", "tetrahedron"].indexOf(value) !== -1
        );
      },
    },
    fieldStrength: {
      type: Number,
      default: 10,
    },
  },
  data: function () {
    return {
      renderer: null,
      scene: null,
      camera: null,
      mesh: null,
      animationFrameId: 0,
      particles: [],
      dummy: null,
      lastMousePos: { x: 0, y: 0 },
      lastMouseMoveTime: 0,
      virtualMouse: { x: 0, y: 0 },
      pointer: { x: 0, y: 0 },
      clock: null,
      // 用于跟踪绑定的事件处理器，以便正确清理
      boundOnPointerMove: null,
      boundOnResize: null,
    };
  },
  mounted: function () {
    // 确保 THREE.js 已加载
    if (typeof window.THREE === "undefined") {
      console.error(
        "THREE.js is not loaded. Please include the THREE.js library."
      );
      return;
    }

    this.boundOnPointerMove = this.onPointerMove.bind(this);
    this.boundOnResize = this.onResize.bind(this);

    this.setupScene();
  },
  beforeDestroy: function () {
    this.cleanup();
  },
  watch: {
    // 监听所有 props 的变化
    count: function () {
      this.restartScene();
    },
    magnetRadius: function () {
      this.restartScene();
    },
    ringRadius: function () {
      this.restartScene();
    },
    waveSpeed: function () {
      this.restartScene();
    },
    waveAmplitude: function () {
      this.restartScene();
    },
    particleSize: function () {
      this.restartScene();
    },
    lerpSpeed: function () {
      this.restartScene();
    },
    color: function () {
      this.restartScene();
    },
    autoAnimate: function () {
      this.restartScene();
    },
    particleVariance: function () {
      this.restartScene();
    },
    rotationSpeed: function () {
      this.restartScene();
    },
    depthFactor: function () {
      this.restartScene();
    },
    pulseSpeed: function () {
      this.restartScene();
    },
    particleShape: function () {
      this.restartScene();
    },
    fieldStrength: function () {
      this.restartScene();
    },
  },
  methods: {
    createGeometry: function (shape) {
      switch (shape) {
        case "sphere":
          return new window.THREE.SphereGeometry(0.2, 16, 16);
        case "box":
          return new window.THREE.BoxGeometry(0.3, 0.3, 0.3);
        case "tetrahedron":
          return new window.THREE.TetrahedronGeometry(0.3);
        case "cylinder":
        default:
          return new window.THREE.CylinderGeometry(0.1, 0.1, 0.4, 8);
      }
    },

    initParticles: function (viewportWidth, viewportHeight) {
      this.particles = [];
      for (let i = 0; i < this.count; i++) {
        const t = Math.random() * 100;
        const factor = 20 + Math.random() * 100;
        const speed = 0.01 + Math.random() / 200;
        const xFactor = -50 + Math.random() * 100;
        const yFactor = -50 + Math.random() * 100;
        const zFactor = -50 + Math.random() * 100;

        const x = (Math.random() - 0.5) * viewportWidth;
        const y = (Math.random() - 0.5) * viewportHeight;
        const z = (Math.random() - 0.5) * 20;

        const randomRadiusOffset = (Math.random() - 0.5) * 2;

        this.particles.push({
          t: t,
          factor: factor,
          speed: speed,
          xFactor: xFactor,
          yFactor: yFactor,
          zFactor: zFactor,
          mx: x,
          my: y,
          mz: z,
          cx: x,
          cy: y,
          cz: z,
          vx: 0,
          vy: 0,
          vz: 0,
          randomRadiusOffset: randomRadiusOffset,
        });
      }
    },

    getViewportAtDepth: function (camera, depth) {
      const fovInRadians = (camera.fov * Math.PI) / 180;
      const height = 2 * Math.tan(fovInRadians / 2) * depth;
      const width = height * camera.aspect;
      return { width: width, height: height };
    },

    setupScene: function () {
      const container = this.$refs.containerRef;
      if (!container) return;

      const { clientWidth, clientHeight } = container;

      // Create renderer
      this.renderer = new window.THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      this.renderer.setSize(clientWidth, clientHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(this.renderer.domElement);

      // Create scene
      this.scene = new window.THREE.Scene();

      // Create camera
      this.camera = new window.THREE.PerspectiveCamera(
        35,
        clientWidth / clientHeight,
        0.1,
        1000
      );
      this.camera.position.z = 50;

      // Get viewport dimensions at camera depth
      const viewport = this.getViewportAtDepth(
        this.camera,
        this.camera.position.z
      );

      // Initialize particles
      this.initParticles(viewport.width, viewport.height);

      // Create instanced mesh
      const geometry = this.createGeometry(this.particleShape);
      const material = new window.THREE.MeshBasicMaterial({
        color: this.color,
      });
      this.mesh = new window.THREE.InstancedMesh(
        geometry,
        material,
        this.count
      );
      this.scene.add(this.mesh);

      // Initialize helpers
      this.dummy = new window.THREE.Object3D();
      this.clock = new window.THREE.Clock();

      // Event listeners
      container.addEventListener("pointermove", this.boundOnPointerMove);
      window.addEventListener("resize", this.boundOnResize);

      // Start animation
      this.animate();
    },

    onPointerMove: function (event) {
      const container = this.$refs.containerRef;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    },

    onResize: function () {
      const container = this.$refs.containerRef;
      if (!container || !this.renderer || !this.camera) return;

      const { clientWidth, clientHeight } = container;
      this.camera.aspect = clientWidth / clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(clientWidth, clientHeight);
    },

    animate: function () {
      var self = this;
      this.animationFrameId = requestAnimationFrame(function () {
        self.animate();
      });

      if (!this.mesh || !this.camera || !this.renderer || !this.scene) return;

      const viewport = this.getViewportAtDepth(
        this.camera,
        this.camera.position.z
      );
      const elapsedTime = this.clock.getElapsedTime();

      // Mouse movement detection
      const mouseDist = Math.sqrt(
        Math.pow(this.pointer.x - this.lastMousePos.x, 2) +
          Math.pow(this.pointer.y - this.lastMousePos.y, 2)
      );

      if (mouseDist > 0.001) {
        this.lastMouseMoveTime = Date.now();
        this.lastMousePos = { x: this.pointer.x, y: this.pointer.y };
      }

      // Calculate destination
      let destX = (this.pointer.x * viewport.width) / 2;
      let destY = (this.pointer.y * viewport.height) / 2;

      // Auto animate when idle
      if (this.autoAnimate && Date.now() - this.lastMouseMoveTime > 2000) {
        destX = Math.sin(elapsedTime * 0.5) * (viewport.width / 4);
        destY = Math.cos(elapsedTime * 0.5 * 2) * (viewport.height / 4);
      }

      // Smooth mouse movement
      const smoothFactor = 0.05;
      this.virtualMouse.x += (destX - this.virtualMouse.x) * smoothFactor;
      this.virtualMouse.y += (destY - this.virtualMouse.y) * smoothFactor;

      const targetX = this.virtualMouse.x;
      const targetY = this.virtualMouse.y;

      const globalRotation = elapsedTime * this.rotationSpeed;

      // Update particles
      this.particles.forEach((particle, i) => {
        let { t, speed, mx, my, mz, cz, randomRadiusOffset } = particle;

        t = particle.t += speed / 2;

        const projectionFactor = 1 - cz / 50;
        const projectedTargetX = targetX * projectionFactor;
        const projectedTargetY = targetY * projectionFactor;

        const dx = mx - projectedTargetX;
        const dy = my - projectedTargetY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetPos = { x: mx, y: my, z: mz * this.depthFactor };

        if (dist < this.magnetRadius) {
          const angle = Math.atan2(dy, dx) + globalRotation;

          const wave =
            Math.sin(t * this.waveSpeed + angle) * (0.5 * this.waveAmplitude);
          const deviation =
            randomRadiusOffset * (5 / (this.fieldStrength + 0.1));

          const currentRingRadius = this.ringRadius + wave + deviation;

          targetPos.x = projectedTargetX + currentRingRadius * Math.cos(angle);
          targetPos.y = projectedTargetY + currentRingRadius * Math.sin(angle);
          targetPos.z =
            mz * this.depthFactor +
            Math.sin(t) * (1 * this.waveAmplitude * this.depthFactor);
        }

        particle.cx += (targetPos.x - particle.cx) * this.lerpSpeed;
        particle.cy += (targetPos.y - particle.cy) * this.lerpSpeed;
        particle.cz += (targetPos.z - particle.cz) * this.lerpSpeed;

        this.dummy.position.set(particle.cx, particle.cy, particle.cz);

        this.dummy.lookAt(projectedTargetX, projectedTargetY, particle.cz);
        this.dummy.rotateX(Math.PI / 2);

        const currentDistToMouse = Math.sqrt(
          Math.pow(particle.cx - projectedTargetX, 2) +
            Math.pow(particle.cy - projectedTargetY, 2)
        );

        const distFromRing = Math.abs(currentDistToMouse - this.ringRadius);
        let scaleFactor = 1 - distFromRing / 10;

        scaleFactor = Math.max(0, Math.min(1, scaleFactor));

        const finalScale =
          scaleFactor *
          (0.8 + Math.sin(t * this.pulseSpeed) * 0.2 * this.particleVariance) *
          this.particleSize;
        this.dummy.scale.set(finalScale, finalScale, finalScale);

        this.dummy.updateMatrix();

        this.mesh.setMatrixAt(i, this.dummy.matrix);
      });

      this.mesh.instanceMatrix.needsUpdate = true;

      this.renderer.render(this.scene, this.camera);
    },

    cleanup: function () {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }

      const container = this.$refs.containerRef;
      if (container) {
        container.removeEventListener("pointermove", this.boundOnPointerMove);
      }
      window.removeEventListener("resize", this.boundOnResize);

      if (this.mesh) {
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
      }

      if (this.renderer) {
        this.renderer.dispose();
        if (container && this.renderer.domElement.parentNode === container) {
          container.removeChild(this.renderer.domElement);
        }
      }

      this.renderer = null;
      this.scene = null;
      this.camera = null;
      this.mesh = null;
    },

    restartScene: function () {
      this.cleanup();
      this.setupScene();
    },
  },
};
</script>

<style scoped>
.antigravity {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
