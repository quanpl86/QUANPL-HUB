import { signToken } from "./src/lib/oauth-utils";
const access_token = signToken({ type: 'access', scope: 'blog:read' }, 60 * 60 * 1000);
console.log(access_token);
