<template>
    <div
      :class="['circular-text-container', className]"
      @mouseenter="handleHoverStart"
      @mouseleave="handleHoverEnd"
      :style="containerStyle"
    >
      <span
        v-for="(letter, i) in letters"
        :key="i"
        class="circular-letter"
        :style="getLetterStyle(i)"
      >
        {{ letter }}
      </span>
    </div>
</template>

<script>
export default {
    name: 'CircularText',
    props: {
        // 文字内容
        text: {
            type: String,
            default: ''
        },
        // 旋转一圈所需时间（秒）
        spinDuration: {
            type: Number,
            default: 20
        },
        // 鼠标悬停时的行为
        onHover: {
            type: String,
            default: 'speedUp',
            validator: function (value) {
                return ['slowDown', 'speedUp', 'pause', 'goBonkers'].indexOf(value) !== -1
            }
        },
        // 自定义CSS类名
        className: {
            type: String,
            default: ''
        },
        // 自定义文字大小
        fontSize: {
            type: Number,
            default: 24
        },
        // 自定义容器大小
        containerSize: {
            type: Number,
            default: 200
        },
    },
    data: function () {
        return {
            isHovered: false,
            currentRotation: 0,
            animationId: null,
            lastTime: Date.now(),
            rotationSpeed: 0,
        }
    },
    computed: {
        // 将文字拆分为字符数组
        letters: function () {
            return Array.from(this.text)
        },
        // 容器样式
        containerStyle: function () {
            var scale = this.getCurrentScale()
            return {
                width: this.containerSize + 'px',
                height: this.containerSize + 'px',
                position: 'relative',
                borderRadius: '50%',
                fontWeight: '900',
                color: 'white',
                textAlign: 'center',
                cursor: 'pointer',
                transformOrigin: 'center',
                transform: 'rotate(' + this.currentRotation + 'deg) scale(' + scale + ')',
                transition: 'transform 0.3s ease'
            }
        }
    },
    mounted: function () {
        this.startAnimation()
    },
    beforeDestroy: function () {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId)
        }
    },
    watch: {
        // 监听spinDuration变化
        spinDuration: function () {
            this.startAnimation()
        },
        // 监听onHover变化
        onHover: function () {
            this.startAnimation()
        }
    },
    methods: {
        // 获取当前旋转速度
        getCurrentSpeed: function () {
            if (this.isHovered && this.onHover === 'pause') return 0

            var baseDuration = this.spinDuration
            var baseSpeed = 360 / baseDuration

            if (!this.isHovered) return baseSpeed

            switch (this.onHover) {
                case 'slowDown':
                    return baseSpeed / 2
                case 'speedUp':
                    return baseSpeed * 4
                case 'goBonkers':
                    return baseSpeed * 20
                default:
                    return baseSpeed
            }
        },
        // 获取当前缩放比例
        getCurrentScale: function () {
            return this.isHovered && this.onHover === 'goBonkers' ? 0.8 : 1
        },
        // 动画循环
        animate: function () {
            var now = Date.now()
            var deltaTime = (now - this.lastTime) / 1000
            this.lastTime = now

            var targetSpeed = this.getCurrentSpeed()

            var speedDiff = targetSpeed - this.rotationSpeed
            var smoothingFactor = Math.min(1, deltaTime * 5)
            this.rotationSpeed += speedDiff * smoothingFactor

            this.currentRotation = (this.currentRotation + this.rotationSpeed * deltaTime) % 360

            var self = this
            this.animationId = requestAnimationFrame(function () {
                self.animate()
            })
        },
        // 开始动画
        startAnimation: function () {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId)
            }
            this.lastTime = Date.now()
            this.rotationSpeed = this.getCurrentSpeed()
            this.animate()
        },
        // 鼠标悬停开始
        handleHoverStart: function () {
            this.isHovered = true
        },
        // 鼠标悬停结束
        handleHoverEnd: function () {
            this.isHovered = false
        },
        // 获取字母样式
        getLetterStyle: function (index) {
            var rotationDeg = (360 / this.letters.length) * index
            var factor = Math.PI / this.letters.length
            var x = factor * index
            var y = factor * index

            // 计算字母在圆环上的位置
            var radius = this.containerSize / 2
            var angle = (rotationDeg * Math.PI) / 180
            var posX = radius + radius * Math.cos(angle - Math.PI / 2)
            var posY = radius + radius * Math.sin(angle - Math.PI / 2)

            return {
                position: 'absolute',
                display: 'inline-block',
                left: posX + 'px',
                top: posY + 'px',
                fontSize: this.fontSize + 'px',
                transform: 'translate(-50%, -50%) rotateZ(' + rotationDeg + 'deg)',
                WebkitTransform: 'translate(-50%, -50%) rotateZ(' + rotationDeg + 'deg)',
                transition: 'all 0.5s cubic-bezier(0,0,0,1)'
            }
        }
    }
}
</script>

<style scoped></style>