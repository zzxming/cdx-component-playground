import { ref, reactive, watch, computed, watchEffect } from 'vue';
import { useStore, useVueImportMap, File, compileFile } from '@vue/repl';
import type { ReplStore, StoreState } from '@vue/repl';
import { atou, getCdnUrl, utoa } from '../utils';
import setupCode from '../template/setup.js?raw';
import mainCode from '../template/main.vue?raw';
import welcomeSFCCode from '../template/welcome.vue?raw';
import newSFCCode from '../template/newFile.vue?raw';
import tsConfigCode from '../template/tsconfig.json?raw';

interface ReplOptions extends Partial<StoreState> {
    versions?: Record<string, string>;
}
export type MyReplStore = ReplStore & { versions: Record<string, string> };

const IMPORTMAP = 'import-map.json'
const TSCONFIG = 'tsconfig.json';
const setupFile = 'src/setup.js';
const mainFile = 'src/main.vue';
const appFile = 'src/App.vue';

export const useReplStore = (options: ReplOptions): MyReplStore => {
    options = {
        versions: {
            'cdx-component': 'latest',
            'vue': '3.3.11',
            'typescript': 'latest',
        },
        ...options,
    };
console.log()
    const versions = reactive({ ...options.versions });
    const { importMap, productionMode } = useVueImportMap({
        vueVersion: versions.vue,
    });

    productionMode.value = true;

    const files = ref<Record<string, File>>({
        [TSCONFIG]: new File(TSCONFIG, tsConfigCode, true),
        [appFile]: new File(appFile, welcomeSFCCode, false),
        [setupFile]: new File(setupFile, setupCode, true),
        [mainFile]: new File(mainFile, mainCode, true),
    });
    const builtinImportMap = computed(() => ({
        imports: {
            ...importMap.value.imports,
            'cdx-component': getCdnUrl('cdx-component', 'index.esm.js', versions['cdx-component']),
        },
        scopes: {
            ...importMap.value.scopes,
        },
    }));

    const store = useStore(
        {
            showOutput: ref(true),
            outputMode: ref('preview'),
            builtinImportMap,
            vueVersion: computed(() => versions.vue),
            typescriptVersion: computed(() => versions.typescript),
            files,
            template: ref({
                welcomeSFC: welcomeSFCCode,
                newSFC: newSFCCode,
            }),
            // mainFile: ref(mainFile),
            // activeFilename: ref(appFile),
            ...options,
        },
    ) as MyReplStore;
    store.versions = versions;

    watch(
        () => versions['cdx-component'],
        () => {
            files.value[setupFile] = new File(
                setupFile,
                setupCode.replace('$STYLE', getCdnUrl('cdx-component', 'theme/index.css', versions['cdx-component'])),
                true
            );

            compileFile(store, files.value[setupFile]);
        },
        { immediate: true, deep: true }
    );

    const wrapFilename = (name: string) => {
        if (name === IMPORTMAP || name === TSCONFIG || name.startsWith('src/')) {
          return name
        }
        return `src/${name}`
    }
    
    const serialize = () => {
        const storeFiles = files.value;
        const dataFiles: Record<string, string> = {};
        for (const [name, value] of Object.entries(storeFiles)) {
            dataFiles[wrapFilename(name)] = value.code;
        }
        return '#' + utoa(JSON.stringify({
            ...dataFiles,
            __versions: versions
        }))
    }
    const deserialize = (serializedState: string) => {
        if (serializedState.startsWith('#')){
            serializedState = serializedState.slice(1)
        }
        let saved: Record<string, any>
        try {
            saved = JSON.parse(atou(serializedState))
        } catch (err) {
            console.error(err)
            alert('Failed to load code from URL.')
            return
        }
        if (saved.__versions) {
            for (const [name, version] of Object.entries(saved.__versions)) {
                versions[name] = version as string
            }
            delete saved.__versions
        }

        for (const [name, code] of Object.entries(saved)) {
            files.value[wrapFilename(name)] = new File(name, code)
        }    
        files.value[mainFile].hidden = true;
        files.value[setupFile].hidden = true;
        for (const file of Object.values(files.value)) {
            compileFile(store, file);
        }
    
        store.mainFile = mainFile;
        store.setActive(appFile);
    }

    store.serialize = serialize;
    store.deserialize = deserialize;

    deserialize(location.hash)
    watchEffect(() =>  history.replaceState({}, '', serialize()));

    return store;
};
