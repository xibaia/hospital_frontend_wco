// app.ts

// 扩展全局数据接口
interface IGlobalData {
  userInfo?: WechatMiniprogram.UserInfo
  systemInfo?: WechatMiniprogram.SystemInfo
}

// 扩展应用选项接口
interface ICustomAppOption extends IAppOption {
  globalData: IGlobalData
  checkLoginStatus(): void
  setSystemInfo(): void
}

App<ICustomAppOption>({
  globalData: {},
  
  onLaunch() {
    console.log('应用启动');
    
    // 检查登录状态
    this.checkLoginStatus();
    
    // 设置系统信息
    this.setSystemInfo();
  },
  
  onShow() {
    console.log('应用显示');
  },
  
  onHide() {
    console.log('应用隐藏');
  },
  
  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token && userInfo) {
      console.log('用户已登录:', userInfo);
    } else {
      console.log('用户未登录');
    }
  },
  
  // 设置系统信息
  setSystemInfo() {
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res;
        console.log('系统信息:', res);
      }
    });
  },
  
  // 全局错误处理
  onError(error: string) {
    console.error('应用错误:', error);
    wx.showToast({
      title: '系统错误，请重试',
      icon: 'none'
    });
  }
})