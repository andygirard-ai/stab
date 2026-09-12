export default [
  {
    files: ['app_under_test.js'],
    languageOptions: {
      ecmaVersion: 2017,
      sourceType: 'script',
      globals: {
        window:'readonly', document:'readonly', navigator:'readonly',
        localStorage:'readonly', location:'readonly', setInterval:'readonly',
        setTimeout:'readonly', clearTimeout:'readonly', clearInterval:'readonly',
        console:'readonly', confirm:'readonly', prompt:'readonly', alert:'readonly',
        Blob:'readonly', URL:'readonly', FileReader:'readonly', Audio:'readonly',
        AudioContext:'readonly', webkitAudioContext:'readonly',
        SpeechSynthesisUtterance:'readonly', speechSynthesis:'readonly',
        MediaRecorder:'readonly', Uint8Array:'readonly', DataView:'readonly',
        TextDecoder:'readonly', requestAnimationFrame:'readonly', File:'readonly',
        fetch:'readonly'
      }
    },
    rules: { 'no-undef':'error', 'no-unreachable':'error', 'no-redeclare':'error', 'no-dupe-keys':'error' }
  }
];
