#import <Cocoa/Cocoa.h>
#include <napi.h>

// Disable process switching (Cmd+Tab) and other escape mechanisms
Napi::Value DisableProcessSwitching(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    dispatch_async(dispatch_get_main_queue(), ^{
        NSApplicationPresentationOptions options =
            NSApplicationPresentationFullScreen |
            NSApplicationPresentationHideDock |
            NSApplicationPresentationHideMenuBar |
            NSApplicationPresentationDisableProcessSwitching |
            NSApplicationPresentationDisableForceQuit |
            NSApplicationPresentationDisableSessionTermination |
            NSApplicationPresentationDisableHideApplication |
            NSApplicationPresentationDisableMenuBarTransparency;

        @try {
            [[NSApplication sharedApplication] setPresentationOptions:options];
            NSLog(@"Presentation options set successfully: %lu", (unsigned long)options);
        } @catch (NSException *exception) {
            NSLog(@"Failed to set presentation options: %@", exception);
        }
    });

    return Napi::Boolean::New(env, true);
}

// Re-enable everything
Napi::Value EnableProcessSwitching(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    dispatch_async(dispatch_get_main_queue(), ^{
        @try {
            [[NSApplication sharedApplication] setPresentationOptions:NSApplicationPresentationDefault];
            NSLog(@"Presentation options reset to default");
        } @catch (NSException *exception) {
            NSLog(@"Failed to reset presentation options: %@", exception);
        }
    });

    return Napi::Boolean::New(env, true);
}

// Get current presentation options
Napi::Value GetPresentationOptions(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    NSApplicationPresentationOptions options = [[NSApplication sharedApplication] presentationOptions];
    return Napi::Number::New(env, (uint32_t)options);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "disableProcessSwitching"),
                Napi::Function::New(env, DisableProcessSwitching));
    exports.Set(Napi::String::New(env, "enableProcessSwitching"),
                Napi::Function::New(env, EnableProcessSwitching));
    exports.Set(Napi::String::New(env, "getPresentationOptions"),
                Napi::Function::New(env, GetPresentationOptions));
    return exports;
}

NODE_API_MODULE(presentation_options, Init)
