Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://gre/modules/AddonManager.jsm"); 
Components.utils.import("resource://gre/modules/ctypes.jsm");


function NotificationIconService() {    
    this.wrappedJSObject = this;
}

var WindowProcType, DefWindowProc, RegisterClass, CreateWindowEx, 
    DestroyWindow, SHGetSpecialFolderLocation, WNDCLASS, wndclass, 
    messageWin, libs = {};

var windowProcJSCallback = function(hWnd, uMsg, wParam, lParam) {
    var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                     .getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage("wndproc " + uMsg + " - " + wParam + " - " + lParam);
    
    
    
    
    return DefWindowProc(hWnd, uMsg, wParam, lParam);
};

NOTIFICATIONDATA = ctypes.StructType("NOTIFICATIONDATA",
        [{ cbSize  : ctypes.int          },
         { hWnd    : ctypes.voidptr_t    },
         { uID     : ctypes.int          },
         { uFlags  : ctypes.int          },
         { uCallbackMessage : ctypes.int },
         { hIcon        : ctypes.voidptr_t     },
         { szTip        : ctypes.char.array(64) },
         { dwState      : ctypes.int     },
         { dwStateMask  : ctypes.int     },
         { szInfo       : ctypes.char.array(256) },
         { uTimeoutOrVersion : ctypes.int },
         { szInfoTitle  : ctypes.char.array(64) },
         { dwInfoFlags  : ctypes.int },
         { guidItem     : ctypes.int },
         { hBalloonIcon : ctypes.int }
        ]
    );

var NotificationIconWindow = {
    
    getIcon : function(callback) {
        if (this.icon == null) {
            var id = "notificationiconservice@eigenco.de";
            AddonManager.getAddonByID(id, function(addon) {
                var file = addon.getResourceURI('chrome/skin/newmail.ico').
                    QueryInterface(Components.interfaces.nsIFileURL).file;
        
                libs.user32 = ctypes.open("user32.dll");
                LoadImage = libs.user32.declare("LoadImageA", ctypes.winapi_abi, ctypes.voidptr_t,
                    ctypes.int,
                    ctypes.char.ptr,
                    ctypes.int,
                    ctypes.int,
                    ctypes.int,
                    ctypes.int
                );
                hIcon = LoadImage(0, file.path, 1, 16, 16, 16);
                
                icon = NOTIFICATIONDATA();
                icon.cbSize = NOTIFICATIONDATA.size;
                icon.uFlags = 7;
                icon.szTip = "";
                icon.hIcon = hIcon;
                icon.uCallbackMessage = 1025;
                icon.hWnd = messageWin;
                icon.uID = 1;
                
                if (callback) {
                    callback(icon);
                }
            });
        } else {
            callback(icon);
        }
    }
};


NotificationIconService.prototype = { 
    classDescription: "Notification icon service",
    classID:          Components.ID("{152c7910-5c0a-11e1-b86c-0800200c9a66}"),
    contractID:       "@eigenco.de/notificationiconservice;1",
    QueryInterface: XPCOMUtils.generateQI(),
    
    showNotificationIcon : function() {
        var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                     .getService(Components.interfaces.nsIConsoleService);
                     
        libs.user32 = ctypes.open("user32.dll");
        libs.shell32 = ctypes.open("shell32.dll");
    
        WindowProc = ctypes.FunctionType(
            ctypes.stdcall_abi, ctypes.int, 
            [ctypes.voidptr_t, ctypes.int32_t, 
             ctypes.int32_t, ctypes.int32_t]).ptr;
    
        CreateWindowEx = libs.user32.declare("CreateWindowExA", 
            ctypes.winapi_abi, ctypes.voidptr_t, ctypes.long, 
            ctypes.char.ptr, ctypes.char.ptr, ctypes.int,
            ctypes.int, ctypes.int, ctypes.int, ctypes.int, 
            ctypes.voidptr_t, ctypes.voidptr_t, ctypes.voidptr_t, 
            ctypes.voidptr_t);
            
        WNDCLASS = ctypes.StructType("WNDCLASS", [
          { style          : ctypes.uint32_t  },
          { lpfnWndProc    : WindowProc       }, 
          { cbClsExtra     : ctypes.int32_t   },
          { cbWndExtra     : ctypes.int32_t   },
          { hInstance      : ctypes.voidptr_t },
          { hIcon          : ctypes.voidptr_t },
          { hCursor        : ctypes.voidptr_t },
          { hbrBackground  : ctypes.voidptr_t },
          { lpszMenuName   : ctypes.char.ptr  },
          { lpszClassName  : ctypes.char.ptr  }
        ]);

        RegisterClass = libs.user32.declare("RegisterClassA", 
            ctypes.winapi_abi, ctypes.voidptr_t, WNDCLASS.ptr);
    
        DefWindowProc = libs.user32.declare("DefWindowProcA", 
            ctypes.winapi_abi, ctypes.int, ctypes.voidptr_t, 
            ctypes.int32_t, ctypes.int32_t, ctypes.int32_t);
    
        var cName = "class-testingmessageonlywindow";
        wndclass = WNDCLASS();
        wndclass.lpszClassName = ctypes.char.array()(cName);
        wndclass.lpfnWndProc = WindowProc(windowProcJSCallback);
    
        RegisterClass(wndclass.address());
    
        var HWND_MESSAGE = -3; // message-only window
        messageWin = CreateWindowEx(
          0, wndclass.lpszClassName,
          ctypes.char.array()("my-testing-window"),
          0, 0, 0, 0, 0, 
          ctypes.voidptr_t(HWND_MESSAGE), 
          null, null, null
        );
        
        NotificationIconWindow.getIcon(function (icon) {
            
            Shell_NotifyIcon = libs.shell32.declare("Shell_NotifyIcon", ctypes.winapi_abi, ctypes.bool,
                ctypes.int,
                NOTIFICATIONDATA.ptr
            );
            Shell_NotifyIcon(0, icon.address());    
        });
        consoleService.logStringMessage("show notification icon");
        
    },
    
    hideNotificationIcon : function() {
        var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                     .getService(Components.interfaces.nsIConsoleService);
                     
        consoleService.logStringMessage("hide notification icon");
    }
};

var components = [NotificationIconService];
const NSGetFactory = XPCOMUtils.generateNSGetFactory(components);