// electron-builder.config.js
// Configurazione ottimizzata per dimensione minima

module.exports = {
  appId: "com.bradlystronghold.client",
  productName: "BradlyStronghold",
  copyright: "Copyright 2026 strangers11",

  directories: {
    output: "dist",
    buildResources: "build",
  },

  // SOLO i file indispensabili
  files: [
    "main.js",
    "preload.js",
    "index.html",
    "package.json",
    "dist/**/*",
    "!**/*.map",
    "!**/*.md",
    "!**/LICENSE*",
    "!**/CHANGELOG*",
    "!**/.github/**",
    "!**/test/**",
    "!**/tests/**",
    "!**/__tests__/**",
    "!**/example/**",
    "!**/examples/**",
    "!**/docs/**",
    "!**/doc/**",
    "!**/.vscode/**",
    "!**/.idea/**",
  ],

  // Nessuna ricostruzione di moduli nativi
  npmRebuild: false,
  nodeGypRebuild: false,
  buildDependenciesFromSource: false,

  // Compressione massima (lenta ma file più piccolo)
  compression: "maximum",

  // Nessun file di debug
  asar: true,
  asarUnpack: [],

  // Solo Windows x64
  win: {
    target: [
      {
        target: "nsis",
        arch: ["x64"],
      },
    ],
    // Non firmare digitalmente (evita download di tool)
    signAndEditExecutable: false,
    // Rimuovi debug symbols
    requestedExecutionLevel: "asInvoker",
  },

  // Configurazione NSIS ottimizzata
  nsis: {
    oneClick: true,                    // Installa in 1 clic
    perMachine: false,                 // Solo per utente
    allowToChangeInstallationDirectory: false,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "BradlyStronghold",
    compression: "maximum",
    // Non includere installazione silenziosa
    installerLanguages: ["it_IT"],
    // Rimuovi residui
    deleteAppDataOnUninstall: false,
    // Non creare uninstaller pesante
    differentialPackage: false,
  },

  // Non creare altri target
  mac: null,
  linux: null,

  // Non includere sorgenti
  extraMetadata: {
    main: "main.js",
  },
};