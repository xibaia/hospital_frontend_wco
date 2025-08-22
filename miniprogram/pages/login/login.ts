Page({
  data: {
    username: '',
    password: '',
    canLogin: false
  },

  onLoad() {
    // 检查是否已经登录
    const token = wx.getStorageSync('token')
    if (token) {
      wx.redirectTo({
        url: '../patient/patient'
      })
    }
  },

  onUsernameInput(e: any) {
    const username = e.detail.value
    this.setData({
      username
    })
    this.checkCanLogin()
  },

  onPasswordInput(e: any) {
    const password = e.detail.value
    this.setData({
      password
    })
    this.checkCanLogin()
  },

  checkCanLogin() {
    const { username, password } = this.data
    this.setData({
      canLogin: username.trim() !== '' && password.trim() !== ''
    })
  },

  onLogin() {
    if (!this.data.canLogin) return

    wx.showLoading({
      title: '登录中...'
    })

    wx.request({
      url: 'http://127.0.0.1:8000/api/patient/login/',
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      data: {
        username: this.data.username,
        password: this.data.password
      },
      success: (res: any) => {
        wx.hideLoading()
        console.log('登录响应:', res.data)
        
        if (res.data.success) {
          // 保存token和用户信息
          wx.setStorageSync('token', res.data.data.token)
          wx.setStorageSync('userInfo', res.data.data.user_info)
          wx.setStorageSync('patientInfo', res.data.data.patient_info)
          
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          })
          
          setTimeout(() => {
            wx.redirectTo({
              url: '../patient/patient'
            })
          }, 1000)
        } else {
          wx.showToast({
            title: res.data.message || '登录失败',
            icon: 'error'
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('登录请求失败:', err)
        wx.showToast({
          title: '网络请求失败',
          icon: 'error'
        })
      }
    })
  },

  goToRegister() {
    wx.navigateTo({
      url: '../register/register'
    })
  }
})