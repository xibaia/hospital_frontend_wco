Page({
  data: {
    patientInfo: {
      user_info: {
        full_name: '未知患者',
        username: '未知用户'
      },
      assigned_doctor_name: '未分配',
      mobile: '未设置',
      address: '未设置', 
      symptoms: '未设置',
      admitDate: '未设置',
      status: false,
      avatarText: '患'
    } as any,
    loading: false,
    showEditModal: false,
    editField: '',
    editValue: '',
    saving: false
  },

  onLoad() {
    this.getPatientInfo();
  },

  onShow() {
    // 每次显示页面时刷新信息
    this.getPatientInfo();
  },

  // 获取患者信息
  getPatientInfo() {
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
        console.log('获取患者信息:', res.data);
        console.log('原始数据结构:', JSON.stringify(res.data.data, null, 2));
        if (res.data.success) {
          // 确保数据结构完整，避免null/undefined导致的错误
          const patientData = res.data.data || {};
          const userInfo = patientData.user_info || {};
          
          console.log('userInfo before processing:', userInfo);
          console.log('full_name type:', typeof userInfo.full_name, 'value:', userInfo.full_name);
          console.log('username type:', typeof userInfo.username, 'value:', userInfo.username);
          
          // 更严格的数据处理
          const processedUserInfo = {
            ...userInfo,
            full_name: (userInfo.full_name && typeof userInfo.full_name === 'string' && userInfo.full_name.trim().length > 0) ? userInfo.full_name.trim() : '未知患者',
            username: (userInfo.username && typeof userInfo.username === 'string' && userInfo.username.trim().length > 0) ? userInfo.username.trim() : '未知用户'
          };
          
          console.log('processed userInfo:', processedUserInfo);
          
          // 确保所有可能使用charAt的字段都不为null
          const safePatientData = {
            ...patientData,
            user_info: processedUserInfo,
            assigned_doctor_name: patientData.assigned_doctor_name || '未分配',
            mobile: patientData.mobile || '未设置',
            address: patientData.address || '未设置',
            symptoms: patientData.symptoms || '未设置',
            admitDate: patientData.admitDate || '未设置'
          };
          
          // 预计算头像文字，避免在WXML中使用charAt
          const avatarText = processedUserInfo.full_name && processedUserInfo.full_name.length > 0 && processedUserInfo.full_name !== '未知患者' 
            ? processedUserInfo.full_name.charAt(0) 
            : '患';
          
          safePatientData.avatarText = avatarText;
          
          console.log('最终数据结构:', safePatientData);
          
          this.setData({
            patientInfo: safePatientData
          });
        } else {
          // 检查是否是认证失败
          if (res.statusCode === 401 || (res.data && res.data.message && res.data.message.includes('认证') || res.data.message.includes('登录'))) {
            wx.showToast({
              title: '登录已过期，请重新登录',
              icon: 'none'
            });
            // 清除存储的token
            wx.removeStorageSync('token');
            // 跳转到登录页
            wx.redirectTo({
              url: '/pages/login/login'
            });
            return;
          }
          
          wx.showToast({
            title: res.data.message || '获取信息失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('获取患者信息失败:', err);
        // 检查网络错误类型
        if (err.errMsg && err.errMsg.includes('timeout')) {
          wx.showToast({
            title: '请求超时，请检查网络连接',
            icon: 'none'
          });
        } else {
          wx.showToast({
            title: '网络错误，请稍后重试',
            icon: 'none'
          });
        }
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  // 刷新信息
  refreshInfo() {
    this.getPatientInfo();
    wx.showToast({
      title: '刷新成功',
      icon: 'success'
    });
  },

  // 编辑手机号
  editMobile() {
    this.setData({
      showEditModal: true,
      editField: 'mobile',
      editValue: this.data.patientInfo.mobile || ''
    });
  },

  // 编辑地址
  editAddress() {
    this.setData({
      showEditModal: true,
      editField: 'address',
      editValue: this.data.patientInfo.address || ''
    });
  },

  // 编辑症状
  editSymptoms() {
    this.setData({
      showEditModal: true,
      editField: 'symptoms',
      editValue: this.data.patientInfo.symptoms || ''
    });
  },

  // 编辑值变化
  onEditValueChange(e: any) {
    this.setData({
      editValue: e.detail.value
    });
  },

  // 关闭编辑弹窗
  closeEditModal() {
    this.setData({
      showEditModal: false,
      editField: '',
      editValue: ''
    });
  },

  // 保存编辑
  saveEdit() {
    const { editField, editValue } = this.data;
    
    if (!editValue.trim()) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return;
    }

    // 验证手机号格式
    if (editField === 'mobile') {
      const mobileRegex = /^1[3-9]\d{9}$/;
      if (!mobileRegex.test(editValue)) {
        wx.showToast({
          title: '请输入正确的手机号码',
          icon: 'none'
        });
        return;
      }
    }

    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    this.setData({ saving: true });

    const updateData: any = {};
    updateData[editField] = editValue;

    wx.request({
      url: 'http://127.0.0.1:8000/api/patient/update/',
      method: 'PUT',
      header: {
        'Authorization': 'Token ' + token,
        'content-type': 'application/json'
      },
      data: updateData,
      success: (res: any) => {
        console.log('更新患者信息:', res.data);
        if (res.data.success) {
          wx.showToast({
            title: '更新成功',
            icon: 'success'
          });
          // 更新本地数据
          const updatedPatientInfo = { ...this.data.patientInfo };
          updatedPatientInfo[editField] = editValue;
          this.setData({
            patientInfo: updatedPatientInfo,
            showEditModal: false
          });
        } else {
          wx.showToast({
            title: res.data.message || '更新失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('更新患者信息失败:', err);
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ saving: false });
      }
    });
  },

  // 跳转到设置页面
  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  },

  // 防止弹窗背景滚动
  preventMove() {
    return false;
  }
});