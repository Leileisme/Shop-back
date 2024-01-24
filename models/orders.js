import { Schema, model, ObjectId } from 'mongoose'

const cartSchema = new Schema({
  product: {
    // 這裡取的是products裡面的_id?
    type: ObjectId,
    ref: 'products',
    required: [true, '缺少商品欄位']
  },
  quantity: {
    type: Number,
    required: [true, '缺少商品數量']
  }
})

const schema = new Schema({
  user: {
    type: ObjectId,
    ref: 'users',
    required: [true, '缺少使用者']
  },
  // 這邊可以使用timestamps: true ，所以不用這個
  // date: {
  //   type: Date,
  //   // 如果有()就會在登入時取值，沒有()就是發生時執行這個function
  //   default: Date.now
  // }
  cart: {
    type: [cartSchema],
    validate: {
      validator (value) {
        // Array.isArray(value) 判斷是不是陣列
        return Array.isArray(value) && value.length > 0
      },
      message: '購物車不能為空'
    }
  }
}, { versionKey: false, timestamps: true })

export default model('orders', schema)
