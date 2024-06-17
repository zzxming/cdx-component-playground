<script setup>
import { ref, watch } from 'vue';
import App from './App.vue';
import { setupCdxComponent } from './setup.js';
setupCdxComponent();

const rootCls = document.documentElement.classList;
const className = 'dark';
const isDark = ref(rootCls.contains(className));

watch(isDark, (value) => {
    rootCls[value ? 'add' : 'remove'](className);
});
</script>

<template>
    <div>
        <App />
        <div class="theme">
            <span>深色模式</span>
            <input
                type="checkbox"
                v-model="isDark"
            />
        </div>
    </div>
</template>

<style scoped>
.theme {
    position: fixed;
    bottom: 8px;
    right: 8px;
}
</style>
