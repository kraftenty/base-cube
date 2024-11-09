const { createTable, insertRecord, selectRecordAll, selectRecordWhere, updateRecord, deleteRecord } = require('./dataAccessor');

/**
 * query = {
 *     method: "select",
 *     from: "product",
 *     where: [
 *         {attribute: "id", operator: "=", value: "3"},
 *         {attribute: "name", operator: "=", value: "test"}
 *     ]
 * }
 * 
 * queryString = "select;from-product;where-id-=-3-and-name-=-test"
 */

/**
 * query = {
 *     method: "insert",
 *     from: "product",
 *     value: {
 *         name: "testname",
 *         price: 1000,
 *     }
 * }
 * 
 * queryString = "insert;from-product;value-name-=-testname-and-price-=-1000"
 */

/**
 * query = {
 *     method: "update",
 *     from: "product",
 *     set: [
 *         {attribute: "name", value: "testname"},
 *         {attribute: "price", value: 1234},
 *     ]
 *     where: [
 *         {attribute: "id", operator: "=", value: "3"},
 *         {attribute: "name", operator: "=", value: "test"}
 *     ]
 * }
 * 
 * queryString = "update;from-product;set-name-=-testname-and-price-=-1234;where-id-=-3-and-name-=-test"
 */

/**
 * query = {
 *     method: "delete",
 *     from: "product",
 *     where: [
 *         {attribute: "id", operator: "=", value: "3"},
 *         {attribute: "name", operator: "=", value: "test"}
 *     ]
 * }
 * 
 * queryString = "delete;from-product;where-id-=-3-and-name-=-test"
 */

/**
 * queryString
 * 단건 조회: select-from-${product}-where-${id}-${=}-${3}
 */



////////////////////// 테스트 코드//////////////////


const testUid = "11111111";
const tableName = "products";

// 테스트 코드
function createRecordTest() {

    // 테스트용 유저 디렉토리 생성
    createDirectoryForUser(testUid);

    // 테스트용 스키마 정의
    const testSchema = [
        {
            name: "id",
            primary: true,
            autoinc: true,
            notempty: true,
        },
        {
            name: "name",
            primary: false,
            autoinc: false,
            notempty: true,
        },
        {
            name: "price",
            primary: false,
            autoinc: false,
            notempty: true,
        }
    ];

    // 테스트용 테이블 생성
    createTable(testUid, tableName, testSchema);

    const query = {
        method: "insert",
        from: tableName,
        value: 
            {
                name: "테스트 상품",
                price: 1000
            }
    }

    
    try {
        const result = insertRecord(testUid, query);
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
    const result = selectRecordWhere(testUid, tableName, [{attribute: "price", operator: "<=", value: 3000}]);
    console.log("테스트 데이터 조회 성공:", result);
}

function updateRecordTest() {
    const query = {
        method: "update",
        from: tableName,
        set: [{attribute: "name", value: "뉴수정2"}, {attribute: "price", value: 3001}],
        where: [{attribute: "price", operator: ">=", value: "3000"}]
    }
    const result = updateRecord(testUid, query);
    console.log("테스트 데이터 수정 성공:", result);
}

function deleteRecordTest() {
    const result = deleteRecord(testUid, tableName, [{attribute: "id", operator: "=", value: "5"}]);
    console.log("테스트 데이터 삭제 성공:", result);
}

// 테스트 실행
createRecordTest();
// selectRecordAllTest();
// selectRecordWhereTest();
// updateRecordTest();
// deleteRecordTest();
