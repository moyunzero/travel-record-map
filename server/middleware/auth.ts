import { auth } from "~/lib/auth";

export default defineEventHandler(async (event) => {
  // 为所有请求获取 session 信息
  const session = await auth.api.getSession({
    headers: event.headers,
  });

  // 将用户信息设置到 event.context，供 API 使用
  if (session?.user) {
    event.context.user = session.user;
  }

  // 对于 dashboard 页面路由，如果未登录则重定向
  if (event.path.startsWith("/dashboard")) {
    if (!session?.user) {
      await sendRedirect(event, "/", 302);
    }
  }
});
