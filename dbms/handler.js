const accessor = require('./accessor');


function getResultFromManager(uid, query) {
    if (query.method === 'select') {
        if (query.where === undefined) {
            return accessor.selectRecordAll(uid, query);
        } else {
            return accessor.selectRecordWhere(uid, query);
        }
    } else if (query.method === 'insert') {
        return accessor.insertRecord(uid, query);
    } else if (query.method === 'update') {
        return accessor.updateRecord(uid, query);
    } else if (query.method === 'delete') {
        return accessor.deleteRecord(query);
    }
}

// REST API 형식으로 쿼리 처리
// api key는 header에 포함
// bearer: apikey.....

// api/uid/table [GET] ;전체 리스트 조회
// api/uid/table/pk [GET] ;단건 조회
// api/uid/table [POST] ;생성
// api/uid/table/pk [PUT] ;수정
// api/uid/table/pk [DELETE] ;삭제
function queryByRESTAPI(uid, query) {
    return getResultFromManager(uid, query);
}


// DML 형식으로 쿼리 처리
function queryByDML(uid, queryString) {
    if (uid === undefined || queryString === undefined) {
        throw new Error("uid 또는 queryString이 정의되지 않았습니다.");
    }
    const query = getQueryFromQueryString(queryString);
    return getResultFromManager(uid, query);
}

function getQueryFromQueryString(queryString) {
    let query = {};
    let queryArray = queryString.split(";").filter(str => str !== '');

    for (const queryElement of queryArray) {
        const [command, ...rest] = queryElement.split('-');
        
        switch(command) {
            case 'select':
            case 'insert': 
            case 'update':
            case 'delete':
                query.method = command;
                break;
                
            case 'from':
                query.from = rest[0];
                break;
                
            case 'set':
                query.set = parseSetClause(rest.join('-'));
                break;
                
            case 'value':
                query.value = parseValueClause(rest.join('-')); 
                break;
                
            case 'where':
                query.where = parseWhereClause(rest.join('-'));
                break;
                
            default:
                throw new Error(`유효하지 않은 명령어: ${command}`);
        }
    }

    return query;
}

function parseSetClause(setString) {
    return setString.split('-and-').map(condition => {
        const [attribute, operator, value] = condition.split('-');
        if (operator !== '=') {
            throw new Error(`set 절에 유효하지 않은 연산자: ${operator}`);
        }
        return {attribute, value};
    });
}

function parseValueClause(valueString) {
    const result = {};
    valueString.split('-and-').forEach(condition => {
        const [attribute, operator, value] = condition.split('-');
        if (operator !== '=') {
            throw new Error(`value 절에 유효하지 않은 연산자: ${operator}`); 
        }
        result[attribute] = value;
    });
    return result;
}

function parseWhereClause(whereString) {
    return whereString.split('-and-').map(condition => {
        const [attribute, operator, value] = condition.split('-');
        return {attribute, operator, value};
    });
}

module.exports = { queryByRESTAPI, queryByDML };