import wepy from 'wepy'

export default class baseMixin extends wepy.mixin {
  /**
   * [公共方法]
   * @param  {[type]}  item [description]
   * @return {Boolean}      [description]
   */
  noop() {
    return null
  }
  hasOwn(obj, type) {
    return Object.prototype.hasOwnProperty.call(obj, type)
  }

  /**
   * [isXXX 基础方法]
   * @param  {[type]}  item [description]
   * @return {Boolean}      [description]
   */
  isUndefined(item) {
    return typeof item === 'undefined'
  }
  isDefined(item) {
    return !this.isUndefined(item)
  }
  isString(item) {
    return typeof item === 'string'
  }
  isNumber(item) {
    return typeof item === 'number'
  }
  isArray(item) {
    return Object.prototype.toString.apply(item) === '[object Array]'
  }
  isObject(item) {
    return typeof item === 'object' && !this.isArray(item)
  }
  isFunction(item) {
    return typeof item === 'function'
  }

  /**
   * [getXXX 增强方法]
   * @param  {[type]}  item [description]
   * @return {Boolean}      [description]
   */
  getString(item, defaultStr) {
    if (this.isString(item)) return item.trim()
    if (this.isNumber(item)) return `${item}`.trim()
    return defaultStr || ''
  }
  getObject(item, defaultObj) {
    return this.isObject(item) ? item : defaultObj || {}
  }
  getArray(item, defaultArr) {
    return this.isArray(item) ? item : defaultArr || []
  }
  getNumber(item, defaultNum) {
    var matches = this.getString(item).match(/\d+/)
    return this.isNumber(matches && +matches[0]) ? +matches[0] : defaultNum
  }
  getFunction(item) {
    return this.isFunction(item) ? item : noop
  }
  trimObject(obj) {
    return JSON.parse(JSON.stringify(obj))
  }
  _navigate(url, param = {}) {
    this.$root.$navigate(url, this.trimObject(param))
  }
  /* =================== 以下为增强方法 =================== */
  isPhone(str) {
    return /^1\d{10}$/.test(str)
  }
  $alert(item = '调试标题', item2) {
    const param = this.isObject(item)
      ? Object.assign(
        {
            // 首参数为obj
          title: 'title',
          content: 'content'
        },
          item
        )
      : this.isString(item)
        ? this.isString(item2)
          ? {
              // 俩参数均为字符串
            title: item,
            content: item2
          }
          : {
              // 只有首参为字符串
            title: '',
            content: item
          }
        : {
            // 尝试转换字符串
          title: item.toString ? item.toString() : '参数异常'
        }
    wx.showModal(
      Object.assign(
        {
          showCancel: false
        },
        param
      )
    )
  }
  showToast(title) {
    wx.showToast({
      title,
      icon: 'none',
      duration: 2000
    })
  }
  // 容错提示
  $retry(title, content, success, fail) {
    // 如果不传入文案，只有方法
    if (this.isFunction(title)) {
      // 重置成功回调
      success = title
      title = ''
      if (this.isFunction(content)) {
        // 重置失败回调
        fail = content
        content = ''
      }
    }
    try {
      wx.showModal({
        title: title,
        content: content,
        success: res => {
          if (res.confirm) {
            // 用户点击确定
            this.isFunction(success) && success()
          } else if (res.cancel) {
            if (this.isFunction(fail)) {
              fail()
            }
          }
        }
      })
    } catch (e) {
    }
    // wx.showModal({
    //   title: title || '异常提示',
    //   content: content || '网络异常，点击确定重新加载',
    //   success: res => {
    //     if (res.confirm) {
    //       // 用户点击确定
    //       this.isFunction(success) && success()
    //     } else if (res.cancel) {
    //       if (this.isFunction(fail)) {
    //         fail()
    //       } else {
    //         // 取消默认回上一页
    //         wx.navigateBack()
    //       }
    //     }
    //   }
    // })
  }
}
