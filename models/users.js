import { Schema, model, ObjectId, Error } from 'mongoose'
import validator from 'validator'
import bcrypt from 'bcrypt'
import UserRole from '../enums/UserRole.js'

const cartSchema = new Schema({
  product: {
    // _id mongoose裡面的
    type: ObjectId,
    ref: 'products',
    required: [true, '缺少商品欄位']
  },
  quantity: {
    type: Number,
    required: [true, '缺少商品數量']
  }
})

const schema = new Schema(
  {
    account: {
      type: String,
      required: [true, '缺少使用者帳號'],
      minlength: [4, '使用者長度不符'],
      maxlength: [20, '使用者長度不符'],
      unique: true,
      validator: {
        validator (value) {
          // isAlphanumeric() 驗證只包含字母和數字
          return validator.isAlphanumeric(value)
        },
        message: '使用者帳號格式錯誤'
      }
    },
    email: {
      type: String,
      required: [true, '缺少使用者信箱'],
      unique: true,
      validator: {
        validator (value) {
          return validator.isEmail(value)
        },
        message: '使用者信箱格式錯誤'
      }
    },
    password: {
      type: String,
      required: [true, '缺少使用者密碼']
    },
    tokens: {
      type: [String]
    },
    cart: {
      type: [cartSchema]
    },
    role: {
      type: Number,
      // 0是會員，1是管理員
      // 如果這邊註解，可讀性不好，不知道0代表甚麼
      // 所以另外開一個檔案去定義，然後引進
      default: UserRole.USER
    }
  },
  {
    // 最後更新時間
    timestamps: true,
    // 修改幾次
    versionKey: false
  }
)

// 建立虛擬欄位 virtual
// 官方文件
// https://mongoosejs.com/docs/tutorials/virtuals.html
schema.virtual('cartQuantity').get(function () {
  return this.cart.reduce((total, current) => {
    return total + current.quantity
  }, 0)
})

schema.pre('save', function (next) {
  const users = this
  if (users.isModified('password')) {
    if (users.password.length < 4 || users.password.length > 20) {
      const error = new Error.ValidationError(null)
      error.addError('password', new Error.ValidatorError({ message: '密碼長度不符' }))
      next(error)
    } else {
      users.password = bcrypt.hashSync(users.password, 10)
    }
  }
  next()
})

export default model('users', schema)
