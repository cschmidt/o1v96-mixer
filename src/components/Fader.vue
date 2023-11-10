// Based on https://codepen.io/lzl124631x/pen/wvGBwKV
<style scoped>
* {
  margin: 0;
  padding: 0;
}

.slider {
  padding: 0.5em 0;
  width: 4em;
  border-radius: 0.25em;
  border-left: solid 1px #8888AA;
}
.slider-value {
  text-align: center;
  width: 100%;
  margin-bottom: 1em;
  font-family: sans-serif;
  color: white;
}
.slider-label {
  color: white;
  text-align: center;
  width: 100%;
  margin-top: 3em;
}
.slider-hit-area {
  height: 20em;
  width: 100%;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.slider-container {
  width: 3px;
  height: 100%;
  background-color: black;
  position: relative;
  .filled {
    background-color: rgb(59, 157, 72);
    width: 100%;
    position: absolute;
    bottom: 0;
    left: 0;
  }
  .handle {
    width: 2em;
    height: 4em;
    border-radius: 5%;
    background-color: red;
    background-image: var(--image-url);
    position: absolute;
    left: 50%;
    transform: translate(-50%, 50%);
  }
}
</style>
<!-- Use preprocessors via the lang attribute! e.g. <template lang="pug"> -->
<template>
  <div class="slider">
    <div class="slider-value">{{ Math.round(value) }}</div>
    <div class="slider-hit-area" @click="onClick">
      <div class="slider-container" ref="container">
        <div class="filled" :style="{ height: value + '%' }"></div>
        <div
          class="handle"
          :style="{ bottom: value + '%', '--image-url': 'url(' + imageUrl + ')' }"
          @mousedown="onMouseDown"
        ></div>
      </div>
    </div>
    <div class="slider-label">{{ label }}</div>
  </div>
</template>

<script>
import mixerKnobImage from '../assets/mixer-knob.jpg';

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
export default {
  data() {
    return {
      value: 30,
      dragging: false,
      imageUrl: mixerKnobImage
    };
  },
  props: {
    label: String,
    channel: Number | String
  },
  mounted() {
    document.addEventListener("mousemove", (e) => {
      if (!this.dragging) return;
      this.update(e);
    });
    document.addEventListener("mouseup", (e) => {
      this.dragging = false;
    });
  },
  methods: {
    onMouseDown() {
      this.dragging = true;
    },
    getRect() {
      const container = this.$refs.container;
      return container.getBoundingClientRect();
    },
    update(e) {
      const rect = this.getRect();
      this.value =
        100 -
        ((clamp(e.clientY, rect.top, rect.bottom) - rect.top) / rect.height) *
          100;
      let event = {channel: this.channel, value: this.value};
      this.$emit('update', event);
    },
    onClick(e) {
      this.update(e);
    }
  }
};
</script>
