Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://gre/modules/AddonManager.jsm"); 
Components.utils.import("resource://gre/modules/ctypes.jsm");

var winapi = {
	user32: ctypes.open("user32.dll"),
	shell32: ctypes.open("shell32.dll"),
	kernel32: ctypes.open("kernel32.dll"),

	//NOTIFICATIONDATA.uFlags :
	NIF_MESSAGE: 0x00000001, // in order to get events (clicks,moves,...)
	NIF_ICON: 0x00000002, // in order to consider hIcon
	NIF_TIP: 0x00000004, // in order to display szTip on mouseover

	//Shell_NotifyIcon.dwMessage :
	NIM_ADD: 0x00000000,
	NIM_DELETE: 0x00000002,

	IMAGE_ICON: 1,
	LR_LOADFROMFILE: 16,

	WS_CAPTION: 0x00C00000,
	HWND_MESSAGE: -3,

	WM_LBUTTONDOWN: 513,
	WM_USER: 1024,
	
	WNDCLASS: ctypes.StructType("WNDCLASS", [
	    { style  : ctypes.uint32_t },
	    { lpfnWndProc  : ctypes.voidptr_t },
	    { cbClsExtra  : ctypes.int32_t },
	    { cbWndExtra  : ctypes.int32_t },
	    { hInstance  : ctypes.voidptr_t },
	    { hIcon  : ctypes.voidptr_t },
	    { hCursor  : ctypes.voidptr_t },
	    { hbrBackground  : ctypes.voidptr_t },
	    { lpszMenuName  : ctypes.char.ptr },
	    { lpszClassName  : ctypes.char.ptr }
	]),
	
	NOTIFICATIONDATA: ctypes.StructType("NOTIFICATIONDATA",
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
	),
	
	WindowProc: ctypes.FunctionType(ctypes.stdcall_abi, ctypes.int, [
	    ctypes.voidptr_t, 
	    ctypes.int32_t, 
	    ctypes.int32_t, 
	    ctypes.int32_t
	]).ptr
};

winapi.RegisterClass = winapi.user32.declare( "RegisterClassA", 
	ctypes.winapi_abi, 
	ctypes.voidptr_t,
	winapi.WNDCLASS.ptr
);

winapi.DefWindowProc = winapi.user32.declare("DefWindowProcA", ctypes.winapi_abi, ctypes.int,
    ctypes.voidptr_t, ctypes.int32_t, ctypes.int32_t, ctypes.int32_t
);

winapi.CreateWindowEx = winapi.user32.declare( "CreateWindowExA", 
    ctypes.winapi_abi, ctypes.voidptr_t,
	ctypes.long,
	ctypes.char.ptr,
	ctypes.char.ptr,
	ctypes.int,
    ctypes.int,
    ctypes.int,
    ctypes.int,
    ctypes.int,
    ctypes.voidptr_t,
    ctypes.voidptr_t,
    ctypes.voidptr_t,
    ctypes.voidptr_t
);

winapi.LoadImage = winapi.user32.declare("LoadImageA", ctypes.winapi_abi, ctypes.voidptr_t,
    ctypes.int,
    ctypes.char.ptr,
    ctypes.int,
    ctypes.int,
    ctypes.int,
    ctypes.int
);

winapi.Shell_NotifyIcon = winapi.shell32.declare("Shell_NotifyIcon", ctypes.winapi_abi, ctypes.bool,
    ctypes.int,
    winapi.NOTIFICATIONDATA.ptr
);

/*
 * Create native window to show the notification icon in the system tray
 */

var hIcon;
var icon;

var windowProc = function(hWnd, uMsg, wParam, lParam) {
	if (uMsg != winapi.WM_USER+1) {
		return winapi.DefWindowProc(hWnd, uMsg, wParam, lParam);
	}
	
    if (lParam == winapi.WM_LBUTTONDOWN) {
    	var console = Components.classes["@mozilla.org/consoleservice;1"].
    	getService(Components.interfaces.nsIConsoleService);
    	console.logStringMessage('message: ' + lParam);
    	
    	return 0;
    }
    
    return winapi.DefWindowProc(hWnd, uMsg, wParam, lParam);
};

var wndclass = winapi.WNDCLASS();
wndclass.lpszClassName = ctypes.char.array()("class-trayicon");
wndclass.lpfnWndProc = winapi.WindowProc(windowProc);

winapi.RegisterClass(wndclass.address());

var win = winapi.CreateWindowEx(0, wndclass.lpszClassName, 
    ctypes.char.array()("trayicon-window"), 
	0, 0, 0, 0, 0, 
	ctypes.voidptr_t(-3), null, null, null
);

this.wndclass = wndclass;

var NotificationIconWindow = {
	
	getIcon : function(callback) {
		if (this.icon == null) {
			var id = "notificationiconservice@eigenco.de";
			AddonManager.getAddonByID(id, function(addon) {
				var file = addon.getResourceURI('chrome/skin/newmail.ico').
					QueryInterface(Components.interfaces.nsIFileURL).file;
				
				hIcon = winapi.LoadImage(0, file.path, winapi.IMAGE_ICON, 16, 16, winapi.LR_LOADFROMFILE);
				
				icon = winapi.NOTIFICATIONDATA();
				icon.cbSize = winapi.NOTIFICATIONDATA.size;
				icon.uFlags = winapi.NIF_ICON | winapi.NIF_TIP | winapi.NIF_MESSAGE;
				icon.szTip = "";
				icon.hIcon = hIcon;
				icon.uCallbackMessage = winapi.WM_USER+1;
				icon.hWnd = win;
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

function NotificationIconService() { 	
	this.wrappedJSObject = this;
}

NotificationIconService.prototype = { 
	classDescription: "Notification icon service",
    classID:          Components.ID("{152c7910-5c0a-11e1-b86c-0800200c9a66}"),
	contractID:       "@eigenco.de/notificationiconservice;1",
	QueryInterface: XPCOMUtils.generateQI(),
	
	showNotificationIcon : function() {
		NotificationIconWindow.getIcon(function (icon) {
			winapi.Shell_NotifyIcon(winapi.NIM_ADD, icon.address());	
		});
		
	},
	
	hideNotificationIcon : function() {
		NotificationIconWindow.getIcon(function (icon) {
			winapi.Shell_NotifyIcon(winapi.NIM_DELETE, icon.address());	
		});
	}
};

var components = [NotificationIconService];
const NSGetFactory = XPCOMUtils.generateNSGetFactory(components);