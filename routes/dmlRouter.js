const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const dataHandler = require('../dbms/dataHandler');
const dataService = require('../dbms/dataService');

// api 사용 여부 확인 미들웨어
const checkApi = (req, res, next) => {
    const queryParts = req.params[0].split(';');
    const fromClause = queryParts.find(part => part.startsWith('from-'));
    
    if (!fromClause) {
        return res.status(400).json({ error: 'Invalid query format: missing from clause' });
    }
    
    const tableName = fromClause.split('-')[1];
    
    if (!tableName) {
        return res.status(400).json({ error: 'Invalid query format: missing table name' });
    }
    
    if (!dataService.isApiEnabled(req.params.uid, tableName)) {
        return res.status(403).json({ error: 'API is not enabled for this table' });
    }
    next();
};

router.get('/:uid/*', checkApi, asyncHandler(async (req, res) => {
    console.log("dmlRouter");
    console.log(req.params[0]);
    const result = await dataHandler.queryByDML(req.params.uid, req.params[0]);
    res.json(result);
}));

module.exports = router;