import { Router } from 'express'
import * as auth from '../middlewares/auth.js'
import { create, getAll, edit, get, getId } from '../controllers/products.js'
import upload from '../middlewares/upload.js'
import admin from '../middlewares/admin.js'

const router = Router()

router.post('/', auth.jwt, admin, upload, create)
router.get('/all', auth.jwt, admin, getAll)
// 當使用 Mongoose 的 model.create、save 新增一筆資料時
// Mongoose 會自動為 _id 生成一個唯一的 ObjectId。
// 為什麼這邊前端路徑是/products/:id
router.patch('/:id', auth.jwt, admin, upload, edit)
router.get('/', get)
router.get('/:id', getId)

export default router
