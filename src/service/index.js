import { requestHttp, namespace, AuthToken } from '../utils/constant.js';

const getYuQue = (url, data) => {
    return new Promise((resolve, reject) => {
        uni.request({
            url: `${requestHttp}${url}`,
            data,
            header: {
                'Content-Type': 'application/json',
                'X-Auth-Token': AuthToken
            },
            success: (res) => {
                if(res.statusCode === 200) {
                    resolve(res.data);
                }else {
                    reject(res)
                }
            },
            fail: (err) => {
                reject(err)
            }
        });
    });
};

// 获取一个仓库的文档列表
export const getRepoDocsList = ({ offset, limit }) => {
    // /repos/:namespace/docs
    return getYuQue(`/repos/${namespace}/docs`, {
        offset,
        limit,
        "optional_properties": "hits"
    });
};

// 获取单篇文档的详细信息
export const getDocsDetail = ({ slug }) => {
    // /repos/:namespace/docs/:slug
    return getYuQue(`/repos/${namespace}/docs/${slug}`);
};

// 获取知识库详情
export const getRepos = () => {
    // /repos/:namespace
    return getYuQue(`/repos/${namespace}`);
};