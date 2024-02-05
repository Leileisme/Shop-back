import users from '../models/users.js'
import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'
import products from '../models/products.js'
import validator from 'validator'

export const create = async (req, res) => {
  try {
    await users.create(req.body)
    res.status(200).json({
      success: true,
      message: ''
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors[0])
      const message = error.errors[key].message
      res.status(400).json({
        success: false,
        message
      })
      //  資料重複的錯誤代碼11000
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
      res.status(409).json({
        success: false,
        message: '帳號已註冊'
      })
    } else {
      res.status(500).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}

export const login = async (req, res) => {
  try {
    // jwt.sign 創造一個新的JWT，並接受三個參數 ( 物件、密鑰、選項 )
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7 days' })
    req.user.tokens.push(token)
    await req.user.save()
    res.status(200).json({
      success: true,
      message: '',
      result: {
        token,
        account: req.user.account,
        email: req.user.email,
        role: req.user.role,
        // total 總數，current 當前的，
        // cart: req.user.cart.reduce((total, current) => {
        //   return total + current.quantity
        // }, 0)
        cart: req.user.cartQuantity
      }
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

export const logout = async (req, res) => {
  try {
    req.tokens = req.user.tokens.filter((token) => token !== req.token)
    await req.user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: ''
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

// token 舊換新
export const extend = async (req, res) => {
  try {
    const idx = req.user.tokens.findIndex((token) => token === req.token)
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7 days' })
    req.user.tokens[idx] = token
    await req.user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: token
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

// 登入後用JWT存 pinai
// 取得個人資料 放在本地 pinai不會保存
export const getProfile = (req, res) => {
  try {
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        account: req.user.account,
        email: req.user.email,
        role: req.user.role,
        // 建立了一個 cartQuantity 虛擬欄位，所以可以用
        cart: req.user.cartQuantity
      }
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

export const editCart = async (req, res) => {
  try {
    // 檢查商品 id 格式對不對
    if (!validator.isMongoId(req.body.product)) throw new Error('ID')

    // 尋找購物車內有沒有傳入的商品 ID
    const idx = req.user.cart.findIndex(item => item.product.toString() === req.body.product)
    if (idx > -1) {
      // 修改購物車內已有的商品數量
      const quantity = req.user.cart[idx].quantity + parseInt(req.body.quantity)
      // 檢查數量
      // 小於 0，移除
      // 大於 0，修改
      if (quantity <= 0) {
        req.user.cart.splice(idx, 1)
      } else {
        req.user.cart[idx].quantity = quantity
      }
    } else {
      // 檢查商品是否存在或已下架
      const product = await products.findById(req.body.product).orFail(new Error('NOT FOUND'))
      if (!product.sell) {
        throw new Error('NOT FOUND')
      } else {
        req.user.cart.push({
          product: product._id,
          quantity: req.body.quantity
        })
      }
    }
    await req.user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: req.user.cartQuantity
    })
  } catch (error) {
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無商品'
      })
    } else if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}

export const getCart = async (req, res) => {
  try {
    // 用ID找到使用者後，僅抓取'cart' 拿取關聯資料.populate('cart.product')，因為在models的 user.js裡面有給 cart.product有ref
    const result = await users.findById(req.user._id, 'cart').populate('cart.product')
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: result.cart
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

// 購票之後要存兩個地方，範例如下
// export const addCart = async () => {
//   try {
//     const event = await events.findById(req.body.event).orFail()
//     event.tickets.push({ user: req.user._id, used: false })
//     await event.save()

//     req.user.tickets.push(event.tickets[]._id)
//     await req.user.save()
//   } catch (error) {
//   }
// }
