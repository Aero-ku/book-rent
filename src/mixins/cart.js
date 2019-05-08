import wepy from 'wepy'
import { service } from '../config.js'

export default class cartMixin extends wepy.mixin {

  /**
   * 提供购物车总列表
   * 框架耦合
   */
  getCartList(callback) {
    // 容错,组件中调用，需要再上一层寻找全局变量globalData
    // let _globalData = this.$parent.globalData
    // if (!_globalData) {
    //   _globalData = this.$parent.$parent.globalData
    // }
    // if (!_globalData) return false

    let list
    try {
      var value = wx.getStorageSync('cart')
      if (value) {
        list = value
      } else {
        list = []
      }
    } catch (e) {
      list = []
      console.error('读取购物车信息失败')
    }

    // 优先执行回调
    if (this.isFunction(callback)) {
      const result = callback(list)
      // 更新返回的列表
      if (this.isArray(result)) {
        try {
          wx.setStorageSync('cart', result)
        } catch (e) {
          console.error('存储购物车信息失败')
        }
      }
    }
    return list
  }

  /**
   * 判断商品是否一致
   * 业务耦合
   */
  isGoodEqual(GA, GB) {
    return GA.id == GB.id
  }

  // 加入购物车
  addCart(item, callback) {
    const list = this.getCartList()

    // ------------------ 增加组件内调用情况的容错 ----------------------
    // let _this = this.$parent
    // let _getUserInfo = this.$parent.$getUserInfo
    // if (!_getUserInfo && this.$parent.$parent.$getUserInfo) {
    //   _this = this.$parent.$parent
    //   _getUserInfo = this.$parent.$parent.$getUserInfo
    // }
    // if (!_getUserInfo) return

    // // 根据用户套餐信息处理购物车数量问题
    // _getUserInfo.call(_this, {userInfoCb: ({user_package}) => {
    //   if (this.isDefined(user_package)) {
    //     const {subscribe_quantity, remain_times} = user_package
    //     // 如果没有可借次数
    //     // if (!+remain_times) {
    //     if (false) {
    //       return this.isFunction(callback) && callback({code: 4001, message: '您当前不可借阅图书，请购买订阅套餐'})
    //     }
    //     // 判断是否已超出
    //     // if (list.length >= +subscribe_quantity) {
    //     if (list.length >= 50) {
    //       // 超出提示
    //       this.isFunction(callback) && callback({code: 1001, message: '您的订阅图书的数量已达到上限，请删除某本再借阅'})
    //     } else {
    //       // 真去加车
    //       try {
    //         this.realAddCart(item)
    //         this.isFunction(callback) && callback({code: 0, message: '借阅成功'})
    //       } catch (e) {
    //         this.isFunction(callback) && callback({code: 9001, message: '数据异常，请重新借阅'})
    //       }
    //     }
    //   } else {
    //     this.isFunction(callback) && callback({code: 9002, message: '您暂无可用套餐,请先购买套餐'})
    //   }
    // }})
    // ------------------ 增加组件内调用情况的容错 ----------------------

    // ================== 下单流程改变后修改 ============================
    if (list.length >= 50) {
      this.isFunction(callback) && callback({code: 1001, message: '书架图书数量已达到上限，请删除某本再借阅'})
    } else {
      // 真去加车
      try {
        this.realAddCart(item)
        this.isFunction(callback) && callback({code: 0, message: '借阅成功'})
      } catch (e) {
        this.isFunction(callback) && callback({code: 9001, message: '数据异常，请重新借阅'})
      }
    }
    // ================== 下单流程改变后修改 ============================
  }

  realAddCart(item) {
    this.updateCart({
      arr: item,
      isRemove: false,
      checked: false
    }, {
      getList: this.getCartList,
      isEqual: this.isGoodEqual
    })
  }

  // 从购物车移除
  removeCart(item, callback) {
    this.updateCart({
      arr: item,
      isRemove: true,
      checked: false
    }, {
      getList: this.getCartList,
      isEqual: this.isGoodEqual,
      callback: callback
    })
    this.isFunction(callback) && callback({code: 0, message: '删除成功'})
  }

  // 修改选中图书项目
  selectCartItem(bookIdArr) {
    let selectBooks = this.getArray(bookIdArr, [])
    this.getCartList((list) => {
      for (let i = list.length - 1; i >= 0; i--) {
        if (selectBooks.indexOf(list[i].good.id) > -1) {
          list[i].checked = true
        } else {
          list[i].checked = false
        }
      }
      return list
    })
  }

  /**
   * 更新购物车数据
   * 1、购物车维护总列表ARR与传入列表arr的关系
   * 2、对ARR只有增和减
   * 3、增减逻辑支持传入函数判断
   * 4、返回操作后的列表
   * 业务/框架无关
   */
  updateCart({arr, isRemove, checked}, {getList, isEqual}) {
    // 整理数据
    const itemArr = this.isArray(arr) ? arr : [arr]
    // 循环处理
    itemArr.map((good) => {
      // 构造数据
      const tempData = {
        good: good,
        amount: 1,
        checked: checked
      }
      this.isFunction(getList) && getList.bind(this)((list) => {
        // 对比去重
        let existIndex = undefined
        if (this.isFunction(isEqual)) {
          for (var i = list.length - 1; i >= 0; i--) {
            if (isEqual(list[i].good, tempData.good)) {
              // 取出存在的序号
              existIndex = i
              break
            }
          }
        }

        // 存在时，add增加数量，remove直接删除
        // 不存在时，add直接增加
        if (isRemove) {
          // remove只在存在时操作删除
          this.isDefined(existIndex) && list.splice(existIndex, 1)
        } else {
          // add: 存在加数量，不存在push
          this.isDefined(existIndex) ? list[existIndex].amount++ : list.push(tempData)
        }
        return list
      })
    })
  }

  // 获取用户订阅信息
  $getSubscribeInfo(success = () => {}, fail = () => {}) {
    // 请求个人套餐 + 地址信息
    this.$get({url: service.borrowInfo}, {
      success: ({code, data}) => {
        const {user_info, user_package, user_borrow} = this.getObject(data)
        if (user_info && user_package) {
          // 全局缓存用户信息和套餐信息
          const info = this.$parent.$updateUserInfo({
            user_info,
            user_package
            // user_info: {
            //   user_address: '北京市朝阳区慧忠北里北京市朝阳区慧忠北里北京市朝阳区慧忠北里222号13/15层',
            //   mobile: '12345678900',
            //   user_type_name: '未订阅用户',
            // },
            // user_package: {
            //   remain_times: 1,
            //   subscribe_quantity: 4,
            //   borrow_status_name: '未借阅'
            // }
          })
          this.$apply && this.$apply()
          this.isFunction(success) && success({user_info, user_package, user_borrow})
        }
      },
      fail: ({code, data}) => {
        this.isFunction(fail) && fail({code, data})
      }
    })
  }
}
