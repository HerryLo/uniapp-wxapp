<script>
	import {
		mapMutations
	} from 'vuex'
	import {
		version
	} from './package.json'

	export default {
		onLaunch: function() {
			// #ifdef H5
			console.log(
				`%c hello uniapp %c v${version} `,
				'background:#35495e ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff',
				'background:#007aff ;padding: 1px; border-radius: 0 3px 3px 0;  color: #fff; font-weight: bold;'
			)
			// #endif
			// 线上示例使用
			// console.log('%c uni-app官方团队诚邀优秀前端工程师加盟，一起打造更卓越的uni-app & uniCloud，欢迎投递简历到 hr2013@dcloud.io', 'color: red');
			console.log('App Launch');
			// #ifdef APP-PLUS
			// App平台检测升级，服务端代码是通过uniCloud的云函数实现的，详情可参考：https://ext.dcloud.net.cn/plugin?id=4542

			// 一键登录预登陆，可以显著提高登录速度
			uni.preLogin({
				provider: 'univerify',
				success: (res) => {
					// 成功
					this.setUniverifyErrorMsg();
					console.log("preLogin success: ", res);
				},
				fail: (res) => {
					this.setUniverifyLogin(false);
					this.setUniverifyErrorMsg(res.errMsg);
					// 失败
					console.log("preLogin fail res: ", res);
				}
			})
			// #endif
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		},
		globalData: {
			test: ''
		},
		methods: {
			...mapMutations(['setUniverifyErrorMsg', 'setUniverifyLogin'])
		}
	}
</script>

<style lang="scss">
</style>
