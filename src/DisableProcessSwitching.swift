import Cocoa

// This helper enables/disables process switching (Cmd+Tab)
// Usage: DisableProcessSwitching enable|disable

let args = CommandLine.arguments

if args.count < 2 {
    print("Usage: DisableProcessSwitching enable|disable")
    exit(1)
}

let action = args[1]

if action == "disable" {
    // Disable process switching, hide dock and menu bar
    NSApplication.shared.presentationOptions = [
        .hideDock,
        .hideMenuBar,
        .disableProcessSwitching,
        .disableForceQuit,
        .disableSessionTermination,
        .disableHideApplication
    ]
    print("Process switching disabled")

    // Keep running to maintain the presentation options
    RunLoop.main.run()
} else if action == "enable" {
    // Re-enable everything
    NSApplication.shared.presentationOptions = []
    print("Process switching enabled")
} else {
    print("Unknown action: \(action)")
    exit(1)
}
