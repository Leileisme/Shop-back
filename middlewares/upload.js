// 處理上傳的檔案的中介軟體
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import { StatusCodes } from 'http-status-codes'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
})

// 存文字
// cloudinary.upload('aaa')
// https://github.com/cloudinary/cloudinary_npm/issues/177

const upload = multer({
  // 使用 multer-storage-cloudinary 來設定Multer的檔案儲存方式
  // 將檔案直接上傳到雲端
  storage: new CloudinaryStorage({ cloudinary }),
  // 檔案過濾器
  fileFilter(req, file, callback) {
    // file.mimetype 是Multer提供的檔案屬性，表示上傳檔案的MIME type（檔案類型）
    if (['image/jpeg', 'image/png'].includes(file.mimetype)) {
      // callback(錯誤訊息, 是否通過)
      callback(null, true)
    } else {
      callback(new multer.MulterError('LIMIT_FILE_FORMAT'), false)
    }
  },
  limits: {
    fileSize: 1024 * 1024
  }
})

export default (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    // instanceof： 是JS運算子，用於測試一個物件是否是另一個物件的實例
    // 在這裡用來測試 error 是否是 multer.MulterError 的實例
    // multer.MulterError 由 Multer 庫生成的錯誤
    if (error instanceof multer.MulterError) {
      let message = '上傳錯誤'
      if (error.code === 'LIMIT_FILE_SIZE') {
        message = '檔案太大'
      } else if (error.code === 'LIMIT_FILE_FORMAT') {
        message = '檔案格式錯誤'
      }
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message
      })
    } else if (error) {
      console.log(error)
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    } else {
      next()
    }
  })
}
