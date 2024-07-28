<script lang="ts" setup>
import { onMounted, reactive } from 'vue';
import { getVueVersions, getTSVersions, getCdxComponentVersions } from '../utils';
import { MyReplStore } from '../composables';

const props = defineProps<{
    store: MyReplStore;
}>();

const depVersions = reactive<Record<string, { active: string; text: string; versions: string[] }>>({
    vue: {
        active: props.store.versions['vue'],
        text: 'Vue',
        versions: [],
    },
    typescript: {
        active: props.store.versions['typescript'],
        text: 'TypeScript',
        versions: [],
    },
    'cdx-component': {
        active: props.store.versions['cdx-component'],
        text: 'Cdx Component',
        versions: [],
    },
});

const filterVersions = (versions: string[]) => {
    return versions.filter((r) => !r.includes('-'));
};
onMounted(() => {
    getCdxComponentVersions().then((versions) => {
        depVersions['cdx-component'].versions = versions;
    });
    getTSVersions().then((versions) => {
        depVersions.typescript.versions = filterVersions(versions);
    });
    getVueVersions().then((versions) => {
        depVersions.vue.versions = filterVersions(versions);
    });
});
const handleChangeVersion = (pkg: string, e: Event) => {
    const select = e.target as HTMLSelectElement;
    if (!select) return;
    const version = select.options[select.selectedIndex].value;
    depVersions[pkg].active = version;
    props.store.versions[pkg] = version;
    
    history.replaceState({}, '', props.store.serialize())
};
</script>

<template>
    <div class="header">
        <div class="header_right">
            <div class="header_version">
                <div
                    class="header_version__item"
                    v-for="(dep, pkg) in depVersions"
                >
                    <span>{{ dep.text }}</span>
                    <select
                        class="header_version__select"
                        @change="(e) => handleChangeVersion(pkg, e)"
                    >
                        <option
                            v-for="v in dep.versions"
                            :value="v"
                            :selected="dep.active === v"
                        >
                            {{ v }}
                        </option>
                    </select>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="less" scoped>
.header {
    position: relative;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    width: 100%;
    height: 54px;
    padding: 10px 16px;
    box-shadow: 0 0 4px #0000004d;
    z-index: 10;
    overflow-x: auto;
    overflow-y: hidden;
    &::-webkit-scrollbar {
        width: 6px;
        height: 4px;
        &-thumb {
            background: #ccc;
        }
        &-thumb:hover {
            background: #bbb;
        }
    }
    &_right {
        display: flex;
        align-items: center;
        margin-left: auto;
    }
    &_version {
        display: flex;
        align-items: center;
        height: 30px;
        &__item {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            margin-left: 16px;
            &:first-child {
                margin-left: 0;
            }

        }
        &__select {
            width: 120px;
            margin: 0 8px;
        }
    }
}
</style>
