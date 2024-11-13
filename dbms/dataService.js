const fs = require('fs');
const dataAccessor = require('./dataAccessor');

function getAllTablesByUid(uid) {
    dataAccessor.createDatabaseDirectory();
    dataAccessor.createDirectoryForUser(uid);
    const filePath = dataAccessor.getDatabasePath(uid);
    const files = fs.readdirSync(filePath);
    return files.map(file => file.replace('.json', ''));
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

function dropTableForUser(uid, tableName) {
    return dataAccessor.dropTable(uid, tableName);
}

function insertRecord(uid, tableName, body) {
    let query = {
        method: 'insert',
        from: tableName,
        value: body
    }
    return dataAccessor.insertRecord(uid, query);
}

module.exports = {
    getAllTablesByUid,
    createTableForUser,
    getTableDataForUser,
    getTableSchemaForUser,
    dropTableForUser,
    insertRecord
};