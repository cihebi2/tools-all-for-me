const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  console.log('创建测试窗口...');
  
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: true,  // 立即显示
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // 加载一个简单的测试页面
  mainWindow.loadURL('https://www.baidu.com').catch(err => {
    console.error('加载失败:', err);
  });

  // 调试信息
  mainWindow.on('ready-to-show', () => {
    console.log('窗口准备就绪');
  });

  mainWindow.on('show', () => {
    console.log('窗口显示');
  });

  mainWindow.on('closed', () => {
    console.log('窗口关闭');
    mainWindow = null;
  });

  // 10秒后自动关闭（防止卡住）
  setTimeout(() => {
    console.log('测试完成，关闭应用');
    if (mainWindow) {
      mainWindow.close();
    }
    app.quit();
  }, 10000);
}

app.whenReady().then(() => {
  console.log('Electron应用就绪');
  createWindow();
});

app.on('window-all-closed', () => {
  console.log('所有窗口关闭');
  app.quit();
});

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

console.log('Electron测试程序启动...'); 