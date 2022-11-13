const requestHttp = "https://www.yuque.com/api/v2";
const namespace = "yopai/pp6bv5";

const getYuQue = (url, data) => {
    return new Promise((resolve, reject) => {
        uni.request({
            url: `${requestHttp}${url}`,
            data,
            header: {
                "Content-Type": "application/json",
                "X-Auth-Token": "d6x2t2riUJrcOKujatJOruBzwxyLEAe7dQuAQtnJ",
                "User-Agent": "HerryLo的博客",
            }
        });
    });
};

// 获取一个仓库的文档列表
export const getRepoDocsList = () => {
    // /repos/:namespace/docs
    return getYuQue(`/repos/${namespace}/docs`, {
        "offset": 0,
        "limit": 5,
        "optional_properties": "hits"
    });
};