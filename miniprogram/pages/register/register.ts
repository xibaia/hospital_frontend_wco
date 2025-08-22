Page({
  data: {
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    address: '',
    symptoms: '',
    doctors: [] as any[],
    doctorIndex: -1,
    canRegister: false
  },

  onLoad() {
    this.loadDoctors()
  },

  loadDoctors() {
    wx.request({
      url: 'http://127.0.0.1:8000/api/doctors/',
      method: 'GET',
      success: (res: any) => {
        if (res.data.success) {
          this.setData({
            doctors: res.data.data
          })
        }
      },
      fail: (err) => {
        console.error('获取医生列表失败:', err)
        wx.showToast({
          title: '获取医生列表失败',
          icon: 'error'
        })
      }
    })
  },

  onFirstNameInput(e: any) {
    this.setData({ firstName: e.detail.value })
    this.checkCanRegister()
  },

  onLastNameInput(e: any) {
    this.setData({ lastName: e.detail.value })
    this.checkCanRegister()
  },

  onUsernameInput(e: any) {
    this.setData({ username: e.detail.value })
    this.checkCanRegister()
  },

  onPasswordInput(e: any) {
    this.setData({ password: e.detail.value })
    this.checkCanRegister()
  },

  onConfirmPasswordInput(e: any) {
    this.setData({ confirmPassword: e.detail.value })
    this.checkCanRegister()
  },

  onMobileInput(e: any) {
    this.setData({ mobile: e.detail.value })
    this.checkCanRegister()
  },

  onAddressInput(e: any) {
    this.setData({ address: e.detail.value })
    this.checkCanRegister()
  },

  onSymptomsInput(e: any) {
    this.setData({ symptoms: e.detail.value })
    this.checkCanRegister()
  },

  onDoctorChange(e: any) {
    this.setData({
      doctorIndex: parseInt(e.detail.value)
    })
    this.checkCanRegister()
  },

  checkCanRegister() {
    const { firstName, lastName, username, password, confirmPassword, mobile, address, symptoms, doctorIndex } = this.data
    const canRegister = firstName.trim() !== '' && 
                       lastName.trim() !== '' && 
                       username.trim() !== '' && 
                       password.trim() !== '' && 
                       confirmPassword.trim() !== '' && 
                       mobile.trim() !== '' && 
                       address.trim() !== '' && 
                       symptoms.trim() !== '' && 
                       doctorIndex >= 0 && 
                       password === confirmPassword
    
    this.setData({ canRegister })
  },

  validateForm() {
    const { password, confirmPassword, mobile } = this.data
    
    if (password !== confirmPassword) {
      wx.showToast({
        title: '两次输入的密码不一致',
        icon: 'error'
      })
      return false
    }
    
    if (password.length < 6) {
      wx.showToast({
        title: '密码至少6位',
        icon: 'error'
      })
      return false
    }
    
    const mobileReg = /^1[3-9]\d{9}$/
    if (!mobileReg.test(mobile)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'error'
      })
      return false
    }
    
    return true
  },

  onRegister() {
    if (!this.data.canRegister) return
    if (!this.validateForm()) return

    wx.showLoading({
      title: '注册中...'
    })

    const { firstName, lastName, username, password, mobile, address, symptoms, doctors, doctorIndex } = this.data
    
    wx.request({
      url: 'http://127.0.0.1:8000/api/patient/register/',
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      data: {
        first_name: firstName,
        last_name: lastName,
        username: username,
        password: password,
        confirm_password: password,
        mobile: mobile,
        address: address,
        symptoms: symptoms,
        assigned_doctor_id: doctors[doctorIndex].id
      },
      success: (res: any) => {
        wx.hideLoading()
        console.log('注册响应:', res.data)
        
        if (res.data.success) {
          wx.showToast({
            title: '注册成功',
            icon: 'success'
          })
          
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          wx.showToast({
            title: res.data.message || '注册失败',
            icon: 'error'
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('注册请求失败:', err)
        wx.showToast({
          title: '网络请求失败',
          icon: 'error'
        })
      }
    })
  },

  goToLogin() {
    wx.navigateBack()
  }
})