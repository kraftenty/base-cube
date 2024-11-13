const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const userHandler = require('../user/userHandler');
const dataService = require('../dbms/dataService');

// 로그인 여부 확인 미들웨어
const checkLogin = (req, res, next) => {
    if (!req.session.uid) {
        return res.redirect('/login');
    }
    next();
};

router.route('/login')
    .get(asyncHandler(async (req, res) => {
        // 이미 로그인된 사용자는 메인 페이지로 리다이렉트
        if (req.session.uid) {
            return res.redirect('/');
        }
        res.render('./user/login', { 
            layout: '../views/layouts/authLayout', 
            title: 'Login', 
            message: '' 
        });
    }))
    .post(asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        
        // 입력값 검증
        if (!email?.trim() || !password?.trim()) {
            return res.render('./user/login', { 
                layout: '../views/layouts/authLayout', 
                title: 'Login', 
                message: 'Please enter email and password' 
            });
        }

        try {
            const { uid, message } = await userHandler.getUserByEmailAndPassword(email.trim(), password);
            if (uid) {
                req.session.uid = uid;
                req.session.save(() => res.redirect('/'));
                return;
            }
            
            return res.render('./user/login', { 
                layout: '../views/layouts/authLayout', 
                title: 'Login', 
                message: message || 'Login failed'
            });
            
        } catch (error) {
            return res.render('./user/login', { 
                layout: '../views/layouts/authLayout', 
                title: 'Login', 
                message: 'An error occurred while logging in'
            });
        }
    }));

router.route('/logout')
    .get(asyncHandler(async (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('An error occurred while logging out:', err);
                return res.status(500).send('An error occurred while logging out');
            }
            res.clearCookie('connect.sid');
            res.redirect('/login');
        });
    }));
router.route('/signup')
    .get(asyncHandler(async (req, res) => {
        res.render('./user/signup', { layout: '../views/layouts/authLayout', title: 'Signup', message: ''});
    }))
    .post(asyncHandler(async (req, res) => {
        const { email, password, passwordConfirm } = req.body;
        if (password !== passwordConfirm) {
            return res.render('./user/signup', { 
                layout: '../views/layouts/authLayout', 
                title: 'Signup', 
                message: 'Passwords do not match' 
            });
        }
        const { uid, message } = await userHandler.addUser(email, password);
        if (uid === null) {
            return res.render('./user/signup', { 
                layout: '../views/layouts/authLayout', 
                title: 'Signup', 
                message: message || 'Signup failed' 
            });
        }
        req.session.uid = uid;
        req.session.save(() => {
            res.send('<script>alert("Welcome to BaseCube!"); window.location.href="/";</script>');
        });
    }));

router.route('/account/delete')
    .post(asyncHandler(async (req, res) => {
        const { uid } = req.session;
        await userHandler.deleteUser(uid);
        req.session.destroy(() => res.redirect('/login'));
    }));


router.route(['/'])
    .get(checkLogin, asyncHandler(async (req, res) => {
        res.render('./user/about', {
            layout: '../views/layouts/userLayout',
            title: 'Home'
        });
    }));

router.route('/help')
    .get(checkLogin, asyncHandler(async (req, res) => {
        res.render('./user/help', {
            layout: '../views/layouts/userLayout',
            title: 'Help'
        });
    }));

router.route('/contact')
    .get(checkLogin, asyncHandler(async (req, res) => {
        res.render('./user/contact', {
            layout: '../views/layouts/userLayout',
            title: 'Contact'
        });
    }));

// 데이터베이스 페이지

router.route('/database')
    .get(checkLogin, asyncHandler(async (req, res) => {
        res.render('./user/database', {
            layout: '../views/layouts/userLayout',
            title: 'Database',
            tables: dataService.getAllTablesByUid(req.session.uid)
        });
    }));

router.route('/database/table/:table')
    .get(checkLogin, asyncHandler(async (req, res) => {
        res.render('./user/table', {
            layout: '../views/layouts/userLayout',
            title: req.params.table,
            tables: dataService.getAllTablesByUid(req.session.uid),
            data: dataService.getTableDataForUser(req.session.uid, req.params.table),
            schema: dataService.getTableSchemaForUser(req.session.uid, req.params.table)
        });
    }));

router.route('/database/table/:table/insert')
    .get(checkLogin, asyncHandler(async (req, res) => {
        res.render('./user/tableinsert', {
            layout: '../views/layouts/userLayout',
            title: 'Insert Data',
            schema: dataService.getTableSchemaForUser(req.session.uid, req.params.table),
            table: req.params.table,
            tables: dataService.getAllTablesByUid(req.session.uid)
        });
    }))
    .post(checkLogin, asyncHandler(async (req, res) => {
        await dataService.insertRecord(req.session.uid, req.params.table, req.body);
        res.redirect(`/database/table/${req.params.table}`);
    }));

router.route('/database/table/:table/drop')
    .get(checkLogin, asyncHandler(async (req, res) => {
        await dataService.dropTableForUser(req.session.uid, req.params.table);
        res.redirect('/database');
    }));

router.route('/database/create')
    .get(checkLogin, asyncHandler(async (req, res) => {
        res.render('./user/createtable', {
            layout: '../views/layouts/userLayout',
            title: 'Create Table',
            tables: dataService.getAllTablesByUid(req.session.uid)
        });
    }))
    .post(checkLogin, asyncHandler(async (req, res) => {
        await dataService.createTableForUser(req.session.uid, req.body);
        res.redirect('/database');
    }));


// 엔드포인트 페이지

router.route('/endpoint')
    .get(checkLogin, asyncHandler(async (req, res) => {
        res.render('./user/endpoint', {
            layout: '../views/layouts/userLayout',
            title: 'Endpoint'
        });
    }));

// 어카운트 페이지

router.route('/account/payment')
    .get(checkLogin, asyncHandler(async (req, res) => {
        res.render('./user/payment', {
            layout: '../views/layouts/userLayout',
            title: 'Payment'
        });
    }));

router.route('/account/updateinfo')
    .get(checkLogin, asyncHandler(async (req, res) => {
        res.render('./user/updateinfo', {
            layout: '../views/layouts/userLayout',
            title: 'Update Information',
            message: ''
        });
    }))
    .post(checkLogin, asyncHandler(async (req, res) => {
        const { uid } = req.session;
        const { oldPassword, newPassword, confirmNewPassword } = req.body;
        if (newPassword !== confirmNewPassword) {
            return res.render('./user/updateinfo', {
                layout: '../views/layouts/userLayout',
                title: 'Update Information',
                message: 'New passwords do not match'
            });
        }
        const isPasswordChanged = await userHandler.changePassword(uid, oldPassword, newPassword);
        if (!isPasswordChanged) {
            return res.render('./user/updateinfo', {
                layout: '../views/layouts/userLayout',
                title: 'Update Information',
                message: 'Invalid old password'
            });
        }
        res.render('./user/updateinfo', {
            layout: '../views/layouts/userLayout',
            title: 'Update Information',
            message: 'Password changed successfully'
        });
    }));

router.route('/account/delete')
    .get(checkLogin, asyncHandler(async (req, res) => {
        res.render('./user/deleteaccount', {
            layout: '../views/layouts/userLayout',
            title: 'Delete Account'
        });
    }));

    
module.exports = router;
