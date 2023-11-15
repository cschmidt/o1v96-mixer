<!-- Mixer.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import Fader from './Fader.vue';
const socket = new WebSocket(`ws://${window.location.hostname}:3000`);
const faders = ref([...Array(16)].map(() => 50));  // Middle position for demonstration
const masterLevel = ref(63);  // Master fader's initial value
const channels = [...Array(16).keys()].map(i => i + 1)

let lastSentFaderValue = {channel: "-1", level: -1}

function sendFaderValue(level : number, channel : string) {
  let message = {channel, level}
  if (message.channel == lastSentFaderValue.channel && 
      message.level == lastSentFaderValue.level) {
    // console.log('ignoring duplicate', message)
  } else {
    lastSentFaderValue = message
    console.log('sending', message)
    socket.send(JSON.stringify(message))
  }
}
</script>

<template>
  <div class="mixer">
    <div class="mixer-controls">
      <div class="layer-controls-container">
        <h2>LAYER</h2>      
        <div class="layer-controls">
          <button>1&#8209;32</button>
          <button>MASTER</button>
          <button>REMOTE</button>
        </div>
      </div>
      <div class="fader-mode-controls-container">
        <h2>FADER MODE</h2>
        <div class="fader-mode-controls">
            <button>AUX1</button>
            <button>AUX2</button>
            <button>AUX3</button>
            <button>AUX4</button>
            <button>AUX5</button>
            <button>AUX6</button>
            <button>AUX7</button>
            <button>AUX8</button>
            <button>HOME</button>
        </div>
      </div>
    </div>
    <div class="faders">
      <Fader
        v-for="channel in channels"
        v-model="faders[channel-1]"
        :key="channel"
        :label="channel.toString()"
        :channel="channel.toString()"
        @update:modelValue="sendFaderValue"
      />
      <Fader 
        v-model="masterLevel" 
        :label="'STEREO'" 
        :channel="'master'" 
        @update:modelValue="sendFaderValue" />
    </div>
  </div>
</template>

<style scoped>
.mixer-controls {
  display: inline-flex;
  margin-bottom: 1em;
}

.faders {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.layer-controls-container {
  display: block;
  margin-right: 1em;
}
.layer-controls {
  background-color: white;
  padding: 0.5em;
  display: inline-flex;
}

.layer-controls button {
  padding: 0.5em;
  margin: 0.5em;
  background-color: #5e718f;
  color: #fefefe;
}

.layer-controls h2 {
  background-color: none;
}

.fader-mode-controls-container {
  display: block;
}

.fader-mode-controls {
  background-color: black;
  padding: 0.5em;
  display: inline-flex;
}
.fader-mode-controls button {
  padding: 0.5em;
  margin: 0.5em;
  font-variant: small-caps;
  background-color: #000000;
  color: #fefefe;
}

h2 {
  font-weight: bold;
}

</style>
