const fs = require('fs');

function getDatabasePath(uid) {
    return `./dbms/database/${uid}`;
}

// database 디렉토리 생성
function createDatabaseDirectory() {
    if (fs.existsSync('./dbms/database')) {
        return;
    }
    fs.mkdirSync('./dbms/database');
}

// 유저별 디렉토리 생성
function createDirectoryForUser(uid) {
    if (fs.existsSync(getDatabasePath(uid))) {
        return;
    }
    fs.mkdirSync(getDatabasePath(uid));
}

// 테이블 생성 및 초기화 함수
function createTable(uid, tableName, schema) {
    // 데이터베이스 디렉토리 생성
    createDatabaseDirectory();
    
    // 유저 디렉토리 생성
    createDirectoryForUser(uid);
    
    const filePath = `${getDatabasePath(uid)}/${tableName}.json`;
    if (fs.existsSync(filePath)) {
        return;
    }

    // 스키마에 primary 필드가 있는지 확인
    const primaryField = schema.find(field => field.primary);
    if (!primaryField) {
        throw new Error("스키마에 primary 필드가 정의되지 않았습니다.");
    }

    const tableStructure = {
        schema: schema,
        api: false, // api 사용 여부
        autoincvalue: 1,  // auto increment 시작값
        data: []
    };
    fs.writeFileSync(filePath, JSON.stringify(tableStructure, null, 2));
}

// 테이블 삭제 함수
function dropTable(uid, tableName) {
    const filePath = `${getDatabasePath(uid)}/${tableName}.json`;
    if (!fs.existsSync(filePath)) {
        return;
    }
    fs.unlinkSync(filePath);
}

// 자바스크립트의 이상한 boolean 체크에 대응하기 위한 함수
function exists(data) {
    return (data !== undefined && data !== null && data !== '');
}

// 레코드와 condition 비교 내부 함수
function compareRecordByCondition(record, condition) {
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

// 테이블 스키마 조회
function selectTableSchema(uid, query) {
    const { from } = query;
    const filePath = `${getDatabasePath(uid)}/${from}.json`;
    if (!fs.existsSync(filePath)) {
        throw new Error(`${from} 테이블이 존재하지 않습니다.`);
    }
    const table = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return table.schema;
}


// 레코드 삽입 함수
function insertRecord(uid, query) {
    const { from, value } = query;

    const filePath = `${getDatabasePath(uid)}/${from}.json`;
    if (!fs.existsSync(filePath)) {
        throw new Error(`${from} 테이블이 존재하지 않습니다.`);
    }
    const table = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // 각 필드별로 값 세팅, 제약조건 및 유효성 검사 처리
    for (const field of table.schema) {
        if (field.name in value) {
            // auto increment 필드는 직접 값 지정 불가
            if (field.autoinc) {
                throw new Error(`${field.name} 필드는 autoinc 필드이므로 값을 직접 지정할 수 없습니다.`);
            }

            // 대시 문자 체크
            if (typeof value[field.name] === 'string' && value[field.name].includes('-')) {
                throw new Error(`${field.name} 필드에 대시('-') 문자를 포함할 수 없습니다.`);
            }
        } else if (field.autoinc) {
            // autoinc 세팅
            value[field.name] = table.autoincvalue;
        }
        
        // notempty 체크
        if (field.notempty && !exists(value[field.name])) {
            throw new Error(`${field.name} 필드는 비어있을 수 없습니다.`);
        }

        // primary key 체크
        if (field.primary && !field.autoinc) {
            if (!exists(value[field.name])) {
                throw new Error(`Primary key ${field.name}는 반드시 값이 있어야 합니다.`);
            }
            
            const isDuplicate = table.data.some(record => record[field.name] === value[field.name]);
            if (isDuplicate) {
                throw new Error(`Primary key ${field.name}는 고유해야 합니다. 중복된 값: ${value[field.name]}`);
            }
        }
    }
    
    // 데이터 추가
    table.data.push(value);
    table.autoincvalue++;
    
    // 파일 저장
    fs.writeFileSync(filePath, JSON.stringify(table, null, 2));
    return value;
}

// 모든 레코드 조회
function selectRecordAll(uid, query) {
    const { from } = query;

    // 필수 필드 검증 
    if (!from) {
        throw new Error("from 테이블이 정의되지 않았습니다.");
    }

    const filePath = `${getDatabasePath(uid)}/${from}.json`;
    if (!fs.existsSync(filePath)) {
        throw new Error(`${from} 테이블이 존재하지 않습니다.`);
    }

    const table = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return table.data;
}



// where 조건에 맞는 레코드 조회
function selectRecordWhere(uid, query) {
    const { from, where } = query;

    if (!from) {
        throw new Error("from 테이블이 정의되지 않았습니다.");
    }
    if (!where) {
        throw new Error("where 조건이 정의되지 않았습니다.");
    }

    const filePath = `${getDatabasePath(uid)}/${from}.json`;
    if (!fs.existsSync(filePath)) {
        throw new Error(`${from} 테이블이 존재하지 않습니다.`);
    }
    const table = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    return table.data.filter(record => 
        where.every(condition => compareRecordByCondition(record, condition))
    );
}

// 레코드 수정
function updateRecord(uid, query) {
    const { from, where, set } = query;

    const filePath = `${getDatabasePath(uid)}/${from}.json`;
    if (!fs.existsSync(filePath)) {
        throw new Error(`${from} 테이블이 존재하지 않습니다.`);
    }
    const table = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const updatedRows = [];
    const updatedRecords = table.data.map(record => {
        // where 조건에 맞는 레코드인지 확인
        if (where.every(condition => compareRecordByCondition(record, condition))) {
            // set 리스트의 모든 업데이트 적용
            const updatedRecord = { ...record };
            
            // 업데이트할 값들에 대한 제약조건 및 유효성 검사
            for (const update of set) {
                const field = table.schema.find(f => f.name === update.attribute);
                
                if (field) {
                    // auto increment 필드는 직접 값 지정 불가
                    if (field.autoinc) {
                        throw new Error(`${field.name} 필드는 autoinc 필드이므로 값을 직접 수정할 수 없습니다.`);
                    }

                    // 대시 문자 체크
                    if (typeof update.value === 'string' && update.value.includes('-')) {
                        throw new Error(`${field.name} 필드에 대시('-') 문자를 포함할 수 없습니다.`);
                    }

                    // notempty 체크
                    if (field.notempty && !exists(update.value)) {
                        throw new Error(`${field.name} 필드는 비어있을 수 없습니다.`);
                    }

                    // primary key 체크
                    if (field.primary) {
                        if (!exists(update.value)) {
                            throw new Error(`Primary key ${field.name}는 반드시 값이 있어야 합니다.`);
                        }
                        
                        const isDuplicate = table.data.some(r => 
                            r[field.name] === update.value && r !== record
                        );
                        if (isDuplicate) {
                            throw new Error(`Primary key ${field.name}는 고유해야 합니다. 중복된 값: ${update.value}`);
                        }
                    }

                    updatedRecord[update.attribute] = update.value;
                }
            }
            updatedRows.push(updatedRecord);
            return updatedRecord;
        }
        return record;
    });

    // 수정된 데이터로 테이블 업데이트
    table.data = updatedRecords;
    fs.writeFileSync(filePath, JSON.stringify(table, null, 2));
    return updatedRows;
}


// 레코드 삭제
function deleteRecord(uid, query) {
    const { from, where } = query;

    if (!from) {
        throw new Error("from 테이블이 정의되지 않았습니다.");
    }
    if (!where) {
        throw new Error("where 조건이 정의되지 않았습니다.");
    }

    const filePath = `${getDatabasePath(uid)}/${from}.json`;
    if (!fs.existsSync(filePath)) {
        throw new Error(`${from} 테이블이 존재하지 않습니다.`);
    }
    const table = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    table.data = table.data.filter(record => !where.every(condition => compareRecordByCondition(record, condition)));
    fs.writeFileSync(filePath, JSON.stringify(table, null, 2));
}

// api 사용 여부 설정
function setApiOpen(uid, tableName, bool) {
    const filePath = `${getDatabasePath(uid)}/${tableName}.json`;
    const table = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    table.api = bool;
    fs.writeFileSync(filePath, JSON.stringify(table, null, 2));
}

// api 사용 여부 조회
function isApiEnabled(uid, tableName) {
    const filePath = `${getDatabasePath(uid)}/${tableName}.json`;
    const table = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return table.api;
}

module.exports = {
    getDatabasePath,
    createDatabaseDirectory,
    createDirectoryForUser,
    createTable,
    insertRecord,
    selectRecordAll,
    selectRecordWhere,
    updateRecord,
    deleteRecord,
    selectTableSchema,
    dropTable,
    setApiOpen,
    isApiEnabled
}