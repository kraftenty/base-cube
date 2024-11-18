const fs = require('fs');
const dataAccessor = require('./dataAccessor');

function getAllTablesByUid(uid) {
    dataAccessor.createDatabaseDirectory();
    dataAccessor.createDirectoryForUser(uid);
    const filePath = dataAccessor.getDatabasePath(uid);
    const files = fs.readdirSync(filePath);
    return files.map(file => file.replace('.json', ''));
}

// 테이블이 있는지 확인
function isTableExists(uid, tableName) {
    const tables = getAllTablesByUid(uid);
    return tables.includes(tableName);
}

// 테이블 개수 리턴
function getTableCount(uid) {
    const tables = getAllTablesByUid(uid);
    return tables.length;
}

function createTableForUser(uid, body) {
    const { tableName, schema } = body;
    
    // 문자열 'true'를 boolean true로 변환
    const processedSchema = schema.map(column => {
        const processedColumn = { ...column };
        if (processedColumn.autoinc === 'true')  processedColumn.autoinc = true;
        if (processedColumn.notempty === 'true') processedColumn.notempty = true;
        if (processedColumn.primary === 'true') processedColumn.primary = true;
        return processedColumn;
    });

    dataAccessor.createTable(uid, tableName, processedSchema);
}

function getTableSchemaForUser(uid, tableName) {
    return dataAccessor.selectTableSchema(uid, { from : tableName });
}

function getTableDataForUser(uid, tableName) {
    return dataAccessor.selectRecordAll(uid, { from: tableName });
}

function getRecordForUser(uid, tableName, primarykey) {
    // schema에서 primarykey가 걸려있는 컬럼을 찾아서 그 컬럼의 값이 primarykey와 일치하는 레코드를 조회
    const schema = getTableSchemaForUser(uid, tableName);
    const primaryKeyColumn = schema.find(column => column.primary);
    //  {attribute: "name", operator: "=", value: "test"}
    return dataAccessor.selectRecordWhere(uid, { from: tableName, where: [{ attribute: primaryKeyColumn.name, operator: "=", value: primarykey }] });
}

function insertRecord(uid, tableName, body) {
    let query = {
        method: 'insert',
        from: tableName,
        value: body
    }
    return dataAccessor.insertRecord(uid, query);
}
function updateRecord(uid, tableName, primarykey, body) {
    // 스키마에서 primary key 필드 찾기
    const schema = getTableSchemaForUser(uid, tableName);
    const primaryKeyField = schema.find(field => field.primary);
    
    let query = {
        method: 'update',
        from: tableName,
        set: Object.entries(body).map(([attribute, value]) => ({
            attribute: attribute,
            value: value
        })),
        where: [{ 
            attribute: primaryKeyField.name,  // primary key 필드 이름 사용
            operator: "=", 
            value: primarykey 
        }]
    }
    console.log(`--------updateRecord--------`);
    console.log(query);
    return dataAccessor.updateRecord(uid, query);
}

function deleteRecord(uid, tableName, primarykey) {
     // 스키마에서 primary key 필드 찾기
    const schema = getTableSchemaForUser(uid, tableName);
    const primaryKeyField = schema.find(field => field.primary);
    return dataAccessor.deleteRecord(uid, { from: tableName, where: [{ attribute: primaryKeyField.name, operator: "=", value: primarykey }] });
}

function dropTableForUser(uid, tableName) {
    return dataAccessor.dropTable(uid, tableName);
}

module.exports = {
    getAllTablesByUid,
    createTableForUser,
    getTableDataForUser,
    getTableSchemaForUser,
    dropTableForUser,
    insertRecord,
    getRecordForUser,
    updateRecord,
    deleteRecord,
    isTableExists,
    getTableCount
};
