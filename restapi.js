function getAll(uid, method, table) {
    let queryDto = {
        method: method,
    };



}


/**
 * queryDto = {
 *     method: "select",
 *     table: "product",
 *     column: ["*"]
 *     where: [
 *         {attribute: "id", operator: "=", value: "3"},
 *         {attribute: "name", operator: "=", value: "test"}
 *     ]
 * }
 */

/**
 * queryDto = {
 *     method: "insert",
 *     table: "product",
 *     data: {
 *         name: "testname",
 *         price: 1000,
 *     }
 * }
 */

/**
 * queryDto = {
 *     method: "update",
 *     table: "product",
 *     set: [
 *         {attribute: "name", value: "testname"},
 *         {attribute: "price", value: 1234},
 *     ]
 *     where: [
 *         {attribute: "id", operator: "=", value: "3"},
 *         {attribute: "name", operator: "=", value: "test"}
 *     ]
 * }
 */

/**
 * queryDto = {
 *     method: "delete",
 *     table: "product",
 *     where: [
 *         {attribute: "id", operator: "=", value: "3"},
 *         {attribute: "name", operator: "=", value: "test"}
 *     ]
 * }
 */