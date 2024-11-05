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
    
    const newUser = {
        uid,
        email,
        password: hash,
        salt,
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

// 유저 삭제
function deleteUser(uid) {
    const filePath = createUsersFileAndGetFilePath();
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.users = data.users.filter(user => user.uid !== uid);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = { getUserByEmailAndPassword, getEmailByUid, addUser, deleteUser, changePassword };