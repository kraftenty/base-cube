const express = require('express');
const expressEjsLayouts = require('express-ejs-layouts');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const fs = require('fs');

const app = express();
const port = 3000;

// sessions 디렉토리 생성
if (!fs.existsSync('./sessions')) {
    fs.mkdirSync('./sessions');
}

// 정적 파일을 가장 먼저 처리
app.use(express.static('./public'));

// 레이아웃과 뷰 엔진 설정
app.use(expressEjsLayouts);
app.set('view engine', 'ejs');
app.set('views', './views');

// 세션
app.use(session({
    secret: 'secretKey',
    resave: false,
    saveUninitialized: false,
    store: new FileStore({
        path: './sessions',
        retries: 0
    }),
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 // 24시간
    }
}));

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우팅
app.use('/', require('./routes/userRouter'));
app.use('/api', require('./routes/apiRouter'));
app.use('/dml', require('./routes/dmlRouter'));

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
