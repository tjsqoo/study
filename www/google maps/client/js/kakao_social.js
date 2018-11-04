//<![CDATA[
// 사용할 앱의 JavaScript 키를 설정해 주세요.
Kakao.init('YOUR APP KEY');
// 카카오 로그인 버튼을 생성합니다.
Kakao.Auth.createLoginButton({
    container: '#kakao-login-btn',
    success: function(authObj) {
    // 로그인 성공시, API를 호출합니다.
    Kakao.API.request({
        url: '/v1/friends',
        success: function(res) {
        alert(JSON.stringify(res));
        },
        fail: function(error) {
        alert(JSON.stringify(error));
        }
    });
    },
    fail: function(err) {
    alert(JSON.stringify(err));
    }
});
//]]>