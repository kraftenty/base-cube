const fs = require('fs');
const {Worker} = require('worker_threads');



// base 디렉토리 생성
function createDatabaseDirectory() {
    if (fs.existsSync('./database')) {
        return;
    }
    fs.mkdirSync('./database');
}

// 유저별 디렉토리 생성
function createDirectoryForUser(uid) {
    if (fs.existsSync(`./database/${uid}`)) {
        return;
    }
    fs.mkdirSync(`./database/${uid}`);
}


// 테이블 생성 및 초기화 함수
function createTable(uid, tableName, schema) {
    const filePath = `./database/${uid}/${tableName}.json`;
    if (fs.existsSync(filePath)) {
        return;
    }
    const tableStructure = {
        schema: schema,
        autovalue: 1,  // auto increment 시작값
        data: []
    };
    fs.writeFileSync(filePath, JSON.stringify(tableStructure, null, 2));
}

function isExists(data) {
    return (data !== undefined && data !== null && data !== '');
}


// 레코드 삽입 함수
function insertRecord(uid, tableName, data) {
    const filePath = `./database/${uid}/${tableName}.json`;
    const table = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // 각 필드별로 값 세팅, 제약조건 및 유효성 검사 처리
    for (const field of table.schema) {

        if (field.name in data) {
            // auto increment 필드는 직접 값 지정 불가
            if (field.autoinc) {
                throw new Error(`${field.name} 필드는 autoinc 필드이므로 값을 직접 지정할 수 없습니다.`);
            }
        } else if (field.autoinc) {
            // autoinc 세팅
            data[field.name] = table.autovalue;
        } else if (field.default !== false) {
            // default 세팅
            data[field.name] = field.default;
        } 
        
        // notempty 체크
        if (field.notempty && !isExists(data[field.name])) {
            throw new Error(`${field.name} 필드는 비어있을 수 없습니다.`);
        }

        // unique 체크
        if (field.unique && isExists(data[field.name])) {
            const isDuplicate = table.data.some(record => record[field.name] === data[field.name]);
            if (isDuplicate) {
                throw new Error(`${field.name} 필드는 고유해야 합니다. 중복된 값: ${data[field.name]}`);
            }
        }
    }
    
    // 데이터 추가
    table.data.push(data);
    table.autovalue++;
    
    // 파일 저장
    fs.writeFileSync(filePath, JSON.stringify(table, null, 2));
    return data;
}

// 모든 레코드 조회
function selectRecordAll(uid, tableName) {
    const filePath = `./database/${uid}/${tableName}.json`;
    const table = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return table.data;
}

// where 조건에 맞는 레코드 조회
function selectRecordWhere(uid, tableName, where) {
    const filePath = `./database/${uid}/${tableName}.json`;
    const table = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return table.data.filter(record => where.every(
        (condition) => {
            // 문자열로 들어온 값을 숫자로 변환해야 하는 경우 처리
            let recordValue = record[condition.attribute];
            let compareValue = condition.value;
            
            // 숫자 비교가 필요한 경우 형변환
            if (!isNaN(recordValue) && !isNaN(compareValue)) {
                recordValue = Number(recordValue);
                compareValue = Number(compareValue);
            }

            if (condition.operator === '=') {
                return recordValue === compareValue;
            } else if (condition.operator === '>') {
                return recordValue > compareValue;
            } else if (condition.operator === '<') {
                return recordValue < compareValue;
            } else if (condition.operator === '>=') {
                return recordValue >= compareValue;
            } else if (condition.operator === '<=') {
                return recordValue <= compareValue;
            } else if (condition.operator === '!=') {
                return recordValue !== compareValue;
            } else {
                throw new Error(`지원하지 않는 비교연산자: ${condition.operator}`);
            }
        }
    ));
}

// 레코드 수정
function updateRecord(uid, tableName, set, where) {
    const filePath = `./database/${uid}/${tableName}.json`;
    const table = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const updatedRecords = table.data.map(record => {
        // where 조건에 맞는 레코드인지 확인
        if (where.every(condition => {
            let recordValue = record[condition.attribute];
            let compareValue = condition.value;
            
            // 숫자 비교가 필요한 경우 형변환
            if (!isNaN(recordValue) && !isNaN(compareValue)) {
                recordValue = Number(recordValue);
                compareValue = Number(compareValue);
            }

            if (condition.operator === '=') {
                return recordValue === compareValue;
            } else if (condition.operator === '>') {
                return recordValue > compareValue;
            } else if (condition.operator === '<') {
                return recordValue < compareValue;
            } else if (condition.operator === '>=') {
                return recordValue >= compareValue;
            } else if (condition.operator === '<=') {
                return recordValue <= compareValue;
            } else if (condition.operator === '!=') {
                return recordValue !== compareValue;
            }
        })) {
            // set 리스트의 모든 업데이트 적용
            const updatedRecord = { ...record };
            set.forEach(update => {
                updatedRecord[update.attribute] = update.value;
            });
            return updatedRecord;
        }
        return record;
    });

    // 수정된 데이터로 테이블 업데이트
    table.data = updatedRecords;
    fs.writeFileSync(filePath, JSON.stringify(table, null, 2));
    return updatedRecords;
}


function deleteRecord(uid, tableName, where) {
    const filePath = `./database/${uid}/${tableName}.json`;
    const table = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    table.data = table.data.filter(record => !where.every(condition => {
        let recordValue = record[condition.attribute];
        let compareValue = condition.value;
        
        // 숫자 비교가 필요한 경우 형변환
        if (!isNaN(recordValue) && !isNaN(compareValue)) {
            recordValue = Number(recordValue);
            compareValue = Number(compareValue);
        }

        if (condition.operator === '=') {
            return recordValue === compareValue;
        } else if (condition.operator === '>') {
            return recordValue > compareValue;
        } else if (condition.operator === '<') {
            return recordValue < compareValue;
        } else if (condition.operator === '>=') {
            return recordValue >= compareValue;
        } else if (condition.operator === '<=') {
            return recordValue <= compareValue;
        } else if (condition.operator === '!=') {
            return recordValue !== compareValue;
        } else {
            throw new Error(`지원하지 않는 비교연산자: ${condition.operator}`);
        }
    }));
    fs.writeFileSync(filePath, JSON.stringify(table, null, 2));
    return table.data;
}


const testUid = "11111111";
const tableName = "products";

// 테스트 코드
function test() {
    // 테스트용 유저 디렉토리 생성
    createDirectoryForUser(testUid);

    // 테스트용 스키마 정의
    const testSchema = [
        {
            name: "id",
            autoinc: true,
            default: undefined,
            notempty: true,
            unique: true,
        },
        {
            name: "name",
            autoinc: false,
            default: "defaultname",
            notempty: true,
            unique: false,
        },
        {
            name: "price",
            autoinc: false,
            default: 0,
            notempty: true,
            unique: false,
        }
    ];

    // 테스트용 테이블 생성
    createTable(testUid, tableName, testSchema);

    // 테스트 데이터 추가
    const testData = {
        name: "테스트 상품",
        price: 1000
    };
    
    try {
        const result = insertRecord(testUid, tableName, testData);
        console.log("테스트 데이터 추가 성공:", result);
    } catch (error) {
        console.error("테스트 데이터 추가 실패:", error.message);
    }
}

function selectRecordAllTest() {
    const result = selectRecordAll(testUid, tableName);
    console.log("테스트 데이터 조회 성공:", result);
}

function selectRecordWhereTest() {
    const result = selectRecordWhere(testUid, tableName, [{attribute: "name", operator: "!=", value: "테스트 "}]);
    console.log("테스트 데이터 조회 성공:", result);
}

function updateRecordTest() {
    const result = updateRecord(testUid, tableName, [{attribute: "name", value: "edited"}, {attribute: "price", value: 3000}], [{attribute: "id", operator: ">=", value: "3"}]);
    console.log("테스트 데이터 수정 성공:", result);
}

function deleteRecordTest() {
    const result = deleteRecord(testUid, tableName, [{attribute: "id", operator: "=", value: "5"}]);
    console.log("테스트 데이터 삭제 성공:", result);
}

// 테스트 실행
// test();
// selectRecordAllTest();
// selectRecordWhereTest();
// updateRecordTest();
deleteRecordTest();