const fs = require('fs');
const crypto = require('crypto');



// users.json 파일 생성
function createUsersFileAndGetFilePath() {
    const filePath = './user/users.json';
    if (!fs.existsSync(filePath)) {
        const initialData = {
            users: []
        };
        fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
    } 
    return filePath;
}



// 비밀번호 암호화
function encryptPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return { hash, salt };
}


// 비밀번호 검증
function verifyPassword(uid, password) {
    const filePath = createUsersFileAndGetFilePath();
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const user = data.users.find(user => user.uid === uid);
    if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    const verifyHash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex');
    return user.password === verifyHash;
}


// 새로운 고유 UID 생성
function generateUniqueUid(existingUsers) {
    while (true) {
        const uid = crypto.randomBytes(4).toString('hex'); // 8자리 16진수
        if (!existingUsers.some(user => user.uid === uid)) {
            return uid;
        }
    }
}

// 유저 추가
function addUser(email, password) {
    // users.json 파일 존재 여부 확인
    const filePath = createUsersFileAndGetFilePath();
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // 이메일 중복 체크
    if (data.users.some(user => user.email === email)) {
        return { uid: null, message: 'Email already exists' };
    }
    
    const { hash, salt } = encryptPassword(password);
    const uid = generateUniqueUid(data.users);
    const apiKey = crypto.randomBytes(10).toString('hex'); // 20자리 16진수
    
    const newUser = {
        uid,
        email,
        password: hash,
        salt,
        apiKey,
        class: 'bronze', // 초기 클래스는 bronze
        createdAt: new Date().toISOString()
    };
    
    data.users.push(newUser);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    return { uid: newUser.uid, message: 'Signup successful' };
}

// 유저 조회
function getUserByEmailAndPassword(email, password) {
    const filePath = createUsersFileAndGetFilePath();
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // { uid, message } 형태로 리턴
    // 이메일 먼저 찾고, 비밀번호 검증
    const user = data.users.find(user => user.email === email);
    if (!user) {
        console.log('Invalid email');
        return { uid: null, message: 'Invalid email' };
    }
    const isPasswordValid = verifyPassword(user.uid, password);
    if (!isPasswordValid) {
        console.log('Invalid password');
        return { uid: null, message: 'Invalid password' };
    }
    return { uid: user.uid, message: 'Login success' };
}

// 유저 클래스 조회
function getUserClass(uid) {
    const filePath = createUsersFileAndGetFilePath();
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data.users.find(user => user.uid === uid)?.class || null;
}

// 유저 클래스별 테이블 개수 리턴
function getTableCountByClass(clazz) {
    if (clazz === 'bronze') {
        return 3;
    } else if (clazz === 'silver') {
        return 10;
    } else if (clazz === 'gold') {
        return 30;
    } else if (clazz === 'platinum') {
        return 100;
    }
    return 0;
}

// 유저 클래스별 가격 리턴
function getUserClassPrice(clazz) {
    if (clazz === 'bronze') {
        return 'free';
    } else if (clazz === 'silver') {
        return 50;
    } else if (clazz === 'gold') {
        return 100;
    } else if (clazz === 'platinum') {
        return 300;
    }
    return 0;
}

// 유저 api key 조회
function getUserApiKey(uid) {
    const filePath = createUsersFileAndGetFilePath();
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data.users.find(user => user.uid === uid)?.apiKey || null;
}

// 유저 api key 유효성 검사
function verifyUserApiKey(uid, apiKey) {
    const filePath = createUsersFileAndGetFilePath();
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data.users.find(user => user.uid === uid && user.apiKey === apiKey) ? true : false;
}

// 이메일 조회
function getEmailByUid(uid) {
    const filePath = createUsersFileAndGetFilePath();
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data.users.find(user => user.uid === uid)?.email || null;
}

// 비밀번호 변경
function changePassword(uid, oldPassword, newPassword) {
    const filePath = createUsersFileAndGetFilePath();
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const user = data.users.find(user => user.uid === uid);
    if (!user) {
        return false;
    }
    const isOldPasswordValid = verifyPassword(user.uid, oldPassword);
    if (!isOldPasswordValid) {
        return false;
    }
    const { hash, salt } = encryptPassword(newPassword);
    user.password = hash;
    user.salt = salt;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
}

// 유저 클래스 변경
function changeUserClass(uid, newClass) {
    const filePath = createUsersFileAndGetFilePath();
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const user = data.users.find(user => user.uid === uid);
    if (!user) {
        return false;
    }
    // 허용된 클래스 값만 설정 가능
    const allowedClasses = ['bronze', 'silver', 'gold', 'platinum'];
    if (!allowedClasses.includes(newClass)) {
        return false;
    }
    user.class = newClass;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
}

// 유저 삭제
function deleteUser(uid) {
    const filePath = createUsersFileAndGetFilePath();
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.users = data.users.filter(user => user.uid !== uid);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
    getUserByEmailAndPassword,
    getEmailByUid,
    addUser,
    deleteUser,
    changePassword,
    changeUserClass,
    getUserClass,
    getTableCountByClass,
    getUserApiKey,
    verifyUserApiKey
};