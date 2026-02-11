
⸻

백엔드 엔드포인트 맵 (실제 로그 기반)

Base
	•	서버: http://localhost:4000
	•	API prefix: /api

⸻

1) Projects

✅ GET /api/projects

프로젝트 리스트 조회

예시

curl "http://localhost:4000/api/projects"

응답 예시(형태)

[
  {
    "id": "c1a60a8c-b368-4eaf-b82d-9a4c0e60bc84",
    "title": "Save the Ocean",
    "thumbnailUrl": "/uploads/upload-...jpg",
    "raisedAmount": 120,
    "goalAmount": 1000
  }
]


⸻

✅ GET /api/projects/:id

프로젝트 상세 조회

예시

curl "http://localhost:4000/api/projects/c1a60a8c-b368-4eaf-b82d-9a4c0e60bc84"

네 로그에서도 GET /api/projects/<uuid> 200 ... - 619 이런 식으로 찍힘.

⸻

✅ GET /api/projects/:id/access

프로젝트 접근성/권한/상태 체크(추정)
네 로그에 엄청 자주 찍히는 엔드포인트.

예시

curl "http://localhost:4000/api/projects/c1a60a8c-b368-4eaf-b82d-9a4c0e60bc84/access"

응답 로그에서 바이트
	•	200 ... - 73 정도 → 짧은 JSON일 확률 높음

⸻

2) Funding (후원 기록/조회)

✅ GET /api/funding/:projectId?page=&limit=

특정 프로젝트의 후원 내역(히스토리) 조회 + 페이지네이션

예시

curl "http://localhost:4000/api/funding/c1a60a8c-b368-4eaf-b82d-9a4c0e60bc84?page=1&limit=10"

네 로그에서도:
	•	[funding] projectId raw = "..."
	•	[funding] project found = true
	•	GET /api/funding/<uuid> 200 ... - 200 찍힘 → 정상 동작 확정

응답 예시(형태)

{
  "items": [
    {
      "id": "fnd_001",
      "projectId": "c1a6...",
      "donorWalletAddress": "0x123...",
      "amount": 50,
      "txHash": "0xabc...",
      "createdAt": "2026-02-03T00:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 1,
  "summary": {
    "totalRaised": 50,
    "supporters": 1
  }
}


⸻

✅ POST /api/funding/:projectId

후원 기록 생성(보통 “컨트랙트 송금 성공 후 DB 기록용”)

예시

curl -X POST "http://localhost:4000/api/funding/c1a60a8c-b368-4eaf-b82d-9a4c0e60bc84" \
  -H "Content-Type: application/json" \
  -d '{
    "donorWalletAddress": "0x123...",
    "amount": 50,
    "txHash": "0xabc...",
    "rewardId": "rw_001"
  }'

여기서 중요한 점: FE의 FundingApi.create()가 body를 JSON.stringify 해서 보내는지(혹은 api 래퍼가 해주는지) 확인 필요.
안 해주면 백엔드가 JSON으로 못 받아서 400/415 뜰 수 있음.

⸻

3) Uploads (정적 파일 서빙)

✅ GET /uploads/:filename

업로드된 이미지 접근(정적 서빙)

네 로그에서도:
	•	GET /uploads/upload-1769841977991-151123026.JPG 304 ...

예시

curl -I "http://localhost:4000/uploads/upload-1769841977991-151123026.JPG"


⸻

4) Health / Upload API (경로는 파일로만 확인됨)

트리에 src/routes/health.route.js, src/routes/upload.route.js는 있는데, 로그엔 호출이 없어서 “정확한 path”는 확인이 필요해.

확인 방법(30초 컷)
터미널에서:

sed -n '1,200p' src/routes/index.js

또는

sed -n '1,200p' src/app.js

여기서 app.use('/api/health', ...) / app.use('/api/upload', ...) 같은 마운트 경로가 바로 나옴.

보통 관례상은 이런 형태일 가능성이 높아:
	•	(추정) GET /api/health
	•	(추정) POST /api/upload

⸻

“그림”으로 한 번에 보는 요청 흐름

[Browser / FE] 
   |
   | 1) 프로젝트 목록
   +--> GET http://localhost:4000/api/projects
   |
   | 2) 상세 진입
   +--> GET http://localhost:4000/api/projects/:id
   |
   | 3) 접근 체크(상태/권한)
   +--> GET http://localhost:4000/api/projects/:id/access
   |
   | 4) 후원 패널 열면 히스토리 조회
   +--> GET http://localhost:4000/api/funding/:projectId?page=&limit=
   |
   | 5) (나중에) 컨트랙트 송금 성공 후 DB 기록
   +--> POST http://localhost:4000/api/funding/:projectId
   |
   | 6) 이미지 표시
   +--> GET http://localhost:4000/uploads/<filename>


⸻

README에 그대로 넣을 “엔드포인트 예시 섹션” (복붙용)

### Example Requests

#### List projects
```bash
curl "http://localhost:4000/api/projects"

Get project detail

curl "http://localhost:4000/api/projects/<projectId>"

Check project access

curl "http://localhost:4000/api/projects/<projectId>/access"

Get funding history (paged)

curl "http://localhost:4000/api/funding/<projectId>?page=1&limit=10"

Create funding record (after on-chain tx success)

curl -X POST "http://localhost:4000/api/funding/<projectId>" \
  -H "Content-Type: application/json" \
  -d '{
    "donorWalletAddress":"0x123...",
    "amount":50,
    "txHash":"0xabc...",
    "rewardId":"rw_001"
  }'

Fetch uploaded image

curl -I "http://localhost:4000/uploads/<filename>"

---