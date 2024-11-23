const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const dataHandler = require('../dbms/dataHandler');
const dataService = require('../dbms/dataService');
const userHandler = require('../user/userHandler');

// api/:uid/:table [GET] ;전체 리스트 조회
// api/:uid/:table/:pk [GET] ;단건 조회
// api/:uid/:table [POST] ;생성
// api/:uid/:table/:pk [PUT] ;수정
// api/:uid/:table/:pk [DELETE] ;삭제

// api key 검증 미들웨어
const verifyApiKey = (req, res, next) => {
    const apiKey = req.headers.key;
    if (!apiKey) {
        return res.status(401).json({ error: 'API key is required' });
    }
    if (!userHandler.verifyUserApiKey(req.params.uid, apiKey)) {
        return res.status(401).json({ error: 'Invalid API key' });
    }
    next();
};

// api 사용 여부 확인 미들웨어
const checkApi = (req, res, next) => {
    if (!dataService.isApiEnabled(req.params.uid, req.params.table)) {
        return res.status(403).json({ error: 'API is not enabled for this table' });
    }
    next();
};

router.route('/:uid/:table')
    .get(verifyApiKey, checkApi, asyncHandler(async (req, res) => {
        const { uid, table } = req.params;
        const result = dataHandler.getAllListByRESTAPI(uid, table);
        res.json(result);
    }))
    .post(verifyApiKey, checkApi, asyncHandler(async (req, res) => {
        const { uid, table } = req.params;
        await dataHandler.createByRESTAPI(uid, table, req.body);
        res.sendStatus(200);
    }));

router.route('/:uid/:table/:pk')
    .get(verifyApiKey, checkApi, asyncHandler(async (req, res) => {
        const { uid, table, pk } = req.params;
        const result = await dataHandler.getOneByRESTAPI(uid, table, pk);
        res.json(result);
    }))
    .put(verifyApiKey, checkApi, asyncHandler(async (req, res) => {
        const { uid, table, pk } = req.params;
        await dataHandler.updateByRESTAPI(uid, table, pk, req.body);
        res.sendStatus(200);
    }))
    .delete(verifyApiKey, checkApi, asyncHandler(async (req, res) => {
        const { uid, table, pk } = req.params;
        await dataHandler.deleteByRESTAPI(uid, table, pk);
        res.sendStatus(200);
    }));

module.exports = router;