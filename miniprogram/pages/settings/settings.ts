Page({
  data: {
    userInfo: {
      full_name: '未知用户',
      username: '未知用户',
      avatarText: '设'
    } as any,
    loading: false,
    showModal: false,
    logoutLoading: false
  },

  onLoad() {
    this.getUserInfo();
  },

  onShow() {
    this.getUserInfo();
  },

  // 获取用户信息
  getUserInfo() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      wx.redirectTo({
        url: '/pages/login/login'
      });
      return;
    }

    this.setData({ loading: true });

    wx.request({
      url: 'http://127.0.0.1:8000/api/patient/info/',
      method: 'GET',
      header: {
        'Authorization': 'Token ' + token,
        'content-type': 'application/json'
      },
      success: (res: any) => {
        console.log('获取用户信息:', res.data);
        if (res.data.success) {
          const userInfo = res.data.data.user_info || {};
          
          // 确保字段安全性，避免charAt错误
          const processedUserInfo = {
            ...userInfo,
            full_name: userInfo.full_name && typeof userInfo.full_name === 'string' && userInfo.full_name.trim() 
              ? userInfo.full_name.trim() 
              : '未知用户',
            username: userInfo.username && typeof userInfo.username === 'string' && userInfo.username.trim() 
              ? userInfo.username.trim() 
              : '未知用户'
          };
          
          // 预计算头像文字，避免在WXML中使用charAt
          const avatarText = processedUserInfo.full_name && processedUserInfo.full_name.length > 0 && processedUserInfo.full_name !== '未知用户' 
            ? processedUserInfo.full_name.charAt(0) 
            : '设';
          
          processedUserInfo.avatarText = avatarText;
          
          this.setData({
            userInfo: processedUserInfo
          });
        } else {
          wx.showToast({
            title: res.data.message || '获取信息失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  // 跳转到患者信息页面
  goToPatient() {
    wx.navigateBack();
  },

  // 刷新数据
  refreshData() {
    this.getUserInfo();
    wx.showToast({
      title: '刷新成功',
      icon: 'success'
    });
  },

  // 显示退出登录弹窗
  showLogoutModal() {
    this.setData({
      showModal: true
    });
  },

  // 隐藏退出登录弹窗
  hideLogoutModal() {
    this.setData({
      showModal: false
    });
  },

  // 确认退出登录
  confirmLogout() {
    const token = wx.getStorageSync('token');
    if (!token) {
      this.logout();
      return;
    }

    this.setData({ logoutLoading: true });

    wx.request({
      url: 'http://127.0.0.1:8000/api/patient/logout/',
      method: 'POST',
      header: {
        'Authorization': 'Token ' + token,
        'content-type': 'application/json'
      },
      success: (res: any) => {
        console.log('退出登录:', res.data);
        if (res.data.success) {
          wx.showToast({
            title: '退出成功',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: res.data.message || '退出失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('退出登录失败:', err);
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ logoutLoading: false });
        this.logout();
      }
    });
  },

  // 执行登出操作
  logout() {
    // 清除本地存储的token和用户信息
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    
    // 跳转到登录页面
    wx.redirectTo({
      url: '/pages/login/login'
    });
  },

  // 防止弹窗背景滚动
  preventMove() {
    return false;
  },

  // 校验 bind_api 是否在白名单（使用正则解析，避免依赖 URL 全局对象）
  isTrustedBindApi(urlStr: string) {
    try {
      // 匹配协议、主机、端口、路径
      const m = urlStr.match(/^(https?):\/\/([^\/:?#]+)(?::(\d+))?(\/[^?#]*)/i);
      if (!m) return false;
      const protocol = (m[1] || '').toLowerCase();
      const host = m[2] || '';
      const port = m[3] || '';
      const path = m[4] || '/';

      const allowedHosts: Record<string, boolean> = { '127.0.0.1': true, 'localhost': true };
      const allowedPorts: Record<string, boolean> = { '8002': true, '': true };
      const allowedPaths: Record<string, boolean> = { '/api/patient/bind-doctor/': true };

      const protocolOk = protocol === 'http' || protocol === 'https';
      const hostOk = !!allowedHosts[host];
      const portOk = !!allowedPorts[port];
      const pathOk = !!allowedPaths[path];

      return protocolOk && hostOk && portOk && pathOk;
    } catch (e) {
      return false;
    }
  },

  // 导航到患者信息页（优先返回上一页，否则直达）
  navigateToPatientInfo() {
    try {
      wx.navigateBack({
        delta: 1,
        fail: () => {
          wx.navigateTo({ url: '/pages/patient/patient' });
        }
      });
    } catch (e) {
      wx.navigateTo({ url: '/pages/patient/patient' });
    }
  },

  scanQRCode() {
    wx.scanCode({
      onlyFromCamera: false,
      scanType: ['qrCode', 'barCode', 'datamatrix', 'pdf417'],
      success: (res: any) => {
        console.log('扫码结果:', res);
        // 解析二维码内容
        let payload: any = null;
        try {
          payload = JSON.parse(res.result);
        } catch (e) {
          wx.showModal({
            title: '无法解析二维码',
            content: '二维码内容不是有效的 JSON',
            showCancel: false
          });
          return;
        }

        const DEFAULT_BIND_API = 'http://127.0.0.1:8002/api/patient/bind-doctor/';
        const doctorId = Number(payload ? payload.doctor_id : undefined);
        const bindApiCandidate = (payload && typeof (payload as any).bind_api === 'string' && (payload as any).bind_api.trim())
          ? (payload as any).bind_api.trim()
          : DEFAULT_BIND_API;

        if (!doctorId || !Number.isFinite(doctorId)) {
          wx.showToast({ title: '二维码缺少有效的 doctor_id', icon: 'none' });
          return;
        }

        if (!this.isTrustedBindApi(bindApiCandidate)) {
          wx.showModal({
            title: '已拦截不受信任的地址',
            content: '二维码中的接口地址不在白名单，已阻止请求。\n如需使用，请联系管理员配置白名单。',
            showCancel: false
          });
          return;
        }

        const token = wx.getStorageSync('token');
        if (!token) {
          wx.showToast({ title: '请先登录', icon: 'none' });
          wx.redirectTo({ url: '/pages/login/login' });
          return;
        }

        this.setData({ loading: true });

        wx.request({
          url: bindApiCandidate,
          method: 'POST',
          header: {
            'Authorization': 'Token ' + token,
            'content-type': 'application/json'
          },
          data: { doctor_id: doctorId },
          success: (resp: any) => {
            console.log('绑定医生响应:', resp);
            const okStatus = resp.statusCode >= 200 && resp.statusCode < 300;
            const okFlag = !!(resp && resp.data && (resp.data.success === true || resp.data.code === 0));

            // 从返回中提取可能的提示信息
            const serverMsg = (resp && resp.data && (resp.data.message || resp.data.detail)) || '';
            const msgText = String(serverMsg || '');

            if (okStatus && okFlag) {
              // 成功：提示并引导前往患者信息页刷新查看
              wx.showModal({
                title: '绑定成功',
                content: '是否前往患者信息页查看最新信息？',
                confirmText: '前往查看',
                cancelText: '留在本页',
                success: (res2) => {
                  if (res2.confirm) {
                    this.navigateToPatientInfo();
                  }
                }
              });
              return;
            }

            // 业务错误：已绑定/重复绑定等
            const alreadyBound =
              /已绑定|重复绑定|already\s*bound|has\s*bound/i.test(msgText) ||
              resp.statusCode === 409; // 409 冲突

            if (alreadyBound) {
              wx.showModal({
                title: '已绑定医生',
                content: msgText || '您已绑定过医生，无需重复绑定。',
                confirmText: '去查看',
                cancelText: '知道了',
                success: (res2) => {
                  if (res2.confirm) {
                    this.navigateToPatientInfo();
                  }
                }
              });
              return;
            }

            // 其他错误统一提示
            wx.showModal({
              title: '绑定失败',
              content: msgText || ('HTTP ' + resp.statusCode),
              showCancel: false
            });
          },
          fail: (err) => {
            console.error('绑定请求失败:', err);
            wx.showModal({ title: '网络错误', content: '无法连接服务器，请稍后重试', showCancel: false });
          },
          complete: () => {
            this.setData({ loading: false });
          }
        });
      },
      fail: (err) => {
        console.error('扫码失败:', err);
        wx.showToast({ title: '扫码失败，请重试', icon: 'none' });
      }
    });
  },
});