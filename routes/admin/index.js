module.exports = app => {
    const fs = require("fs")
    //登陆校验中间件
    const authMiddleware = require("../../middleware/auth");
    const resourceMiddleware = require("../../middleware/resource");

    //常用增删查改
    const commonRouter = require("./middleware/commonRouter");
    app.use("/admin/api/rest/:resource", authMiddleware(), resourceMiddleware(), commonRouter);
    //用户相关
    const userRouter = require("./middleware/UserRouter");
    app.use("/admin/api/user/:resource", resourceMiddleware(), userRouter);
    //书籍
    const bookRouter = require("./middleware/BookRouter");
    app.use("/admin/api/book/:resource", authMiddleware(), resourceMiddleware(), bookRouter);//书籍
    //分页查询
    const pageRouter = require("./middleware/PageRouter");
    app.use("/admin/api/page/:resource", authMiddleware(), resourceMiddleware(), pageRouter);

    //小程序
    const miniRouter = require("./middleware/MiniRouter");
    app.use("/mini/:resource", resourceMiddleware(), miniRouter);

    const multer = require('multer');
    const createFolder = function(folder){
        try{
            fs.accessSync(folder);
        }catch(e){
            fs.mkdirSync(folder);
        }
    };
    const uploadFolder =  __dirname + '/../../uploads';
    createFolder(uploadFolder);
    // 通过 filename 属性定制
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadFolder);    // 保存的路径，备注：需要自己创建
        },
        filename: function (req, file, cb) {
            // 将保存文件名设置为 字段名 + 时间戳
            cb(null, file.fieldname + "_" + new Date().getTime() + "_" + file.originalname);
        }
    });
    const upload = multer({ storage: storage })
    app.post('/admin/api/upload', authMiddleware(), upload.single('file'), async (req, res) => {
        const file = req.file
        // file.url = `http://localhost:3000/uploads/${file.filename}`
        file.url = `https://shop.yongpingshop.com/uploads/${file.filename}`
        res.send(file)
    });
    //删除文件
    app.delete('/admin/api/removeFile', authMiddleware(), async (req, res) => {
        const {filename} = req.body
        fs.unlink(__dirname + '/../../uploads/' + filename, (err) => {
            if (err) {
                console.log(err)
                res.send({
                    message: '删除文件失败'
                })
            } else {
                res.send({
                    message: '删除文件成功'
                })
            }
        })

    })

    app.post("/admin/api/login", async (req, res) => {
        // console.log("login:",req.body);
        const {username, password} = req.body
        // 1.根据用户名找用户
        const user = require("../../models/User")
        //使用字符串语法时，有 - 前缀的路径会被排除，没有 - 前缀的路径会被选择。
        // 最后，如果路径有前缀 +，将被强制选择，这对于在 schema level 被排除的路径会有用。
        const userInfo = await user.findOne({username}).select('+password')
        if (!userInfo) {
            return res.status(422).send({
                message: "用户不存在"
            })
        }
        // 2.校验密码
        const isValid = require('bcrypt').compareSync(password, userInfo.password)
        if (!isValid) {
            return res.status(422).send({
                message: "密码错误"
            })
        }
        // 3.返回token
        const jwt = require("jsonwebtoken")
        const token = jwt.sign({id: userInfo._id}, app.get("secret"))
        res.send({token})
    });

    // 错误处理函数
    app.use(async (err, req, res, next) => {

        res.status(err.statusCode || 500).send({
            message: err.message
        })
    })
}
