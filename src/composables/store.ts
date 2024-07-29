import { computed, reactive, ref, watch, watchEffect } from 'vue';
import { File, compileFile, useStore, useVueImportMap } from '@vue/repl';
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
export interface MyReplStore extends ReplStore {
  versions: Record<string, string>;
  setVersion: (pkg: string, version: string) => void;
};

const IMPORTMAP = 'import-map.json';
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
        true,
      );

      compileFile(store, files.value[setupFile]);
    },
    { immediate: true, deep: true },
  );

  const wrapFilename = (name: string) => {
    if (name === IMPORTMAP || name === TSCONFIG || name.startsWith('src/')) {
      return name;
    }
    return `src/${name}`;
  };
  const serialize = () => {
    const storeFiles = files.value;
    const dataFiles: Record<string, string> = {};
    for (const [name, value] of Object.entries(storeFiles)) {
      dataFiles[name] = value.code;
    }
    return `#${utoa(JSON.stringify({
      ...dataFiles,
      __versions: versions,
    }))}`;
  };
  const deserialize = (serializedState: string) => {
    if (serializedState.startsWith('#')) {
      serializedState = serializedState.slice(1);
    }
    let saved: Record<string, any>;
    try {
      saved = JSON.parse(atou(serializedState));
    }
    catch (error) {
      console.error(error);
      return;
    }
    if (saved.__versions) {
      for (const [name, version] of Object.entries(saved.__versions)) {
        versions[name] = version as string;
      }
      delete saved.__versions;
    }

    for (const [name, code] of Object.entries(saved)) {
      const filename = wrapFilename(name);
      files.value[filename] = new File(filename, code);
    }
    files.value[mainFile].hidden = true;
    files.value[setupFile].hidden = true;
    for (const file of Object.values(files.value)) {
      compileFile(store, file);
    }
    store.mainFile = mainFile;
    store.setActive(appFile);
  };
  const setVersion = (pkg: string, version: string) => {
    store.versions[pkg] = version;
  };

  store.serialize = serialize;
  store.deserialize = deserialize;
  store.setVersion = setVersion;

  deserialize(location.hash);
  watchEffect(() => history.replaceState({}, '', serialize()));

  return store;
};
