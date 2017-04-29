Components.utils.import("resource://gre/modules/ctypes.jsm"); 

const libs = {};
libs.user32 = ctypes.open("user32.dll");
libs.shell32 = ctypes.open("shell32.dll");
libs.kernel32 = ctypes.open("kernel32.dll");


/*
  typedef struct tagWNDCLASS {
    UINT      style;
    WNDPROC   lpfnWndProc;
    int       cbClsExtra;
    int       cbWndExtra;
    HINSTANCE hInstance;
    HICON     hIcon;
    HCURSOR   hCursor;
    HBRUSH    hbrBackground;
    LPCTSTR   lpszMenuName;
    LPCTSTR   lpszClassName;
  } WNDCLASS, *PWNDCLASS;
*/
win32.WNDCLASS = 
  ctypes.StructType("WNDCLASS",
    [
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
    ]);

/*
  HWND WINAPI CreateWindowEx(
    __in      DWORD dwExStyle,
    __in_opt  LPCTSTR lpClassName,
    __in_opt  LPCTSTR lpWindowName,
    __in      DWORD dwStyle,
    __in      int x,
    __in      int y,
    __in      int nWidth,
    __in      int nHeight,
    __in_opt  HWND hWndParent,
    __in_opt  HMENU hMenu,
    __in_opt  HINSTANCE hInstance,
    __in_opt  LPVOID lpParam
  );
*/
win32.CreateWindowEx = 
  libs.user32.declare( "CreateWindowExA", ctypes.winapi_abi, ctypes.voidptr_t,
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
win32.WS_POPUP = 0x80000000;//ctypes.Int64("0x80000000");
win32.WS_EX_TOOLWINDOW = 128;
win32.HWND_MESSAGE = -3;

/*
  BOOL WINAPI DestroyWindow(
    __in  HWND hWnd
  );
*/
win32.DestroyWindow =
  libs.user32.declare( "DestroyWindow", ctypes.winapi_abi, ctypes.bool,
      ctypes.voidptr_t
    );

/*
  BOOL WINAPI ShowWindow(
    __in  HWND hWnd,
    __in  int nCmdShow
  );
*/
win32.ShowWindow = 
  libs.user32.declare( "ShowWindow", ctypes.winapi_abi, ctypes.bool,
      ctypes.voidptr_t,
      ctypes.int
    );
    
/*
  ATOM WINAPI RegisterClass(
    __in  const WNDCLASS *lpWndClass
  );
*/
win32.RegisterClass = 
  libs.user32.declare( "RegisterClassA", ctypes.winapi_abi, ctypes.voidptr_t,
    win32.WNDCLASS.ptr);

/*
  BOOL WINAPI UnregisterClass(
    __in      LPCTSTR lpClassName,
    __in_opt  HINSTANCE hInstance
  );
*/
win32.UnregisterClass = 
  libs.user32.declare( "UnregisterClassA", ctypes.winapi_abi, ctypes.bool,
    ctypes.char.ptr, 
    ctypes.voidptr_t);


/*
  LRESULT CALLBACK WindowProc(
    __in  HWND hwnd,
    __in  UINT uMsg,
    __in  WPARAM wParam,
    __in  LPARAM lParam
  );
*/  
win32.WindowProc = 
  ctypes.FunctionType(ctypes.stdcall_abi, ctypes.int,
    [ctypes.voidptr_t, ctypes.int32_t, ctypes.int32_t, ctypes.int32_t]).ptr;
// WindowProc.lParam
win32.WM_MOUSEFIRST = 512;
win32.WM_MOUSEMOVE = 512;
win32.WM_LBUTTONDOWN = 513;
win32.WM_LBUTTONUP = 514;
win32.WM_LBUTTONDBLCLK = 515;
win32.WM_RBUTTONDOWN = 516;
win32.WM_RBUTTONUP = 517;
win32.WM_RBUTTONDBLCLK = 518;
// WindowProc.uMsg
win32.WM_USER = 1024;
win32.WM_CREATE = 1;
win32.WM_DESTROY = 2;
win32.WM_GETMINMAXINFO = 36;
win32.WM_NCCREATE = 129;
win32.WM_NCDESTROY = 130;
win32.WM_NCCALCSIZE = 131;
win32.WM_UAHDESTROYWINDOW = 144; // http://aw.comyr.com/2009/11/wm_messages/  Unable to know what mean this code :/





/*
  LONG WINAPI SetWindowLong(
    __in  HWND hWnd,
    __in  int nIndex,
    __in  LONG dwNewLong
  );
*/
win32.SetWindowLong = 
  libs.user32.declare("SetWindowLongA", ctypes.winapi_abi, ctypes.long,
    ctypes.voidptr_t, ctypes.int32_t, ctypes.int64_t
    );
win32.GWL_WNDPROC = -4;
win32.GWL_EXSTYLE = -20;

/*
  LRESULT WINAPI DefWindowProc(
    __in  HWND hWnd,
    __in  UINT Msg,
    __in  WPARAM wParam,
    __in  LPARAM lParam
  );
*/
win32.DefWindowProc = 
  libs.user32.declare("DefWindowProcA", ctypes.winapi_abi, ctypes.int,
    ctypes.voidptr_t, ctypes.int32_t, ctypes.int32_t, ctypes.int32_t);


/*
  typedef struct _NOTIFYICONDATA {
    DWORD cbSize;
    HWND  hWnd;
    UINT  uID;
    UINT  uFlags;
    UINT  uCallbackMessage;
    HICON hIcon;
    TCHAR szTip[64];
    DWORD dwState;
    DWORD dwStateMask;
    TCHAR szInfo[256];
    union {
      UINT uTimeout;
      UINT uVersion;
    } ;
    TCHAR szInfoTitle[64];
    DWORD dwInfoFlags;
    GUID  guidItem;
    HICON hBalloonIcon;
  } NOTIFYICONDATA, *PNOTIFYICONDATA;
*/
win32.NOTIFICATIONDATA = 
  ctypes.StructType("NOTIFICATIONDATA",
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
    ]);
// NOTIFICATIONDATA.uFlags :
win32.NIF_MESSAGE = 0x00000001; // in order to get events (clicks,moves,...)
win32.NIF_ICON = 0x00000002; // in order to consider hIcon
win32.NIF_TIP = 0x00000004; // in order to display szTip on mouseover

/*
  BOOL Shell_NotifyIcon(
    __in  DWORD dwMessage,
    __in  PNOTIFYICONDATA lpdata
  );
*/
win32.Shell_NotifyIcon =
  libs.shell32.declare("Shell_NotifyIcon", ctypes.winapi_abi, ctypes.bool,
    ctypes.int,
    win32.NOTIFICATIONDATA.ptr);
// Shell_NotifyIcon.dwMessage :
win32.NIM_ADD = 0x00000000
win32.NIM_MODIFY = 0x00000001
win32.NIM_DELETE = 0x00000002
  
/*
  HANDLE WINAPI LoadImage(
    __in_opt  HINSTANCE hinst,
    __in      LPCTSTR lpszName,
    __in      UINT uType,
    __in      int cxDesired,
    __in      int cyDesired,
    __in      UINT fuLoad
  );
*/
win32.LoadImage =
  libs.user32.declare("LoadImageA", ctypes.winapi_abi, ctypes.voidptr_t,
    ctypes.int,
    ctypes.char.ptr,
    ctypes.int,
    ctypes.int,
    ctypes.int,
    ctypes.int);
// LoadImage.uType
win32.IMAGE_BITMAP = 0;
win32.IMAGE_ICON = 1;
// LoadImage.fuLoad
win32.LR_LOADFROMFILE = 16;

/*
  BOOL WINAPI DestroyIcon(
    __in  HICON hIcon
  );
*/
win32.DestroyIcon =
  libs.user32.declare("DestroyIcon", ctypes.winapi_abi, ctypes.bool,
    ctypes.voidptr_t);

win32.POINT = 
   ctypes.StructType("POINT",
    [{ x : ctypes.long },
     { y : ctypes.long }]);

/*
  BOOL WINAPI GetCursorPos(
    __out  LPPOINT lpPoint
  );
*/
win32.GetCursorPos = 
  libs.user32.declare("GetCursorPos", ctypes.winapi_abi, ctypes.bool,
    win32.POINT.ptr);

/*
  DWORD WINAPI GetLastError(void);
*/
win32.GetLastError =
  libs.kernel32.declare("GetLastError", ctypes.winapi_abi, ctypes.int);

