// 小程序
const express = require('express')
const router = express.Router({
    mergeParams: true
})
//资源列表
router.get('/', async (req, res) => {
    //因为parent是一个id，关联了req.Model
    const items = await req.Model.find()
    res.send(items)
})

//分页分类信息
router.post('/good', async (req, res) => {
    console.log(req.body);
    const {pageNum = 1, pageSize = 5, category} = req.body
    const skipNum = (pageNum - 1) * pageSize
    const condition = {
        $and: [
            {category: category}
        ]
    }
    const data = await req.Model.find(condition).populate('category').skip(skipNum).limit(pageSize)
    res.send(data)
})

module.exports = router
