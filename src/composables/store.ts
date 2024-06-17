import { ref, reactive, watch, computed, watchEffect } from 'vue';
import { useStore, useVueImportMap, File, compileFile } from '@vue/repl';
import type { ReplStore, StoreState } from '@vue/repl';
import { getCdnUrl } from '../utils';
import setupCode from '../template/setup.js?raw';
import mainCode from '../template/main.vue?raw';
import welcomeSFCCode from '../template/welcome.vue?raw';
import newSFCCode from '../template/newFile.vue?raw';
import tsConfigCode from '../template/tsconfig.json?raw';

interface ReplOptions extends Partial<StoreState> {
    versions?: Record<string, string>;
}
export type MyReplStore = ReplStore & { versions: Record<string, string> };

const TSCONFIG = 'tsconfig.json';
const setupFile = 'src/setup.js';
const mainFile = 'src/main.vue';
const appFile = 'src/App.vue';

export const useReplStore = (options: ReplOptions): MyReplStore => {
    options = {
        versions: {
            vue: '3.3.11',
            'cdx-component': 'latest',
            typescript: 'latest',
        },
        ...options,
    };

    const versions = reactive({ ...options.versions });
    const { importMap, productionMode } = useVueImportMap({
        vueVersion: versions.vue || '3.3.11',
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
            'cdx-component': getCdnUrl('cdx-component', 'index.esm.js'),
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
        location.hash
    ) as MyReplStore;
    store.versions = versions;
    // 在 option 中设置会导致 files 里的 compiler 是空而无法解析到 iframe 中
    for (const file of Object.values(files.value)) {
        compileFile(store, file);
    }
    files.value[mainFile].hidden = true;
    files.value[setupFile].hidden = true;

    store.mainFile = mainFile;
    store.setActive(appFile);

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

    watchEffect(() => history.replaceState({}, '', store.serialize()));

    return store;
};
