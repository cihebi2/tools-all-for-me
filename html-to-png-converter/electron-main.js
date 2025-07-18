const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;
const PORT = 3003;

// 启动后端服务器
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('正在启动后端服务器...');
    
    serverProcess = spawn('node', ['server.js'], {
      cwd: __dirname,
      stdio: 'pipe',
      env: { ...process.env, FORCE_COLOR: '0' }
    });

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString('utf8');
      console.log(`服务器输出: ${output}`);
      if (output.includes('服务器') || output.includes('localhost:3003') || output.includes('HTML转PNG服务已启动')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const error = data.toString('utf8');
      console.error(`服务器错误: ${error}`);
      // 不要因为stderr输出就reject，很多正常信息也会输出到stderr
    });

    serverProcess.on('close', (code) => {
      console.log(`服务器进程退出，代码: ${code}`);
    });

    // 等待服务器启动（增加等待时间）
    setTimeout(() => {
      console.log('服务器启动等待超时，继续启动窗口...');
      resolve();
    }, 5000);
  });
}

// 创建主窗口
function createWindow() {
  // 检查图标文件是否存在
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  const fs = require('fs');
  let windowOptions = {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    center: true,
    resizable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
    alwaysOnTop: false,
    skipTaskbar: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      backgroundThrottling: false
    },
    show: false,
    titleBarStyle: 'default',
    backgroundColor: '#ffffff'
  };

  // 如果图标文件存在，则添加图标
  if (fs.existsSync(iconPath)) {
    windowOptions.icon = iconPath;
  }

  mainWindow = new BrowserWindow(windowOptions);

  // 设置应用菜单
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '查看',
      submenu: [
        { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: '强制重新加载', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '实际大小', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: async () => {
            await dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于 HTML转PNG转换器',
              message: 'HTML转PNG转换器',
              detail: '版本: 1.0.0\n一个高效的HTML转PNG转换工具'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // 加载应用
  mainWindow.loadURL(`http://localhost:${PORT}`).catch(err => {
    console.error('加载URL失败:', err);
    dialog.showErrorBox('加载失败', '无法加载应用页面，请检查服务器是否正常启动。');
  });

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    console.log('窗口准备就绪，正在显示...');
    mainWindow.show();
    mainWindow.focus();
    
    // 确保窗口在最前面
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (!mainWindow.isVisible()) {
          console.log('窗口未显示，强制显示...');
          mainWindow.show();
        }
        mainWindow.focus();
        mainWindow.setAlwaysOnTop(true);
        setTimeout(() => {
          mainWindow.setAlwaysOnTop(false);
        }, 1000);
      }
    }, 500);
  });

  // 添加页面加载失败处理
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('页面加载失败:', errorCode, errorDescription, validatedURL);
    dialog.showErrorBox('页面加载失败', `错误代码: ${errorCode}\n描述: ${errorDescription}\n请确保服务器正在运行。`);
  });

  // 处理窗口关闭
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// 应用就绪时
app.whenReady().then(async () => {
  try {
    // 先启动服务器
    await startServer();
    
    // 等待确保服务器完全启动
    console.log('等待服务器完全启动...');
    setTimeout(() => {
      console.log('开始创建应用窗口...');
      createWindow();
    }, 2000);
    
  } catch (error) {
    console.error('启动服务器失败:', error);
    dialog.showErrorBox('启动失败', '无法启动后端服务器，请检查端口是否被占用。');
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 应用退出时
app.on('window-all-closed', () => {
  // 关闭服务器进程
  if (serverProcess) {
    serverProcess.kill();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // 关闭服务器进程
  if (serverProcess) {
    serverProcess.kill();
  }
});

// 防止多个实例
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
} 