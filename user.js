const fs = require('fs');
const crypto = require('crypto');

function createUsersFile() {
    const filePath = './users.json';
    const initialData = {
        users: []
    };
    
    if (!fs.existsSync(filePath)) {
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
    const filePath = './users.json';
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
    const filePath = './users.json';
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // 이메일 중복 체크
    if (data.users.some(user => user.email === email)) {
        throw new Error('이미 존재하는 이메일입니다.');
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
    
    return uid;
}




module.exports = { createUsersFile };


// 예시: 새로운 유저 생성
console.log(verifyPassword("30fa41d0","12434" ))