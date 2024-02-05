import passport from 'passport'
import passportLocal from 'passport-local'
import passportJWT from 'passport-jwt'
import bcrypt from 'bcrypt'
import users from '../models/users.js'

passport.use(
  'login',
  new passportLocal.Strategy(
    {
      usernameField: 'account',
      passwordField: 'password'
    },
    async (account, password, done) => {
      try {
        // findOne({ account })  MongoDB 的語法
        // 在資料庫中查找符合特定條件的第一個文件
        const user = await users.findOne({ account })
        if (!user) {
          throw new Error('ACCOUNT')
        }

        // 第一個 password ( passwordField: 'password')
        if (!bcrypt.compareSync(password, user.password)) {
          throw new Error('PASSWORD')
        }
        // (錯誤物件, 使用者物件(失敗為 false 或 null), 傳遞關於驗證狀態的額外訊息)
        return done(null, user, null)
      } catch (error) {
        console.log(error)
        if (error.message === 'ACCOUNT') {
          return done(null, null, { message: '帳號不存在' })
        } else if (error.message === 'PASSWORD') {
          return done(null, null, { message: '密碼錯誤' })
        } else {
          return done(null, null, { message: '未知錯誤' })
        }
      }
    }
  )
)

passport.use(
  'jwt',
  // jwtFromRequest 定義如何從請求中提取 JWT
  // passportJWT：Passport.js 的 JWT 策略模組，需要先安裝並引入才能使用。
  // ExtractJwt：用於從不同的地方（如頭部、查詢參數等）提取 JWT
  // fromAuthHeaderAsBearerToken：用於從 Authorization 頭部的 Bearer token 中提取 JWT
  // secretOrKey 定義了加密 JWT 的密鑰
  // passReqToCallback：如果設置為 true，則在回調函數中可以使用 req 參數
  // ignoreExpiration：略過過期檢查 在下面自己寫檢查，某些路由可以通過
  new passportJWT.Strategy(
    {
      jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
      passReqToCallback: true,
      ignoreExpiration: true
    },
    // payload 解析出來的資料
    async (req, payload, done) => {
      try {
        // 檢查過期
        // jwt 過期時間單位是秒，node.js 日期單位是毫秒，要乘1000
        // exp 過期
        const expired = payload.exp * 1000 < new Date().getTime()

        /*
      http://localhost:4000/users/test?aaa=111&bbb=2
      req.originalUrl = /users/test?aaa=111&bbb=2
      req.baseUrl = /users
      req.path = /test
      req.query = { aaa: 111, bbb: 222 }
    */
        const url = req.baseUrl + req.path
        // extend 換 token
        // 拿 token 請求時，會經過這個 jwt
        if (expired && url !== '/users/extend' && url !== '/users/logout') {
          throw new Error('EXPIRED')
        }

        // const token = req.headers.authorization.split(' ')
        // 從 req 的 Authorization 頭部提取 JWT，並返回這個 JWT
        const token = passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken()(req)
        const user = await users.findOne({ _id: payload._id, tokens: token })
        if (!user) {
          throw new Error('JWT')
        }

        return done(null, { user, token }, null)
      } catch (error) {
        if (error.message === 'EXPIRED') {
          return done(null, null, { message: 'JWT 過期' })
        } else if (error.message === 'JWT') {
          return done(null, null, { message: 'JWT 無效' })
        } else {
          return done(null, null, { message: '未知錯誤' })
        }
      }
    }
  )
)
