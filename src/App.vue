<script lang="ts" setup>
import { ref } from 'vue';
import Monaco from '@vue/repl/monaco-editor';
import { Repl, OutputModes } from '@vue/repl';
import Header from './components/header.vue';
import { useReplStore } from './composables';

const handleKeydown = (evt: KeyboardEvent) => {
    if ((evt.ctrlKey || evt.metaKey) && evt.code === 'KeyS') {
        evt.preventDefault();
        return;
    }
};

const query = new URLSearchParams(location.search);

const store = useReplStore({
    showOutput: ref(query.has('showOutput')),
    outputMode: ref((query.get('outputMode') as OutputModes) || 'preview'),
});
console.log(store);
</script>

<template>
    <Header :store="store"></Header>
    <Repl
        :store="store"
        show-compile-output
        auto-resize
        :clear-console="false"
        :editor="Monaco"
        theme="light"
        @keydown="handleKeydown"
    ></Repl>
</template>

<style lang="less" scoped></style>
