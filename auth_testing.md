# Auth Testing Playbook (MarKendrick)

Step 1: MongoDB
- db.users.find({role:"admin"}) — hash starts with $2b$, unique index on users.email, index on login_attempts.identifier.

Step 2: API
- curl -c cookies.txt -X POST $API/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@markendrick.co","password":"MarKendrick#2026"}'
- curl -b cookies.txt $API/api/auth/me
- Expect user object + access_token/refresh_token httpOnly cookies.
