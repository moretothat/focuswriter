const path = require('path');

let nativeAddon = null;

try {
  // Try to load the compiled native addon
  nativeAddon = require('./build/Release/presentation_options.node');
} catch (err) {
  console.warn('Native presentation options addon not available:', err.message);
  console.warn('Cmd+Tab blocking will be limited.');
}

module.exports = {
  disableProcessSwitching: function() {
    if (nativeAddon) {
      return nativeAddon.disableProcessSwitching();
    }
    console.warn('Native addon not loaded - cannot disable process switching');
    return false;
  },

  enableProcessSwitching: function() {
    if (nativeAddon) {
      return nativeAddon.enableProcessSwitching();
    }
    console.warn('Native addon not loaded - cannot enable process switching');
    return false;
  },

  getPresentationOptions: function() {
    if (nativeAddon) {
      return nativeAddon.getPresentationOptions();
    }
    return 0;
  },

  isAvailable: function() {
    return nativeAddon !== null;
  }
};
