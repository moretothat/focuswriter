{
  "targets": [
    {
      "target_name": "presentation_options",
      "sources": ["presentation_options.mm"],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "xcode_settings": {
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
        "CLANG_CXX_LIBRARY": "libc++",
        "MACOSX_DEPLOYMENT_TARGET": "10.15"
      },
      "link_settings": {
        "libraries": [
          "-framework Cocoa"
        ]
      },
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"]
    }
  ]
}
