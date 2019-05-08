import wepy from 'wepy'
import { service } from '../config.js'
export default class httpMixin extends wepy.mixin {
  /* =================== [ $get 发起GET请求 ] =================== */
  $get(
    { url = '', headers = {}, data = {} },
    { success = () => {}, fail = () => {}, complete = () => {} }
  ) {
    const methods = 'GET'
    this.$ajax({ url, headers, methods, data }, { success, fail, complete })
  }

  /* =================== [$post 发起POST请求] =================== */
  $post(
    { url = '', headers = {}, data = {} },
    { success = () => {}, fail = () => {}, complete = () => {} }
  ) {
    const methods = 'POST'
    data = JSON.parse(JSON.stringify(data))
    this.$ajax({ url, headers, methods, data }, { success, fail, complete })
  }

  /**
   * [ajax 请求方法]
   * @param  {[type]}  item [description]
   * @return {Boolean}      [description]
   */
  $ajax(
    { url = '', headers = {}, methods = 'GET', data = {} },
    { success = () => {}, fail = () => {}, complete = () => {} }
  ) {
    // 加载中
    wx.showNavigationBarLoading()

    // 获取用户标识
    let session3rd = ''
    try {
      let __this = this
      let __updateUserInfo = this.$parent.$updateUserInfo
      // 容错页面调用组件时，需要多取一层$parent
      if (!__updateUserInfo && this.$parent.$parent.$updateUserInfo) {
        __this = this.$parent.$parent
        __updateUserInfo = this.$parent.$parent.$updateUserInfo
      }
      // 使用正确的指向
      const __info = __updateUserInfo.call(__this) || this.$parent.$updateUserInfo()
      // console.info('session3rd: ', __info)
      if (__info && __info.session3rd) {
        session3rd = __info.session3rd
      }
    } catch (e) {
      console.error('ERROR get session3rd', e.message || e.stack)
    }
    // log
    try {
      console.table({
        url: url,
        header: Object.assign({ session3rd: session3rd }, headers),
        method: ['GET', 'POST'].indexOf(methods) > -1 ? methods : 'GET',
        data: Object.assign({}, data)
      })
    } catch (error) {}
    // 发起请求
    // wx.request({
    wepy.request({
      url,
      header: Object.assign({ session3rd: session3rd }, headers),
      method: ['GET', 'POST'].indexOf(methods) > -1 ? methods : 'GET',
      data: Object.assign({}, data),
      success: ({ statusCode, data }) => {
        console.log(
          '[SUCCESS]',
          statusCode,
          typeof data === 'object' ? data : data.toString().substring(0, 100)
        )

        // // 报错：接口无返回
        // if (!data) this.$alert({
        //   title: 'error:request.success',
        //   content: [methods, url, statusCode, JSON.stringify(data)].join(' | ')
        // })

        // 未登录,耦合业务逻辑：登陆
        if (data && +data.code === 401) {
          // wx.showToast({
          this.$parent.logined = 1
          // return wx.showToast({
          //   title: '掉线重连中...',
          //   icon: 'loading',
          //   duration: 2000,
          //   success: () => {
          //     setTimeout(() => {
          //       this.$parent.$login({
          //         wxLoginCb: () => {
          //           if (getCurrentPages().length > 1) {// eslint-disable-line
          //             wx.navigateBack()
          //           } else {
          //             wx.switchTab({
          //               url: '/pages/index'
          //             })
          //           }
          //         }
          //       })
          //     }, 1500)
          //   }
          // })
        }
        // 状态码正常
        if (+data.code === 0 && data.data) {
          return setTimeout(() => {
            this.isFunction(success) && success({ statusCode, ...data })
            this.$apply()
          })
        }

        // 状态码为5020 未填写手机号
        // if (+data.code === 5020 && data.data.msg === '数据不存在！') {
        //   const currentPage = getCurrentPages()[0].route
        //   if (currentPage !== 'pages/index') {
        //     wx.navigateTo({
        //       url: `/pages/login/index`
        //     })
        //     return false
        //   }
        //   return setTimeout(() => {
        //     this.isFunction(success) && success({ statusCode, ...data })
        //     this.$apply()
        //   })
        // }


        // 解决后续修改绑定手机号码功能中由于新用户初次加入未填写手机后台没有写入用户数据
        // 造成点击借书架、我的等用户中心页访问，会调用需要授权的用户接口，导致错误提示
        if (data.code === 5020 && data.data.type === 'toast' && data.data.msg.indexOf('Undefined ') > -1) {
          return false
        }

        return setTimeout(() => {
          this.isFunction(fail) && fail({ statusCode, ...data })
          this.$apply()
        })
      },
      fail: ({ statusCode, data }) => {
        console.log('[FAIL]', statusCode, data)
        // this.$alert({
        //   title: 'error:request.fail',
        //   content: [methods, url, statusCode, JSON.stringify(data)].join(' | ')
        // })
        return setTimeout(() => {
          this.isFunction(fail) && fail({ statusCode, ...data })
          this.$apply()
        })

      },
      complete: res => {
        console.log('[COMPLETE]', res)
        // 隐藏加载提示
        wx.hideNavigationBarLoading()
        wx.stopPullDownRefresh()
        return (() => {
          this.isFunction(complete) && complete(res)
          this.$apply()
        })()
      }
    })
  }
}
