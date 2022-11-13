const requestHttp = "https://www.yuque.com/api/v2";
const namespace = "yopai/pp6bv5";

const getYuQue = (url, data) => {
    return new Promise((resolve, reject) => {
        uni.request({
            url: `${requestHttp}${url}`,
            data,
            header: {
                'Content-Type': 'application/json',
                'X-Auth-Token': 'd6x2t2riUJrcOKujatJOruBzwxyLEAe7dQuAQtnJ'
            },
            success: (res) => {
                if(res.statusCode === 200) {
                    resolve(res.data);
                }else {
                    reject(err)
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