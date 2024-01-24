import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import routerUsers from './routes/users.js'
import routeProducts from './routes/products.js'
import routeOrders from './routes/orders.js'
import './passport/passport.js'

const app = express()

app.use(
  // cors 是否允許跨域的請求
  cors({
    // origin = 請求的來源
    // callback(錯誤,是否允許)
    origin (origin, callback) {
      // 後端的 origin 通常都是 undefined (除非特別設定)
      if (origin === undefined || origin.includes('github.io') || origin.includes('localhost')) {
        callback(null, true)
      } else {
        callback(new Error('CORS'), false)
      }
    }
  })
)

// 四個參數處理上一層的錯誤
app.use((_, req, res, next) => {
  res.status(403).json({
    success: false,
    message: '請求被拒絕'
  })
})

app.use(express.json())
app.use((_, req, res, next) => {
  res.status(400).json({
    success: false,
    message: '資料格式錯誤'
  })
})

app.use('/users', routerUsers)
app.use('/products', routeProducts)
app.use('/orders', routeOrders)

// 所有的請求方式
// * 代表任意路徑
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '找不到'
  })
})

// 雲端伺服器會指定 process.env.PORT 寫在.env 裡
app.listen(process.env.PORT || 4000, async () => {
  console.log('伺服器啟動')
  await mongoose.connect(process.env.DB_URL)
  console.log('資料庫連線成功')
})
